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
  frameRate?: number
  facingMode?: 'user' | 'environment'
  audio?: boolean
  noiseSuppression?: boolean
}

// WHIP publish options: the offer SDP is POSTed to /whip/{roomId}/{uid}.
export interface PublishOptions {
  roomId: string
  uid: string
  iceServers?: RTCIceServer[]
}

// WHEP play options: the offer SDP is POSTed to /whep/{roomId}/{streamId}.
export interface PlayOptions {
  roomId: string
  streamId: string
  iceServers?: RTCIceServer[]
}

export interface RunCmdRequest {
  cmd: string
  data?: string
}

export interface RunCmdResponse {
  code: number
  msg?: string
}

export type UserStatus = 'online' | 'offline' | 'busy'
export type UserType = 'webrtc' | 'live' | 'rtc'

export interface RoomUser {
  uid: string
  roomId: string
  type: UserType
  status: UserStatus
  nickname?: string
  joinedAt?: number
  lastActiveAt?: number

  appId: string
  publishers: number
  subscribers: number
  streamDir: string
  streamId: string
}

export interface RoomInfo {
  roomId?: string
  createdAt?: number
  users: RoomUser[]
}

export interface RoomResponse {
  code: number
  data: RoomInfo
  desc: string
  status: string
}

export enum RoomEventType {
  PublishStart = 'PublishStart',
  PublishStop = 'PublishStop',
  SubscribeStart = 'SubscribeStart',
  SubscribeStop = 'SubscribeStop'
}

export interface RoomEventData {
  eventType: string
  roomId: string
  uid: string
  data: {
    user?: {
      appId: string
      streamId: string
      type: string
      uid: string
      publishers?: number
      streamDir?: string
      subscribers?: number
    }
    users: RoomUser[]
  }
}
