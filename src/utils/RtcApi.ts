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

  async sendHeartBeat(): Promise<Dty.SysInfoData> {
    try {
      const request: Dty.HeartBeatRequest = {
        cmd: 'heart_beat'
      }

      const response = await axios.post<Dty.SysInfoResponse>('/api/v1/sys_info', request)

      if (response.data.code !== 200) {
        throw new Error('Heart beat failed')
      }

      return response.data.data
    } catch (error) {
      console.error('Error sending heart beat:', error)
      throw error
    }
  }

  async startPlay(options: Dty.PlayOptions): Promise<MediaStream> {
    console.log('=== startPlay 开始 ===')
    console.log('Play options:', options)

    const iceServers = options.iceServers || [
      { urls: 'stun:stun.l.google.com:19302' }
    ]
    console.log('ICE servers:', iceServers)

    // this.playPeerConnection = new RTCPeerConnection({ iceServers })
    this.playPeerConnection = new RTCPeerConnection()
    console.log('创建 playPeerConnection 成功')

    // 添加媒体收发器（recvonly）- 拉流场景
    // 注意：添加顺序为 audio、video，SDP 的 m 线顺序遵循此顺序
    this.playPeerConnection.addTransceiver('audio', { direction: 'recvonly' })
    this.playPeerConnection.addTransceiver('video', { direction: 'recvonly' })
    console.log('添加媒体收发器成功（audio + video recvonly）')

    this.playPeerConnection.ontrack = (event) => {
      console.log('Received track:', event.track.kind)
      if (event.streams && event.streams[0]) {
        this.playStream = event.streams[0]
        console.log('设置 playStream 成功')
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

    console.log('开始创建 offer...')
    const offer = await this.playPeerConnection.createOffer()
    console.log('Offer 创建成功')

    console.log('设置本地描述...')
    await this.playPeerConnection.setLocalDescription(offer)
    console.log('本地描述设置成功')

    const request: Dty.PlayRequest = {
      streamurl: options.streamurl,
      sdp: this.playPeerConnection.localDescription?.sdp || '',
      clientip: options.clientip
    }
    console.log('准备发送请求到 /api/v1/rtc/play')
    console.log('Request streamurl:', request.streamurl)
    console.log('Request SDP length:', request.sdp.length)
    console.log('Request clientip:', request.clientip)

    try {
      console.log('开始发送 axios.post 请求...')
      const response = await axios.post<Dty.PlayResponse>('/api/v1/rtc/play', request)
      console.log('axios.post 请求成功')
      console.log('Response status:', response.status)
      console.log('Response data:', response.data)

      if (response.data.code !== 0) {
        console.error('响应 code 不为 0:', response.data.code)
        console.error('Response server:', response.data.server)
        throw new Error('Play failed')
      }

      console.log('开始设置远程描述...')
      const answer = new RTCSessionDescription({
        type: 'answer',
        sdp: response.data.sdp
      })
      console.log('Answer SDP 创建成功')

      await this.playPeerConnection.setRemoteDescription(answer)
      console.log('远程描述设置成功')
      this.playSessionId = response.data.sessionid
      console.log('Play session ID:', this.playSessionId)

      console.log('=== startPlay 成功完成 ===')
      return this.playStream!
    } catch (error) {
      console.error('=== startPlay 出错 ===')
      console.error('错误详情:', error)
      if (axios.isAxiosError(error)) {
        console.error('Axios 错误')
        console.error('请求 URL:', error.config?.url)
        console.error('请求方法:', error.config?.method)
        console.error('请求数据:', error.config?.data)
        console.error('响应状态:', error.response?.status)
        console.error('响应数据:', error.response?.data)
        console.error('响应头:', error.response?.headers)
      } else if (error instanceof Error) {
        console.error('Error 名称:', error.name)
        console.error('Error 消息:', error.message)
        console.error('Error 堆栈:', error.stack)
      }
      console.error('停止 play...')
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

export const createRtcApi = (): RtcApi => {
  return new RtcApi()
}
