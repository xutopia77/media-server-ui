<template>
  <div class="media-entry">
    <NavBar />
    <div class="video-chat-container">
      <div class="user-sidebar">
        <div class="sidebar-header">
          <h2>Participants</h2>
          <div class="room-info">
            <span class="room-id">Room: {{ roomState.roomId }}</span>
            <span class="room-status" :class="{ joined: isJoinedRoom }">
              {{ isJoinedRoom ? '🟢 Joined' : '🔴 Not Joined' }}
            </span>
          </div>
          <span class="user-count">{{ users.length }} online</span>
        </div>
        <div class="user-list">
          <div
            v-for="user in users"
            :key="user.id"
            class="user-item"
            :class="{ active: user.id === currentUser.id, 'local-user': user.id === 'local', 'remote-user': user.id !== 'local' }"
          >
            <div class="user-avatar" :class="{ 'local-avatar': user.id === 'local', 'remote-avatar': user.id !== 'local' }">
              {{ user.id === 'local' ? 'L' : (user.streamId ? user.streamId.charAt(0) : 'R') }}
            </div>
            <div class="user-info">
              <span class="user-name">{{ user.streamId || user.uid || user.id }}</span>
              <div class="user-details">
                <span class="user-status" :class="user.status">
                  {{ user.status }}
                </span>
                <span v-if="user.publishers !== undefined" class="user-stat">
                  📡 {{ user.publishers }}
                </span>
                <span v-if="user.subscribers !== undefined" class="user-stat">
                  👥 {{ user.subscribers }}
                </span>
                <button
                  v-if="user.id !== 'local'"
                  class="call-btn"
                  @click="callUser(user)"
                  :disabled="isCallingUser(user.id)"
                >
                  {{ isCallingUser(user.id) ? 'Calling...' : 'Call' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="video-area">
        <div class="video-header">
          <div class="video-header-left">
            <button 
              v-if="!isJoinedRoom" 
              class="join-room-btn" 
              @click="handleJoinRoom"
              :disabled="isJoiningRoom"
            >
              {{ isJoiningRoom ? 'Joining...' : 'Join Room' }}
            </button>
            <h1 v-else>Video Chat</h1>
          </div>
          <div class="video-controls">
            <template v-if="isJoinedRoom">
              <button class="control-btn" title="Mute">
                <span class="icon">🎤</span>
                <span class="label">Mute</span>
              </button>
              <button class="control-btn" title="Camera">
                <span class="icon">📹</span>
                <span class="label">Camera</span>
              </button>
              <button class="control-btn" title="Share Screen">
                <span class="icon">🖥️</span>
                <span class="label">Screen</span>
              </button>
              <button class="control-btn" title="Publish Stream" @click="togglePublish">
                <span class="icon">{{ isPublishing ? '🛑' : '📡' }}</span>
                <span class="label">{{ isPublishing ? 'Stop' : 'Publish' }}</span>
              </button>
            </template>
            <button class="control-btn" title="Settings" @click="toggleSettings">
              <span class="icon">⚙️</span>
              <span class="label">Settings</span>
            </button>
            <button v-if="isJoinedRoom" class="control-btn leave-btn" title="Leave Room" @click="handleLeaveRoom">
              <span class="icon">🚪</span>
              <span class="label">Leave</span>
            </button>
          </div>
        </div>

        <div v-if="showSettings" class="settings-panel">
          <div class="settings-header">
            <h2>WebRTC Settings</h2>
            <button class="close-btn" @click="toggleSettings">✕</button>
          </div>
          <div class="settings-content">
            <div class="settings-section">
              <h3>Camera Settings</h3>
              <div class="setting-item">
                <label>Camera Device</label>
                <select v-model="settings.cameraDevice">
                  <option value="">Default Camera</option>
                  <option value="front">Front Camera</option>
                  <option value="back">Back Camera</option>
                </select>
              </div>
              <div class="setting-item">
                <label>Video Quality</label>
                <select v-model="settings.videoQuality">
                  <option value="720">720p HD</option>
                  <option value="1080">1080p Full HD</option>
                  <option value="480">480p SD</option>
                </select>
              </div>
              <div class="setting-item">
                <label>Frame Rate</label>
                <select v-model="settings.frameRate">
                  <option value="30">30 FPS</option>
                  <option value="60">60 FPS</option>
                  <option value="15">15 FPS</option>
                </select>
              </div>
            </div>

            <div class="settings-section">
              <h3>Audio Settings</h3>
              <div class="setting-item">
                <label>Microphone Device</label>
                <select v-model="settings.microphoneDevice">
                  <option value="">Default Microphone</option>
                  <option value="external">External Microphone</option>
                  <option value="headset">Headset Microphone</option>
                </select>
              </div>
              <div class="setting-item">
                <label>Audio Quality</label>
                <select v-model="settings.audioQuality">
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div class="setting-item">
                <label>Noise Cancellation</label>
                <div class="toggle-switch">
                  <input type="checkbox" id="noiseCancellation" v-model="settings.noiseCancellation">
                  <label for="noiseCancellation" class="switch"></label>
                </div>
              </div>
            </div>

            <div class="settings-section">
              <h3>Connection Settings</h3>
              <div class="setting-item">
                <label>ICE Servers</label>
                <select v-model="settings.iceServers">
                  <option value="stun">STUN Only</option>
                  <option value="turn">TURN Only</option>
                  <option value="both">STUN + TURN</option>
                </select>
              </div>
              <div class="setting-item">
                <label>Bandwidth Limit</label>
                <select v-model="settings.bandwidthLimit">
                  <option value="unlimited">Unlimited</option>
                  <option value="high">High (2 Mbps)</option>
                  <option value="medium">Medium (1 Mbps)</option>
                  <option value="low">Low (500 Kbps)</option>
                </select>
              </div>
            </div>

            <div class="settings-section">
              <h3>Backend Commands</h3>
              <div class="command-buttons">
                <button class="btn btn-command" @click="handleFfmpegPublish" :disabled="isCommandLoading">
                  {{ isCommandLoading ? 'Processing...' : 'FFmpeg Publish' }}
                </button>
                <button class="btn btn-command" @click="handleRtmpPublish" :disabled="isCommandLoading">
                  {{ isCommandLoading ? 'Processing...' : 'RTMP Publish' }}
                </button>
                <button class="btn btn-command" @click="handleRtmpPlay" :disabled="isCommandLoading">
                  {{ isCommandLoading ? 'Processing...' : 'RTMP Play' }}
                </button>
                <button class="btn btn-command" @click="handleFilePlay" :disabled="isCommandLoading">
                  {{ isCommandLoading ? 'Processing...' : 'File Play' }}
                </button>
                <button class="btn btn-command btn-danger" @click="handleFilePlayStop" :disabled="isCommandLoading">
                  {{ isCommandLoading ? 'Processing...' : 'File Play Stop' }}
                </button>
              </div>
            </div>
          </div>
          <div class="settings-footer">
            <button class="btn btn-secondary" @click="resetSettings">Reset to Default</button>
            <button class="btn btn-primary" @click="saveSettings">Save Settings</button>
          </div>
        </div>

        <div class="video-grid">
          <div class="video-card local-video">
            <video ref="localVideoRef" autoplay muted playsinline></video>
            <div class="video-label">You</div>
            <div class="video-status">
              <span class="status-dot"></span>
              Local Camera
            </div>
          </div>

          <div
            v-for="remoteUser in remoteUsers"
            :key="remoteUser.id"
            class="video-card remote-video"
          >
            <video
              :ref="(el: any) => setRemoteVideoRef(el, remoteUser.id)"
              autoplay
              playsinline
            ></video>
            <div class="video-label">{{ remoteUser.streamId || remoteUser.uid || remoteUser.id }}</div>
            <div class="video-status">
              <span class="status-dot"></span>
              {{ remoteUser.status }}
            </div>
          </div>

          <div v-if="remoteUsers.length === 0" class="no-participants">
            <div class="no-participants-icon">👥</div>
            <h3>No Participants</h3>
            <p>Waiting for others to join the video chat...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavBar from '../NavBar.vue'
import { createRtcApi } from '@/utils/RtcApi'
import * as Dty from '@/utils/dataTypedef'
import { useToast } from '@/composables/useToast'
import { eventBus } from '@/utils/eventBus'

const route = useRoute()
const router = useRouter()
const { showToast } = useToast()

interface User {
  id: string
  status: 'online' | 'offline' | 'busy'
  appId?: string
  publishers?: number
  streamDir?: string
  streamId?: string
  subscribers?: number
  type?: string
  uid?: string
}

interface RemoteUser extends User {
  videoStream?: MediaStream
}

interface WebRTCSettings {
  cameraDevice: string
  videoQuality: string
  frameRate: string
  microphoneDevice: string
  audioQuality: string
  noiseCancellation: boolean
  iceServers: string
  bandwidthLimit: string
}

const currentUser = ref<User>({
  id: 'local',
  status: 'online'
})

const users = ref<User[]>([
  {
    id: 'local',
    status: 'online',
    appId: 'local',
    publishers: 0,
    streamDir: 'Publish',
    streamId: '',
    subscribers: 0,
    type: 'rtc',
    uid: 'local'
  },
])

const remoteUsers = ref<RemoteUser[]>([
  { id: 'user1', status: 'online' },
  { id: 'user2', status: 'online' },
])

const callingUsers = ref<Set<string>>(new Set())

const localVideoRef = ref<HTMLVideoElement | null>(null)
const remoteVideoRefs = ref<Map<string, HTMLVideoElement>>(new Map())
const showSettings = ref(false)
const isPublishing = ref(false)
const isJoiningRoom = ref(false)
const sysInfo = ref<Dty.SysInfoData | null>(null)
const rtcApi = createRtcApi()
let roomInfoTimer: number | null = null
let heartBeatTimer: number | null = null
let keepAliveTimer: number | null = null

const roomState = reactive({
  joined: false,
  roomId: '2001',
  uid: '',
  nickname: ''
})

const isJoinedRoom = computed(() => roomState.joined)

const settings = reactive<WebRTCSettings>({
  cameraDevice: '',
  videoQuality: '720',
  frameRate: '30',
  microphoneDevice: '',
  audioQuality: 'high',
  noiseCancellation: true,
  iceServers: 'both',
  bandwidthLimit: 'unlimited'
})

const defaultSettings: WebRTCSettings = {
  cameraDevice: '',
  videoQuality: '720',
  frameRate: '30',
  microphoneDevice: '',
  audioQuality: 'high',
  noiseCancellation: true,
  iceServers: 'both',
  bandwidthLimit: 'unlimited'
}

const setRemoteVideoRef = (el: HTMLVideoElement | null, userId: string) => {
  if (el) {
    remoteVideoRefs.value.set(userId, el)
  }
}

const toggleSettings = () => {
  showSettings.value = !showSettings.value
}

const resetSettings = () => {
  Object.assign(settings, defaultSettings)
}

const saveSettings = () => {
  console.log('Settings saved:', settings)
  showSettings.value = false
}

const generateUid = () => {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000)
  return `user_${timestamp}_${random}`
}

const handleJoinRoom = async () => {
  if (isJoiningRoom.value) {
    return
  }

  isJoiningRoom.value = true
  
  if (!roomState.uid) {
    roomState.uid = generateUid()
  }

  try {
    await rtcApi.joinRoom({
      roomId: roomState.roomId,
      uid: roomState.uid,
      nickname: roomState.nickname || undefined
    })
    
    roomState.joined = true
    showToast('Joined room successfully!', 'success')
    
    generateLocalStreamId()
    startHeartBeat()
    startKeepAlive()
    
    eventBus.on('room_event', handleRoomEvent)
    
    try {
      await startLocalCamera()
    } catch (cameraError) {
      console.error('Camera access failed:', cameraError)
      showToast('Camera access failed, but you can still participate', 'warning')
    }
  } catch (error) {
    console.error('Failed to join room:', error)
    const errorMsg = (error as Error).message || 'Unknown error'
    
    if (errorMsg.includes('already in room')) {
      console.log('User already in room, continuing...')
      roomState.joined = true
      showToast('Reconnected to room successfully!', 'success')
      
      generateLocalStreamId()
      startHeartBeat()
      startKeepAlive()
      
      eventBus.on('room_event', handleRoomEvent)
      
      try {
        await startLocalCamera()
      } catch (cameraError) {
        console.error('Camera access failed:', cameraError)
        showToast('Camera access failed, but you can still participate', 'warning')
      }
    } else {
      showToast('Failed to join room: ' + errorMsg, 'error')
    }
  } finally {
    isJoiningRoom.value = false
  }
}

onMounted(async () => {
  eventBus.on('room_event', handleRoomEvent)
})

onUnmounted(async () => {
  stopRoomInfoPolling()
  stopHeartBeat()
  stopKeepAlive()
  stopPublish()
  stopLocalCamera()
  
  eventBus.off('room_event', handleRoomEvent)
  
  if (roomState.joined) {
    try {
      await rtcApi.leaveRoom({
        roomId: roomState.roomId,
        uid: roomState.uid
      })
      roomState.joined = false
      console.log('Left room successfully')
    } catch (error) {
      console.error('Failed to leave room:', error)
    }
  }
})

const handleRoomEvent = (data: unknown) => {
  console.log('=== handleRoomEvent called ===')
  console.log('Event data received:', data)
  console.log('Event data type:', typeof data)
  
  const eventData = data as Dty.RoomEventData
  console.log('Event data keys:', eventData ? Object.keys(eventData) : 'null')
  
  const { eventType, data: roomData } = eventData
  const { user, users: eventUsers } = roomData || {}
  
  console.log('Extracted eventType:', eventType)
  console.log('Extracted user:', user)
  console.log('Extracted eventUsers:', eventUsers)
  
  switch (eventType) {
    case 'UserJoin':
      showToast(`User ${user?.streamId || user?.uid || 'Unknown'} joined the room`, 'info')
      break
      
    case 'UserLeave':
      showToast(`User ${user?.streamId || user?.uid || 'Unknown'} left the room`, 'info')
      break
      
    case 'PublishStart':
      showToast(`User ${user?.streamId || user?.uid || 'Unknown'} started publishing`, 'info')
      break
      
    case 'PublishStop':
      showToast(`User ${user?.streamId || user?.uid || 'Unknown'} stopped publishing`, 'info')
      break
      
    case 'SubscribeStart':
      showToast(`User ${user?.streamId || user?.uid || 'Unknown'} started subscribing`, 'info')
      break
      
    case 'SubscribeStop':
      showToast(`User ${user?.streamId || user?.uid || 'Unknown'} stopped subscribing`, 'info')
      break
      
    default:
      console.log('Unknown event type:', eventType)
      break
  }
  
  if (eventUsers && Array.isArray(eventUsers)) {
    console.log('Calling updateUsersFromEvent with:', eventUsers)
    updateUsersFromEvent(eventUsers)
  } else {
    console.log('No eventUsers to update, eventUsers:', eventUsers)
  }
  
  console.log('=== handleRoomEvent completed ===')
}

const updateUsersFromEvent = (eventUsers: Dty.RoomUser[]) => {
  console.log('=== updateUsersFromEvent called ===')
  console.log('Event users received:', eventUsers)
  console.log('Event users length:', eventUsers.length)
  console.log('Event users type:', Array.isArray(eventUsers) ? 'array' : typeof eventUsers)
  
  const localUser = users.value.find(u => u.id === 'local')
  console.log('Current local user:', localUser)
  console.log('Current users.value:', users.value)
  
  const roomUsers: User[] = eventUsers.map((roomUser: Dty.RoomUser, index) => {
    console.log(`Mapping user ${index}:`, roomUser)
    return {
      id: roomUser.uid,
      status: 'online',
      appId: roomUser.appId,
      publishers: roomUser.publishers,
      streamDir: roomUser.streamDir,
      streamId: roomUser.streamId,
      subscribers: roomUser.subscribers,
      type: roomUser.type,
      uid: roomUser.uid
    }
  })

  console.log('Mapped room users:', roomUsers)
  
  users.value = [
    localUser || {
      id: 'local',
      status: 'online',
      appId: 'local',
      publishers: 0,
      streamDir: 'Publish',
      streamId: '',
      subscribers: 0,
      type: 'rtc',
      uid: 'local'
    },
    ...roomUsers
  ]
  
  console.log('Updated users.value:', users.value)
  console.log('=== updateUsersFromEvent completed ===')
}

const generateLocalStreamId = () => {
  const now = new Date()
  const timestamp = now.getTime()
  const streamId = `${timestamp}`
  const localUser = users.value.find(u => u.id === 'local')
  if (localUser) {
    localUser.streamId = streamId
    console.log('Generated local streamId:', streamId)
  }
}

const startLocalCamera = async () => {
  try {
    const stream = await rtcApi.startCamera({
      width: 1280,
      height: 720,
      facingMode: 'user',
      audio: true
    })

    if (localVideoRef.value) {
      localVideoRef.value.srcObject = stream
    }
  } catch (error) {
    console.error('Error accessing camera:', error)
  }
}

const stopLocalCamera = () => {
  rtcApi.stopCamera()
  if (localVideoRef.value) {
    localVideoRef.value.srcObject = null
  }
}

const togglePublish = async () => {
  if (isPublishing.value) {
    stopPublish()
  } else {
    await startPublish()
  }
}

const startPublish = async () => {
  try {
    const stream = rtcApi.getStream()
    if (!stream) {
      console.error('No camera stream available')
      showToast('Please start camera first', 'warning')
      return
    }

    const localUser = users.value.find(u => u.id === 'local')
    if (!localUser || !localUser.streamId) {
      console.error('No local streamId available')
      showToast('Local streamId is not available', 'warning')
      return
    }

    const sessionId = await rtcApi.startPublish(stream, {
      streamurl: `webrtc://localhost/${roomState.roomId}/${localUser.streamId}`,
      clientip: '127.0.0.1'
    })

    isPublishing.value = true
    console.log('Publish started, Session ID:', sessionId)
    showToast('Publish successful! Session ID: ' + sessionId, 'success')
  } catch (error) {
    console.error('Error starting publish:', error)
    showToast('Publish failed: ' + (error as Error).message, 'error')
  }
}

const stopPublish = () => {
  rtcApi.stopPublish()
  isPublishing.value = false
  console.log('Publish stopped')
  showToast('Publish stopped', 'info')
}

const handleLeaveRoom = async () => {
  try {
    if (isPublishing.value) {
      stopPublish()
    }
    
    stopLocalCamera()
    
    await rtcApi.leaveRoom({
      roomId: roomState.roomId,
      uid: roomState.uid
    })
    
    roomState.joined = false
    showToast('Left room successfully', 'success')
    router.push('/room')
  } catch (error) {
    console.error('Error leaving room:', error)
    showToast('Failed to leave room: ' + (error as Error).message, 'error')
  }
}


const stopRoomInfoPolling = () => {
  if (roomInfoTimer !== null) {
    clearInterval(roomInfoTimer)
    roomInfoTimer = null
  }
}

const sendHeartBeat = async () => {
  try {
    const info = await rtcApi.sendHeartBeat()
    sysInfo.value = info
    console.log('Heart beat sent:', info.heartBeatInfo)
  } catch (error) {
    console.error('Error sending heart beat:', error)
  }
}

const startHeartBeat = () => {
  sendHeartBeat()
  heartBeatTimer = window.setInterval(() => {
    sendHeartBeat()
  }, 30000)
}

const stopHeartBeat = () => {
  if (heartBeatTimer !== null) {
    clearInterval(heartBeatTimer)
    heartBeatTimer = null
  }
}

const sendKeepAlive = async () => {
  if (!roomState.joined) {
    return
  }
  
  try {
    await rtcApi.keepAlive({
      roomId: roomState.roomId,
      uid: roomState.uid
    })
  } catch (error) {
    console.error('Error sending keep alive:', error)
  }
}

const startKeepAlive = () => {
  sendKeepAlive()
  keepAliveTimer = window.setInterval(() => {
    sendKeepAlive()
  }, 10000)
}

const stopKeepAlive = () => {
  if (keepAliveTimer !== null) {
    clearInterval(keepAliveTimer)
    keepAliveTimer = null
  }
}

const callUser = async (user: User) => {
  console.log('=== callUser start ===')
  console.log('User info:', user)
  
  try {
    if (!user.streamId) {
      console.error('Error: User has no streamId')
      showToast('User has no streamId', 'warning')
      return
    }

    console.log('streamId exists:', user.streamId)
    callingUsers.value.add(user.id)
    console.log('Added to callingUsers:', user.id)

    const streamurl = `webrtc://localhost/${roomState.roomId}/${user.streamId}`
    console.log('Preparing to play, streamurl:', streamurl)

    const existingRemoteUser = remoteUsers.value.find(u => u.id === user.id)
    if (existingRemoteUser) {
      console.log('Update existing remote user:', user.id)
    } else {
      console.log('Add new remote user:', user.id)
      remoteUsers.value.push({
        id: user.id,
        status: user.status,
        videoStream: undefined
      })
    }

    await new Promise(resolve => setTimeout(resolve, 100))

    const stream = await rtcApi.startPlay({
      streamurl: streamurl,
      clientip: '127.0.0.1'
    })

    console.log('startPlay successful, got stream:', stream)

    const updatedRemoteUser = remoteUsers.value.find(u => u.id === user.id)
    if (updatedRemoteUser) {
      updatedRemoteUser.videoStream = stream
    }

    const videoElement = remoteVideoRefs.value.get(user.id)
    console.log('Find video element, userId:', user.id, 'videoElement:', videoElement)
    if (videoElement) {
      videoElement.srcObject = stream
      console.log('Set video srcObject')
    } else {
      console.warn('Video element not found')
    }

    callingUsers.value.delete(user.id)
    console.log('Removed from callingUsers:', user.id)
    console.log('=== callUser completed ===')
    showToast('Play successful!', 'success')
  } catch (error) {
    console.error('=== callUser error ===')
    console.error('Error details:', error)
    console.error('Error type:', error instanceof Error ? error.name : typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    callingUsers.value.delete(user.id)
    console.log('Removed from callingUsers:', user.id)
    
    const errorRemoteUser = remoteUsers.value.find(u => u.id === user.id)
    if (errorRemoteUser && !errorRemoteUser.videoStream) {
      remoteUsers.value = remoteUsers.value.filter(u => u.id !== user.id)
    }
    
    showToast('Play failed: ' + (error as Error).message, 'error')
  }
}

const isCallingUser = (userId: string): boolean => {
  return callingUsers.value.has(userId)
}

const isCommandLoading = ref(false)

const handleFfmpegPublish = async () => {
  try {
    isCommandLoading.value = true
    console.log('Starting ffmpeg publish...')
    const response = await rtcApi.startFfmpegPublish()
    console.log('FFmpeg publish response:', response)
    showToast('FFmpeg publish successful!', 'success')
  } catch (error) {
    console.error('Error starting ffmpeg publish:', error)
    showToast('FFmpeg publish failed: ' + (error as Error).message, 'error')
  } finally {
    isCommandLoading.value = false
  }
}

const handleRtmpPublish = async () => {
  try {
    isCommandLoading.value = true
    console.log('Starting rtmp publish...')
    const response = await rtcApi.startRtmpPublish()
    console.log('RTMP publish response:', response)
    showToast('RTMP publish successful!', 'success')
  } catch (error) {
    console.error('Error starting rtmp publish:', error)
    showToast('RTMP publish failed: ' + (error as Error).message, 'error')
  } finally {
    isCommandLoading.value = false
  }
}

const handleRtmpPlay = async () => {
  try {
    isCommandLoading.value = true
    console.log('Starting rtmp play...')
    const localUser = users.value.find(u => u.id === 'local')
    const userId = localUser?.streamId || 'default'
    const response = await rtcApi.startRtmpPlay(userId)
    console.log('RTMP play response:', response)
    showToast('RTMP play successful!', 'success')
  } catch (error) {
    console.error('Error starting rtmp play:', error)
    showToast('RTMP play failed: ' + (error as Error).message, 'error')
  } finally {
    isCommandLoading.value = false
  }
}

const handleFilePlay = async () => {
  try {
    isCommandLoading.value = true
    console.log('Starting file play...')
    const response = await rtcApi.startFilePlay()
    console.log('File play response:', response)
    showToast('File play successful!', 'success')
  } catch (error) {
    console.error('Error starting file play:', error)
    showToast('File play failed: ' + (error as Error).message, 'error')
  } finally {
    isCommandLoading.value = false
  }
}

const handleFilePlayStop = async () => {
  try {
    isCommandLoading.value = true
    console.log('Stopping file play...')
    const response = await rtcApi.stopFilePlay()
    console.log('File play stop response:', response)
    showToast('File play stopped successfully!', 'success')
  } catch (error) {
    console.error('Error stopping file play:', error)
    showToast('File play stop failed: ' + (error as Error).message, 'error')
  } finally {
    isCommandLoading.value = false
  }
}
</script>

<style scoped>
.media-entry {
  min-height: 100vh;
  background-color: #1e1e1e;
  color: #cccccc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.video-chat-container {
  display: flex;
  min-height: calc(100vh - 60px);
  overflow-y: auto;
}

.user-sidebar {
  width: 280px;
  background-color: #252526;
  border-right: 1px solid #3c3c3c;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #3c3c3c;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar-header h2 {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
  color: #ffffff;
}

.room-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.room-id {
  font-size: 13px;
  color: #888;
  font-weight: 500;
}

.room-status {
  font-size: 12px;
  color: #f44336;
  font-weight: 500;
}

.room-status.joined {
  color: #4caf50;
}

.user-count {
  font-size: 12px;
  color: #0e639c;
  background-color: rgba(14, 99, 156, 0.1);
  padding: 4px 8px;
  border-radius: 10px;
  font-weight: 500;
  width: fit-content;
}

.user-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.15s;
  margin-bottom: 4px;
}

.user-item:hover {
  background-color: #3c3c3c;
}

.user-item.active {
  background-color: rgba(14, 99, 156, 0.15);
  border: 1px solid #0e639c;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0e639c, #1177bb);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  flex-shrink: 0;
}

.local-avatar {
  background: linear-gradient(135deg, #0e639c, #1177bb);
  border: 2px solid #0e639c;
}

.remote-avatar {
  background: linear-gradient(135deg, #4caf50, #66bb6a);
  border: 2px solid #4caf50;
}

.local-user {
  border-left: 3px solid #0e639c;
}

.remote-user {
  border-left: 3px solid #4caf50;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
}

.user-status {
  font-size: 12px;
  color: #888;
  text-transform: capitalize;
}

.user-status.online {
  color: #4caf50;
}

.user-status.offline {
  color: #f44336;
}

.user-status.busy {
  color: #ffa500;
}

.user-details {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-stat {
  font-size: 11px;
  color: #888;
  background-color: rgba(255, 255, 255, 0.05);
  padding: 2px 6px;
  border-radius: 3px;
}

.call-btn {
  font-size: 11px;
  padding: 4px 10px;
  border: 1px solid #0e639c;
  background-color: #0e639c;
  color: #ffffff;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.15s;
  font-weight: 500;
}

.call-btn:hover:not(:disabled) {
  background-color: #1177bb;
  border-color: #1177bb;
}

.call-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.video-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.video-header {
  padding: 16px 24px;
  border-bottom: 1px solid #3c3c3c;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #252526;
}

.video-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.video-header h1 {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
  color: #ffffff;
}

.join-room-btn {
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 500;
  color: #ffffff;
  background-color: #0e639c;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.join-room-btn:hover:not(:disabled) {
  background-color: #1177bb;
}

.join-room-btn:disabled {
  background-color: #555;
  cursor: not-allowed;
}

.video-controls {
  display: flex;
  gap: 8px;
}

.control-btn {
  min-width: 60px;
  height: auto;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #3c3c3c;
  background-color: #3c3c3c;
  color: #cccccc;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.15s;
}

.control-btn:hover {
  background-color: #4c4c4c;
  border-color: #5c5c5c;
  color: #ffffff;
}

.control-btn .icon {
  font-size: 20px;
  line-height: 1;
}

.control-btn .label {
  font-size: 11px;
  line-height: 1;
  white-space: nowrap;
}

.control-btn.leave-btn {
  background-color: #5a1d1d;
  border-color: #7a2d2d;
}

.control-btn.leave-btn:hover {
  background-color: #7a2d2d;
  border-color: #9a3d3d;
}

.settings-panel {
  background-color: #252526;
  border-bottom: 1px solid #3c3c3c;
  overflow-y: hidden;
}

.settings-header {
  padding: 16px 24px;
  border-bottom: 1px solid #3c3c3c;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-header h2 {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
  color: #ffffff;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid #3c3c3c;
  background-color: #3c3c3c;
  color: #cccccc;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  font-size: 16px;
}

.close-btn:hover {
  background-color: #4c4c4c;
  border-color: #5c5c5c;
  color: #ffffff;
}

.settings-content {
  padding: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.settings-section {
  background-color: #1e1e1e;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #3c3c3c;
}

.settings-section h3 {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 16px;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.setting-item {
  margin-bottom: 16px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-item label {
  display: block;
  font-size: 13px;
  color: #cccccc;
  margin-bottom: 8px;
}

.setting-item select,
.setting-item input[type="number"] {
  width: 100%;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #3c3c3c;
  background-color: #252526;
  color: #ffffff;
  font-size: 14px;
  transition: border-color 0.15s;
}

.setting-item select:hover,
.setting-item input[type="number"]:hover {
  border-color: #0e639c;
}

.setting-item select:focus,
.setting-item input[type="number"]:focus {
  outline: none;
  border-color: #0e639c;
  box-shadow: 0 0 0 2px rgba(14, 99, 156, 0.2);
}

.setting-item select option {
  background-color: #252526;
  color: #ffffff;
}

.toggle-switch {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-switch input[type="checkbox"] {
  display: none;
}

.toggle-switch .switch {
  position: relative;
  width: 44px;
  height: 24px;
  background-color: #3c3c3c;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.toggle-switch .switch::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background-color: #ffffff;
  border-radius: 50%;
  transition: transform 0.15s;
}

.toggle-switch input[type="checkbox"]:checked + .switch {
  background-color: #0e639c;
}

.toggle-switch input[type="checkbox"]:checked + .switch::before {
  transform: translateX(20px);
}

.settings-footer {
  padding: 16px 24px;
  border-top: 1px solid #3c3c3c;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background-color: #252526;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-primary {
  background-color: #0e639c;
  color: #ffffff;
}

.btn-primary:hover {
  background-color: #1177bb;
}

.btn-secondary {
  background-color: #3c3c3c;
  color: #ffffff;
}

.btn-secondary:hover {
  background-color: #4c4c4c;
}

.btn-command {
  width: 100%;
  padding: 10px 16px;
  margin-bottom: 8px;
  background-color: #0e639c;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-command:hover:not(:disabled) {
  background-color: #1177bb;
}

.btn-command:disabled {
  background-color: #3c3c3c;
  color: #888;
  cursor: not-allowed;
}

.btn-command.btn-danger {
  background-color: #d32f2f;
}

.btn-command.btn-danger:hover:not(:disabled) {
  background-color: #f44336;
}

.command-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-secondary:hover {
  background-color: #4c4c4c;
}

.video-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 16px;
  padding: 24px;
  overflow-y: hidden;
  align-content: start;
}

.video-card {
  position: relative;
  background-color: #000000;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  border: 2px solid #3c3c3c;
  transition: border-color 0.15s;
}

.video-card:hover {
  border-color: #0e639c;
}

.video-card video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-label {
  position: absolute;
  bottom: 12px;
  left: 12px;
  background-color: rgba(0, 0, 0, 0.7);
  color: #ffffff;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  backdrop-filter: blur(4px);
}

.video-status {
  position: absolute;
  top: 12px;
  right: 12px;
  background-color: rgba(0, 0, 0, 0.7);
  color: #ffffff;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  backdrop-filter: blur(4px);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #4caf50;
  animation: pulse 2s infinite;
}

.local-video {
  border-color: #0e639c;
}

.no-participants {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  text-align: center;
  color: #888;
}

.no-participants-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.no-participants h3 {
  font-size: 24px;
  font-weight: 500;
  margin: 0 0 12px;
  color: #ffffff;
}

.no-participants p {
  font-size: 16px;
  margin: 0;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
