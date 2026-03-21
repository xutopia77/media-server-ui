import axios from 'axios'
import * as Dty from './dataTypedef'

export class RtcApi {
  private peerConnection: RTCPeerConnection | null = null
  private stream: MediaStream | null = null
  private sessionId: string | null = null
  private streamurl: string = ''

  async startCamera(options: Dty.CameraOptions = {}): Promise<MediaStream> {
    const defaultOptions: Dty.CameraOptions = {
      width: 1280,
      height: 720,
      facingMode: 'user',
      audio: true
    }

    const finalOptions = { ...defaultOptions, ...options }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: finalOptions.width },
          height: { ideal: finalOptions.height },
          facingMode: finalOptions.facingMode
        },
        audio: finalOptions.audio
      })

      return this.stream
    } catch (error) {
      console.error('Error accessing camera:', error)
      throw error
    }
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }
  }

  getStream(): MediaStream | null {
    return this.stream
  }

  async switchCamera(facingMode: 'user' | 'environment'): Promise<MediaStream> {
    this.stopCamera()
    return this.startCamera({ facingMode })
  }

  async getAvailableCameras(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.filter((device) => device.kind === 'videoinput')
  }

  async getAvailableMicrophones(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.filter((device) => device.kind === 'audioinput')
  }

  async startPublish(stream: MediaStream, options: Dty.PublishOptions): Promise<string> {
    this.stream = stream
    this.streamurl = options.streamurl

    const iceServers = options.iceServers || [
      { urls: 'stun:stun.l.google.com:19302' }
    ]

    // this.peerConnection = new RTCPeerConnection({ iceServers })
    this.peerConnection = new RTCPeerConnection()

    stream.getTracks().forEach((track) => {
      this.peerConnection!.addTrack(track, stream)
    })

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate === null) {
        console.log('ICE gathering complete')
      }
    }

    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection?.connectionState)
    }

    const offer = await this.peerConnection.createOffer()
    await this.peerConnection.setLocalDescription(offer)

    await new Promise<void>((resolve) => {
      if (this.peerConnection?.iceGatheringState === 'complete') {
        resolve()
      } else {
        this.peerConnection!.onicegatheringstatechange = () => {
          if (this.peerConnection?.iceGatheringState === 'complete') {
            resolve()
          }
        }
      }
    })

    const request: Dty.PublishRequest = {
      streamurl: options.streamurl,
      sdp: this.peerConnection.localDescription?.sdp || '',
      clientip: options.clientip
    }

    try {
      const response = await axios.post<Dty.PublishResponse>('/api/v1/rtc/publish', request)

      if (response.data.code !== 0) {
        throw new Error(response.data.msg || 'Publish failed')
      }

      const answer = new RTCSessionDescription({
        type: 'answer',
        sdp: response.data.data.sdp
      })

      await this.peerConnection.setRemoteDescription(answer)
      this.sessionId = response.data.data.sessionid

      return this.sessionId
    } catch (error) {
      console.error('Error publishing stream:', error)
      this.stopPublish()
      throw error
    }
  }

  stopPublish(): void {
    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }

    this.sessionId = null
  }

  getSessionId(): string | null {
    return this.sessionId
  }

  getStreamurl(): string {
    return this.streamurl
  }

  getConnectionState(): RTCPeerConnectionState | undefined {
    return this.peerConnection?.connectionState
  }
}

export const createRtcApi = (): RtcApi => {
  return new RtcApi()
}
