export interface ApiResponse<T = string> {
  code: number
  msg: string
  data?: T
}

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface PaginationResponse<T = string> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface DeviceInfo {
  id: string
  name: string
  type: string
  status: 'online' | 'offline' | 'unknown'
  ip?: string
  port?: number
  createdAt?: string
  updatedAt?: string
}

export interface StreamInfo {
  id: string
  name: string
  url: string
  type: 'flv' | 'hls' | 'webrtc' | 'rtmp' | 'gb28181'
  status: 'active' | 'inactive' | 'error'
  bitrate?: number
  fps?: number
  resolution?: string
  createdAt?: string
  updatedAt?: string
}

export interface User {
  id: string
  username: string
  email?: string
  role: string
  createdAt?: string
  updatedAt?: string
}

export interface SystemConfig {
  id: string
  key: string
  value: string
  description?: string
  updatedAt?: string
}

export interface LogEntry {
  id: string
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  module?: string
  timestamp?: string
  userId?: string
}

export interface WebSocketMessage<T = string> {
  type: string
  data?: T
  timestamp?: number
}

export interface SSEEvent {
  event?: string
  data: string
  id?: string
  retry?: number
}

export interface CameraOptions {
  width?: number
  height?: number
  facingMode?: 'user' | 'environment'
  audio?: boolean
}

export interface PublishRequest {
  streamurl: string
  sdp: string
  clientip?: string
}

export interface PublishResponse {
  code: number
  sdp: string
  sessionid: string
  server: string
}

export interface PublishOptions {
  streamurl: string
  clientip?: string
  iceServers?: RTCIceServer[]
}

export interface RoomUser {
  appId: string
  publishers: number
  streamDir: string
  streamId: string
  subscribers: number
  type: string
  uid: string
}

export interface RoomInfo {
  users: RoomUser[]
}

export interface RoomResponse {
  code: number
  data: RoomInfo
  desc: string
  status: string
}

export interface HeartBeatInfo {
  heartCnt: number
  time: string
  version: string
}

export interface GbInfo {
  users: any[]
}

export interface RoomData {
  users: RoomUser[]
}

export interface SysInfoData {
  gb: GbInfo
  heartBeatInfo: HeartBeatInfo
  rooms: RoomData[]
}

export interface HeartBeatRequest {
  cmd: string
}

export interface SysInfoResponse {
  code: number
  data: SysInfoData
  status: string
}
