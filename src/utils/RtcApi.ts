import http from '@/api/http'
import * as Dty from './dataTypedef'

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }]

const ICE_SERVER_PRESETS: Record<'stun' | 'both', RTCIceServer[]> = {
  stun: [{ urls: 'stun:stun.l.google.com:19302' }],
  both: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443'],
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ]
}

/** Resolve the settings-panel ICE preset into real RTCIceServer list. */
export function getIceServers(preset?: 'stun' | 'both'): RTCIceServer[] {
  return (preset && ICE_SERVER_PRESETS[preset]) || DEFAULT_ICE_SERVERS
}

interface PlaySession {
  pc: RTCPeerConnection
  stream: MediaStream
  sessionId: string | null
}

/** Wait for ICE gathering to finish, with a timeout so unreachable STUN servers never hang the flow. */
function waitIceGathering(pc: RTCPeerConnection, timeoutMs = 3000): Promise<void> {
  if (pc.iceGatheringState === 'complete') {
    return Promise.resolve()
  }
  return new Promise((resolve) => {
    let settled = false
    const done = () => {
      if (!settled) {
        settled = true
        resolve()
      }
    }
    pc.addEventListener('icegatheringstatechange', () => {
      if (pc.iceGatheringState === 'complete') {
        done()
      }
    })
    setTimeout(done, timeoutMs)
  })
}

export class RtcApi {
  private cameraStream: MediaStream | null = null
  private peerConnection: RTCPeerConnection | null = null
  private sessionId: string | null = null
  private playSessions = new Map<string, PlaySession>()

  // ---------------------------------------------------------------- camera

  async startCamera(options: Dty.CameraOptions = {}): Promise<MediaStream> {
    const video: MediaTrackConstraints = {
      width: { ideal: options.width ?? 1280 },
      height: { ideal: options.height ?? 720 }
    }
    if (options.facingMode) {
      video.facingMode = options.facingMode
    }
    if (options.frameRate) {
      video.frameRate = { ideal: options.frameRate }
    }

    const audio: MediaTrackConstraints | false =
      options.audio === false ? false : { noiseSuppression: options.noiseSuppression ?? true }

    this.cameraStream = await navigator.mediaDevices.getUserMedia({ video, audio })
    return this.cameraStream
  }

  stopCamera(): void {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((track) => track.stop())
      this.cameraStream = null
    }
  }

  getStream(): MediaStream | null {
    return this.cameraStream
  }

  // ---------------------------------------------------------------- publish

  /**
   * Publish the given stream. The caller keeps ownership of the stream
   * (typically the local camera), so stopping the publish never stops the camera.
   */
  async startPublish(stream: MediaStream, options: Dty.PublishOptions): Promise<string> {
    const pc = new RTCPeerConnection({ iceServers: options.iceServers ?? DEFAULT_ICE_SERVERS })
    this.peerConnection = pc

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream)
    })

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    await waitIceGathering(pc)

    try {
      const response = await http.post<Dty.PublishResponse>('/api/v1/rtc/publish', {
        streamurl: options.streamurl,
        sdp: pc.localDescription?.sdp || '',
        clientip: options.clientip
      })

      const answer = new RTCSessionDescription({ type: 'answer', sdp: response.data.sdp })
      await pc.setRemoteDescription(answer)
      this.sessionId = response.data.sessionid
      return this.sessionId
    } catch (error) {
      this.stopPublish()
      throw error
    }
  }

  stopPublish(): void {
    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }
    this.sessionId = null
  }

  isPublishing(): boolean {
    return this.peerConnection !== null
  }

  /** Replace the outgoing video track (used for screen sharing while publishing). */
  async replaceVideoTrack(track: MediaStreamTrack): Promise<void> {
    const sender = this.peerConnection?.getSenders().find((s) => s.track?.kind === 'video')
    if (sender) {
      await sender.replaceTrack(track)
    }
  }

  // ---------------------------------------------------------------- play (multi-session)

  /**
   * Start playing a remote stream. Each uid owns an independent peer connection,
   * so multiple users can be played at the same time.
   * Returns a MediaStream immediately; tracks are attached as they arrive.
   */
  async startPlay(uid: string, options: Dty.PlayOptions): Promise<MediaStream> {
    const pc = new RTCPeerConnection({ iceServers: options.iceServers ?? DEFAULT_ICE_SERVERS })
    const stream = new MediaStream()
    const session: PlaySession = { pc, stream, sessionId: null }
    this.playSessions.set(uid, session)

    // Play scenario: recvonly transceivers, audio first (SDP m-line order matters)
    pc.addTransceiver('audio', { direction: 'recvonly' })
    pc.addTransceiver('video', { direction: 'recvonly' })

    pc.ontrack = (event) => {
      stream.addTrack(event.track)
    }

    try {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      await waitIceGathering(pc)

      const response = await http.post<Dty.PlayResponse>('/api/v1/rtc/play', {
        streamurl: options.streamurl,
        sdp: pc.localDescription?.sdp || '',
        clientip: options.clientip
      })

      const answer = new RTCSessionDescription({ type: 'answer', sdp: response.data.sdp })
      await pc.setRemoteDescription(answer)
      session.sessionId = response.data.sessionid
      return stream
    } catch (error) {
      pc.close()
      this.playSessions.delete(uid)
      throw error
    }
  }

  stopPlay(uid: string): void {
    const session = this.playSessions.get(uid)
    if (session) {
      session.pc.close()
      this.playSessions.delete(uid)
    }
  }

  stopAllPlays(): void {
    this.playSessions.forEach((session) => session.pc.close())
    this.playSessions.clear()
  }

  hasPlay(uid: string): boolean {
    return this.playSessions.has(uid)
  }

  // ---------------------------------------------------------------- debug commands

  async runCmd(cmd: string, data?: string): Promise<Dty.RunCmdResponse> {
    const response = await http.post<Dty.RunCmdResponse>('/api/v1/run_cmd', { cmd, data })
    return response.data
  }
}

let rtcApiInstance: RtcApi | null = null

export const createRtcApi = (): RtcApi => {
  if (!rtcApiInstance) {
    rtcApiInstance = new RtcApi()
  }
  return rtcApiInstance
}
