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
  /** Session URL from the WHEP Location header, used for DELETE on stop. */
  sessionUrl: string | null
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
  /** Session URL from the WHIP Location header, used for DELETE on stop. */
  private publishSessionUrl: string | null = null
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
   * Publish the given stream via WHIP (POST offer SDP as plain text).
   * The caller keeps ownership of the stream (typically the local camera),
   * so stopping the publish never stops the camera.
   * Returns the session URL from the Location header.
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
      // WHIP: offer SDP goes out as text/plain body, the answer SDP comes back
      // in the response body and the session URL is in the Location header.
      const response = await http.post<string>(
        `/whip/${encodeURIComponent(options.roomId)}/${encodeURIComponent(options.uid)}`,
        pc.localDescription?.sdp || '',
        { headers: { 'Content-Type': 'application/sdp' } }
      )

      const location = response.headers['location']
      if (typeof location !== 'string' || !location) {
        throw new Error('WHIP publish response missing Location header')
      }
      this.publishSessionUrl = location

      const answer = new RTCSessionDescription({ type: 'answer', sdp: String(response.data) })
      await pc.setRemoteDescription(answer)
      return location
    } catch (error) {
      pc.close()
      this.peerConnection = null
      this.publishSessionUrl = null
      throw error
    }
  }

  async stopPublish(): Promise<void> {
    const pc = this.peerConnection
    this.peerConnection = null
    const sessionUrl = this.publishSessionUrl
    this.publishSessionUrl = null
    pc?.close()
    await this.deleteSessionUrl(sessionUrl, 'WHIP unpublish')
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
   * Start playing a remote stream via WHEP (POST offer SDP as plain text).
   * Each uid owns an independent peer connection, so multiple users can be
   * played at the same time. Returns a MediaStream immediately; tracks are
   * attached as they arrive.
   */
  async startPlay(uid: string, options: Dty.PlayOptions): Promise<MediaStream> {
    const pc = new RTCPeerConnection({ iceServers: options.iceServers ?? DEFAULT_ICE_SERVERS })
    const stream = new MediaStream()
    const session: PlaySession = { pc, stream, sessionUrl: null }
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

      // WHEP: same SDP-over-HTTP semantics as WHIP, keyed by room and stream.
      const response = await http.post<string>(
        `/whep/${encodeURIComponent(options.roomId)}/${encodeURIComponent(options.streamId)}`,
        pc.localDescription?.sdp || '',
        { headers: { 'Content-Type': 'application/sdp' } }
      )

      const location = response.headers['location']
      if (typeof location !== 'string' || !location) {
        throw new Error('WHEP play response missing Location header')
      }
      session.sessionUrl = location

      const answer = new RTCSessionDescription({ type: 'answer', sdp: String(response.data) })
      await pc.setRemoteDescription(answer)
      return stream
    } catch (error) {
      pc.close()
      this.playSessions.delete(uid)
      throw error
    }
  }

  async stopPlay(uid: string): Promise<void> {
    const session = this.playSessions.get(uid)
    if (!session) return
    this.playSessions.delete(uid)
    session.pc.close()
    await this.deleteSessionUrl(session.sessionUrl, 'WHEP stop play')
  }

  async stopAllPlays(): Promise<void> {
    const sessions = [...this.playSessions.values()]
    this.playSessions.clear()
    await Promise.all(
      sessions.map(async (session) => {
        session.pc.close()
        await this.deleteSessionUrl(session.sessionUrl, 'WHEP stop play')
      })
    )
  }

  hasPlay(uid: string): boolean {
    return this.playSessions.has(uid)
  }

  /**
   * DELETE the session URL returned in the Location header. Best effort:
   * the peer connection is already closed at this point, so a failed DELETE
   * must not break fire-and-forget callers.
   */
  private async deleteSessionUrl(sessionUrl: string | null, label: string): Promise<void> {
    if (!sessionUrl) return
    try {
      await http.delete(sessionUrl)
    } catch (error) {
      console.warn(`${label} DELETE failed:`, (error as Error).message)
    }
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
