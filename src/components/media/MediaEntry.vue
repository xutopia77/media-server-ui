<template>
  <div class="media-entry">
    <NavBar />
    <div class="video-chat-container">
      <div class="user-sidebar">
        <div class="sidebar-header">
          <h2>Participants</h2>
          <div class="room-info">
            <span class="room-id">Room: {{ roomStore.currentRoom?.roomId || '2001' }}</span>
            <span class="room-status" :class="{ joined: roomStore.isJoined }">
              {{ roomStore.isJoined ? '🟢 Joined' : '🔴 Not Joined' }}
            </span>
          </div>
          <div class="my-user-info">
            <span class="my-uid">My ID: {{ myUid }}</span>
          </div>
          <div v-if="!roomStore.isJoined" class="sidebar-actions">
            <button 
              class="join-room-btn" 
              @click="handleJoinRoom"
              :disabled="roomStore.isJoining"
            >
              {{ roomStore.isJoining ? 'Joining...' : 'Join Room' }}
            </button>
          </div>
          <span class="user-count">{{ otherUsers.length }} online</span>
        </div>
        <div class="user-list">
          <div
            v-for="user in otherUsers"
            :key="user.uid"
            class="user-item remote-user"
          >
            <div class="user-avatar remote-avatar">
              {{ user.streamId ? user.streamId.charAt(0) : 'R' }}
            </div>
            <div class="user-info">
              <span class="user-name">{{ user.streamId || user.uid }}</span>
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
                  class="call-btn"
                  @click="callUser(user)"
                  :disabled="isCallingUser(user.uid)"
                >
                  {{ isCallingUser(user.uid) ? 'Calling...' : 'Call' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="video-area">
        <div class="video-header">
          <div class="video-header-left">
            <h1>Video Chat</h1>
          </div>
          <div class="video-controls">
            <template v-if="roomStore.isJoined">
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
              <button class="control-btn leave-btn" title="Leave Room" @click="handleLeaveRoom">
                <span class="icon">🚪</span>
                <span class="label">Leave</span>
              </button>
            </template>
            <button class="control-btn" title="Settings" @click="toggleSettings" :disabled="!roomStore.isJoined">
              <span class="icon">⚙️</span>
              <span class="label">Settings</span>
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
                <button class="btn btn-command" @click="handleFfmpegPublish" :disabled="isCommandLoading || !roomStore.isJoined">
                  {{ isCommandLoading ? 'Processing...' : 'FFmpeg Publish' }}
                </button>
                <button class="btn btn-command" @click="handleRtmpPublish" :disabled="isCommandLoading || !roomStore.isJoined">
                  {{ isCommandLoading ? 'Processing...' : 'RTMP Publish' }}
                </button>
                <button class="btn btn-command" @click="handleRtmpPlay" :disabled="isCommandLoading || !roomStore.isJoined">
                  {{ isCommandLoading ? 'Processing...' : 'RTMP Play' }}
                </button>
                <button class="btn btn-command" @click="handleFilePlay" :disabled="isCommandLoading || !roomStore.isJoined">
                  {{ isCommandLoading ? 'Processing...' : 'File Play' }}
                </button>
                <button class="btn btn-command btn-danger" @click="handleFilePlayStop" :disabled="isCommandLoading || !roomStore.isJoined">
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
            :key="remoteUser.uid"
            class="video-card remote-video"
          >
            <video
              :ref="(el: any) => setRemoteVideoRef(el, remoteUser.uid)"
              autoplay
              playsinline
            ></video>
            <div class="video-label">{{ remoteUser.streamId || remoteUser.uid }}</div>
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
import { useRouter } from 'vue-router'
import NavBar from '../NavBar.vue'
import { useRoomStore } from '@/stores/room'
import type { RoomUser } from '@/utils/dataTypedef'
import { useToast } from '@/composables/useToast'
import { eventBus } from '@/utils/eventBus'

const router = useRouter()
const { showToast } = useToast()
const roomStore = useRoomStore()

const myUid = ref(roomStore.generateUid())

const otherUsers = computed(() => roomStore.users.filter(u => u.uid !== roomStore.currentUser?.uid))

interface RemoteUser extends RoomUser {
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

const remoteUsers = ref<RemoteUser[]>([])
const callingUsers = ref<Set<string>>(new Set())

const localVideoRef = ref<HTMLVideoElement | null>(null)
const remoteVideoRefs = ref<Map<string, HTMLVideoElement>>(new Map())
const showSettings = ref(false)
const isPublishing = ref(false)
const isCommandLoading = ref(false)

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

const defaultSettings: WebRTCSettings = { ...settings }

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

const handleJoinRoom = async () => {
  const result = await roomStore.joinRoom('2001', undefined, myUid.value)
  
  if (result.success) {
    showToast(result.message || 'Joined room successfully!', 'success')
    
    try {
      await startLocalCamera()
    } catch (cameraError) {
      console.error('Camera access failed:', cameraError)
      showToast('Camera access failed, but you can still participate', 'warning')
    }
  } else {
    showToast('Failed to join room: ' + (result.error || 'Unknown error'), 'error')
  }
}

onMounted(async () => {
  eventBus.on('room_event', handleRoomEvent)
})

onUnmounted(async () => {
  stopPublish()
  stopLocalCamera()
  
  eventBus.off('room_event', handleRoomEvent)
  
  if (roomStore.isJoined) {
    await roomStore.leaveRoom()
  }
})

const handleRoomEvent = (data: unknown) => {
  const eventData = data as { eventType: string; roomId: string; uid: string; data: { user?: Partial<RoomUser>; users?: RoomUser[] } }
  
  if (!eventData) return
  
  const { eventType, data: roomData } = eventData
  const { user } = roomData || {}
  
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
      break
  }
  
  if (roomData?.users && Array.isArray(roomData.users)) {
    roomStore.updateUserList(roomData.users)
  }
}

const startLocalCamera = async () => {
  try {
    const rtcApi = roomStore.getRtcApi()
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
  const rtcApi = roomStore.getRtcApi()
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
    const rtcApi = roomStore.getRtcApi()
    const stream = rtcApi.getStream()
    if (!stream) {
      console.error('No camera stream available')
      showToast('Please start camera first', 'warning')
      return
    }

    const currentUser = roomStore.currentUser
    if (!currentUser || !currentUser.streamId) {
      console.error('No local streamId available')
      showToast('Local streamId is not available', 'warning')
      return
    }

    const roomId = roomStore.currentRoom?.roomId || '2001'
    const sessionId = await rtcApi.startPublish(stream, {
      streamurl: `webrtc://localhost/${roomId}/${currentUser.streamId}`,
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
  const rtcApi = roomStore.getRtcApi()
  rtcApi.stopPublish()
  isPublishing.value = false
  console.log('Publish stopped')
  showToast('Publish stopped', 'info')
}

const handleLeaveRoom = async () => {
  if (isPublishing.value) {
    stopPublish()
  }
  
  stopLocalCamera()
  
  const result = await roomStore.leaveRoom()
  
  if (result.success) {
    showToast('Left room successfully', 'success')
  } else {
    showToast('Failed to leave room: ' + (result.error || 'Unknown error'), 'error')
  }
}

const callUser = async (user: RoomUser) => {
  console.log('=== callUser start ===')
  console.log('User info:', user)
  
  try {
    if (!user.streamId) {
      console.error('Error: User has no streamId')
      showToast('User has no streamId', 'warning')
      return
    }

    console.log('streamId exists:', user.streamId)
    callingUsers.value.add(user.uid)
    console.log('Added to callingUsers:', user.uid)

    const roomId = roomStore.currentRoom?.roomId || '2001'
    const streamurl = `webrtc://localhost/${roomId}/${user.streamId}`
    console.log('Preparing to play, streamurl:', streamurl)

    const existingRemoteUser = remoteUsers.value.find(u => u.uid === user.uid)
    if (!existingRemoteUser) {
      console.log('Add new remote user:', user.uid)
      remoteUsers.value.push({
        ...user,
        videoStream: undefined
      })
    }

    await new Promise(resolve => setTimeout(resolve, 100))

    const rtcApi = roomStore.getRtcApi()
    const stream = await rtcApi.startPlay({
      streamurl: streamurl,
      clientip: '127.0.0.1'
    })

    console.log('startPlay successful, got stream:', stream)

    const updatedRemoteUser = remoteUsers.value.find(u => u.uid === user.uid)
    if (updatedRemoteUser) {
      updatedRemoteUser.videoStream = stream
    }

    const videoElement = remoteVideoRefs.value.get(user.uid)
    console.log('Find video element, userId:', user.uid, 'videoElement:', videoElement)
    if (videoElement) {
      videoElement.srcObject = stream
      console.log('Set video srcObject')
    } else {
      console.warn('Video element not found')
    }

    callingUsers.value.delete(user.uid)
    console.log('Removed from callingUsers:', user.uid)
    console.log('=== callUser completed ===')
    showToast('Play successful!', 'success')
  } catch (error) {
    console.error('=== callUser error ===')
    console.error('Error details:', error)
    callingUsers.value.delete(user.uid)
    console.log('Removed from callingUsers:', user.uid)
    
    const errorRemoteUser = remoteUsers.value.find(u => u.uid === user.uid)
    if (errorRemoteUser && !errorRemoteUser.videoStream) {
      remoteUsers.value = remoteUsers.value.filter(u => u.uid !== user.uid)
    }
    
    showToast('Play failed: ' + (error as Error).message, 'error')
  }
}

const isCallingUser = (userId: string): boolean => {
  return callingUsers.value.has(userId)
}

const handleFfmpegPublish = async () => {
  try {
    isCommandLoading.value = true
    const rtcApi = roomStore.getRtcApi()
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
    const rtcApi = roomStore.getRtcApi()
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
    const rtcApi = roomStore.getRtcApi()
    const userId = roomStore.currentUser?.streamId || 'default'
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
    const rtcApi = roomStore.getRtcApi()
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
    const rtcApi = roomStore.getRtcApi()
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

.my-user-info {
  padding: 8px 12px;
  background: #2a2a2a;
  border-radius: 6px;
}

.my-uid {
  font-size: 13px;
  color: #4fc3f7;
  font-weight: 500;
}

.sidebar-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.sidebar-actions .join-room-btn {
  padding: 6px 12px;
  background: linear-gradient(135deg, #4caf50, #45a049);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sidebar-actions .join-room-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #45a049, #3d8b40);
}

.sidebar-actions .join-room-btn:disabled {
  background: #555;
  cursor: not-allowed;
  opacity: 0.7;
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
