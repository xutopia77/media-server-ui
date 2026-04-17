import axios from 'axios'
import * as Dty from './dataTypedef'

export class RtcApi {
  private peerConnection: RTCPeerConnection | null = null
  private stream: MediaStream | null = null
  private sessionId: string | null = null
  private streamurl: string = ''
  private playPeerConnection: RTCPeerConnection | null = null
  private playStream: MediaStream | null = null
  private playSessionId: string | null = null
  private currentRoom: { roomId: string; uid: string } | null = null

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
        throw new Error('Publish failed')
      }

      const answer = new RTCSessionDescription({
        type: 'answer',
        sdp: response.data.sdp
      })

      await this.peerConnection.setRemoteDescription(answer)
      this.sessionId = response.data.sessionid

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

  async getRoomInfo(): Promise<Dty.RoomInfo> {
    try {
      const response = await axios.get<Dty.RoomResponse>('/api/v1/rtc/room')

      if (response.data.code !== 0) {
        throw new Error('Get room info failed')
      }

      return response.data.data
    } catch (error) {
      console.error('Error getting room info:', error)
      throw error
    }
  }

  async joinRoom(request: Dty.JoinRoomRequest): Promise<void> {
    if (this.currentRoom && 
        this.currentRoom.roomId === request.roomId && 
        this.currentRoom.uid === request.uid) {
      console.log('Already in room, skipping join request:', request.roomId, request.uid)
      return
    }

    try {
      const response = await axios.post<Dty.JoinRoomResponse>('/api/v1/rtc/room/join', request)

      if (response.data.code !== 0) {
        const errorMsg = response.data.desc || 'Join room failed'
        if (errorMsg.includes('already in room')) {
          console.log('User already in room, considering as success:', request.roomId, request.uid)
          this.currentRoom = { roomId: request.roomId, uid: request.uid }
          return
        }
        throw new Error(errorMsg)
      }

      this.currentRoom = { roomId: request.roomId, uid: request.uid }
      console.log('Join room successful:', request.roomId, request.uid)
    } catch (error) {
      console.error('Error joining room:', error)
      throw error
    }
  }

  async leaveRoom(request: Dty.LeaveRoomRequest): Promise<void> {
    try {
      const response = await axios.post<Dty.LeaveRoomResponse>('/api/v1/rtc/room/leave', request)

      if (response.data.code !== 0) {
        throw new Error(response.data.desc || 'Leave room failed')
      }

      this.currentRoom = null
      console.log('Leave room successful:', request.roomId, request.uid)
    } catch (error) {
      console.error('Error leaving room:', error)
      throw error
    }
  }

  async keepAlive(request: Dty.KeepAliveRequest): Promise<void> {
    try {
      const response = await axios.post<Dty.KeepAliveResponse>('/api/v1/rtc/room/keepalive', request)

      if (response.data.code !== 0) {
        throw new Error(response.data.desc || 'Keep alive failed')
      }
    } catch (error) {
      console.error('Error sending keep alive:', error)
      throw error
    }
  }

  async startPlay(options: Dty.PlayOptions): Promise<MediaStream> {
    console.log('=== startPlay start ===')
    console.log('Play options:', options)

    const iceServers = options.iceServers || [
      { urls: 'stun:stun.l.google.com:19302' }
    ]
    console.log('ICE servers:', iceServers)

    // this.playPeerConnection = new RTCPeerConnection({ iceServers })
    this.playPeerConnection = new RTCPeerConnection()
    console.log('Created playPeerConnection successfully')

    // Add media transceivers (recvonly) - play scenario
    // Note: Add order is audio, video, SDP m-line order follows this order
    this.playPeerConnection.addTransceiver('audio', { direction: 'recvonly' })
    this.playPeerConnection.addTransceiver('video', { direction: 'recvonly' })
    console.log('Added media transceivers successfully (audio + video recvonly)')

    this.playPeerConnection.ontrack = (event) => {
      console.log('Received track:', event.track.kind)
      if (event.streams && event.streams[0]) {
        this.playStream = event.streams[0]
        console.log('Set playStream successfully')
      }
    }

    this.playPeerConnection.onicecandidate = (event) => {
      console.log('ICE candidate:', event.candidate ? 'candidate received' : 'null (gathering complete)')
      if (event.candidate === null) {
        console.log('ICE gathering complete for play')
      }
    }

    this.playPeerConnection.onconnectionstatechange = () => {
      console.log('Play connection state:', this.playPeerConnection?.connectionState)
    }

    console.log('Start creating offer...')
    const offer = await this.playPeerConnection.createOffer()
    console.log('Offer created successfully')

    console.log('Set local description...')
    await this.playPeerConnection.setLocalDescription(offer)
    console.log('Local description set successfully')

    const request: Dty.PlayRequest = {
      streamurl: options.streamurl,
      sdp: this.playPeerConnection.localDescription?.sdp || '',
      clientip: options.clientip
    }
    console.log('Prepare to send request to /api/v1/rtc/play')
    console.log('Request streamurl:', request.streamurl)
    console.log('Request SDP length:', request.sdp.length)
    console.log('Request clientip:', request.clientip)

    try {
      console.log('Start sending axios.post request...')
      const response = await axios.post<Dty.PlayResponse>('/api/v1/rtc/play', request)
      console.log('axios.post request successful')
      console.log('Response status:', response.status)
      console.log('Response data:', response.data)

      if (response.data.code !== 0) {
        console.error('Response code is not 0:', response.data.code)
        console.error('Response server:', response.data.server)
        throw new Error('Play failed')
      }

      console.log('Start setting remote description...')
      const answer = new RTCSessionDescription({
        type: 'answer',
        sdp: response.data.sdp
      })
      console.log('Answer SDP created successfully')

      await this.playPeerConnection.setRemoteDescription(answer)
      console.log('Remote description set successfully')
      this.playSessionId = response.data.sessionid
      console.log('Play session ID:', this.playSessionId)

      console.log('=== startPlay completed ===')
      return this.playStream!
    } catch (error) {
      console.error('=== startPlay error ===')
      console.error('Error details:', error)
      if (axios.isAxiosError(error)) {
        console.error('Axios error')
        console.error('Request URL:', error.config?.url)
        console.error('Request method:', error.config?.method)
        console.error('Request data:', error.config?.data)
        console.error('Response status:', error.response?.status)
        console.error('Response data:', error.response?.data)
        console.error('Response headers:', error.response?.headers)
      } else if (error instanceof Error) {
        console.error('Error name:', error.name)
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
      console.error('Stop play...')
      this.stopPlay()
      throw error
    }
  }

  stopPlay(): void {
    if (this.playPeerConnection) {
      this.playPeerConnection.close()
      this.playPeerConnection = null
    }

    this.playStream = null
    this.playSessionId = null
  }

  getPlayStream(): MediaStream | null {
    return this.playStream
  }

  getPlaySessionId(): string | null {
    return this.playSessionId
  }

  getPlayConnectionState(): RTCPeerConnectionState | undefined {
    return this.playPeerConnection?.connectionState
  }

  async startFfmpegPublish(): Promise<Dty.RunCmdResponse> {
    try {
      const request: Dty.RunCmdRequest = {
        cmd: 'ffmpeg_publish'
      }
      const response = await axios.post<Dty.RunCmdResponse>('/api/v1/run_cmd', request)
      return response.data
    } catch (error) {
      console.error('Error starting ffmpeg publish:', error)
      throw error
    }
  }

  async startRtmpPublish(): Promise<Dty.RunCmdResponse> {
    try {
      const request: Dty.RunCmdRequest = {
        cmd: 'rtmp_publish'
      }
      const response = await axios.post<Dty.RunCmdResponse>('/api/v1/run_cmd', request)
      return response.data
    } catch (error) {
      console.error('Error starting rtmp publish:', error)
      throw error
    }
  }

  async startRtmpPlay(userId: string): Promise<Dty.RunCmdResponse> {
    try {
      const request: Dty.RunCmdRequest = {
        cmd: 'rtmp_play',
        data: userId
      }
      const response = await axios.post<Dty.RunCmdResponse>('/api/v1/run_cmd', request)
      return response.data
    } catch (error) {
      console.error('Error starting rtmp play:', error)
      throw error
    }
  }

  async startFilePlay(): Promise<Dty.RunCmdResponse> {
    try {
      const request: Dty.RunCmdRequest = {
        cmd: 'file_play'
      }
      const response = await axios.post<Dty.RunCmdResponse>('/api/v1/run_cmd', request)
      return response.data
    } catch (error) {
      console.error('Error starting file play:', error)
      throw error
    }
  }

  async stopFilePlay(): Promise<Dty.RunCmdResponse> {
    try {
      const request: Dty.RunCmdRequest = {
        cmd: 'file_play_stop'
      }
      const response = await axios.post<Dty.RunCmdResponse>('/api/v1/run_cmd', request)
      return response.data
    } catch (error) {
      console.error('Error stopping file play:', error)
      throw error
    }
  }
}

let rtcApiInstance: RtcApi | null = null

export const createRtcApi = (): RtcApi => {
  if (!rtcApiInstance) {
    rtcApiInstance = new RtcApi()
  }
  return rtcApiInstance
}
