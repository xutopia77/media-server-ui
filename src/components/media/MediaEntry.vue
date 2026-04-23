<template>
  <div class="media-entry">
    <NavBar />
    <div class="video-chat-container">
      <div class="user-sidebar">
        <div class="sidebar-header">
          <div class="header-section user-section">
            <div class="my-user-info">
              <span class="info-label">My ID:</span>
              <span class="info-value">{{ myUid }}</span>
            </div>
          </div>
          <div class="header-section participants-section">
            <h2>Publishers</h2>
            <span class="user-count">{{ roomStore.userCount }} online</span>
          </div>
        </div>
        <div class="user-list">
          <div
            v-for="user in roomStore.users"
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
                  @click="playUser(user)"
                  :disabled="isPlayingUser(user.uid)"
                >
                  {{ isPlayingUser(user.uid) ? 'Playing...' : 'Play' }}
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
            <button class="control-btn" :class="{ active: isCameraOn }" title="Camera" @click="toggleCamera">
              <span class="icon">{{ isCameraOn ? '📹' : '📷' }}</span>
              <span class="label">{{ isCameraOn ? 'Camera Off' : 'Camera On' }}</span>
            </button>
            <button class="control-btn" title="Mute">
              <span class="icon">🎤</span>
              <span class="label">Mute</span>
            </button>
            <button class="control-btn" title="Share Screen">
              <span class="icon">🖥️</span>
              <span class="label">Screen</span>
            </button>
            <button class="control-btn" :class="{ active: isPublishing }" :disabled="!isCameraOn" title="Publish Stream" @click="togglePublish">
              <span class="icon">{{ isPublishing ? '🛑' : '📡' }}</span>
              <span class="label">{{ isPublishing ? 'Stop' : 'Publish' }}</span>
            </button>
            <button class="control-btn" title="Settings" @click="toggleSettings">
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
                <label class="toggle-switch">
                  <input type="checkbox" v-model="settings.noiseCancellation">
                  <span class="switch"></span>
                </label>
              </div>
            </div>

            <div class="settings-section">
              <h3>Network Settings</h3>
              <div class="setting-item">
                <label>ICE Servers</label>
                <select v-model="settings.iceServers">
                  <option value="stun">STUN Only</option>
                  <option value="turn">TURN Only</option>
                  <option value="both">Both STUN and TURN</option>
                </select>
              </div>
              <div class="setting-item">
                <label>Bandwidth Limit (kbps)</label>
                <input type="number" v-model="settings.bandwidthLimit" placeholder="Unlimited">
              </div>
            </div>
          </div>
          <div class="settings-footer">
            <button class="btn btn-secondary" @click="resetSettings">Reset</button>
            <button class="btn btn-primary" @click="saveSettings">Save</button>
          </div>
        </div>

        <div class="video-grid">
          <div v-if="isCameraOn" class="video-card local-video">
            <video ref="localVideoRef" autoplay muted playsinline></video>
            <div class="video-label">Local ({{ myUid }})</div>
            <div class="video-status">
              <span class="status-dot"></span>
              {{ isPublishing ? 'Publishing' : 'Preview' }}
            </div>
          </div>

          <div
            v-for="remoteUser in remoteUsers"
            :key="remoteUser.uid"
            class="video-card"
          >
            <video
              :ref="el => setRemoteVideoRef(el as HTMLVideoElement | null, remoteUser.uid)"
              autoplay
              playsinline
            ></video>
            <div class="video-label">{{ remoteUser.streamId || remoteUser.uid }}</div>
            <div class="video-status">
              <span class="status-dot"></span>
              {{ remoteUser.status }}
            </div>
          </div>

          <div v-if="!isCameraOn && remoteUsers.length === 0" class="no-participants">
            <div class="no-participants-icon">👥</div>
            <h3>No Publishers</h3>
            <p>Start camera and publish, or wait for others to publish...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, reactive } from 'vue'
import NavBar from '../NavBar.vue'
import { useRoomStore } from '@/stores/room'
import type { RoomUser } from '@/utils/dataTypedef'
import { useToast } from '@/composables/useToast'

const { showToast } = useToast()
const roomStore = useRoomStore()

const generateUid = (): string => {
  const now = Date.now()
  const seconds = Math.floor(now / 1000)
  const milliseconds = now % 1000
  return `${seconds}${milliseconds.toString().padStart(3, '0')}`
}

const myUid = ref(generateUid())
roomStore.setMyUid(myUid.value)

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
const playingUsers = ref<Set<string>>(new Set())

const localVideoRef = ref<HTMLVideoElement | null>(null)
const remoteVideoRefs = ref<Map<string, HTMLVideoElement>>(new Map())
const showSettings = ref(false)
const isPublishing = ref(false)
const isCameraOn = ref(false)

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
    
    isCameraOn.value = true
    showToast('Camera started', 'success')
  } catch (error) {
    console.error('Error accessing camera:', error)
    showToast('Camera access failed: ' + (error as Error).message, 'error')
  }
}

const stopLocalCamera = () => {
  const rtcApi = roomStore.getRtcApi()
  rtcApi.stopCamera()
  if (localVideoRef.value) {
    localVideoRef.value.srcObject = null
  }
  isCameraOn.value = false
}

const toggleCamera = async () => {
  if (isCameraOn.value) {
    if (isPublishing.value) {
      stopPublish()
    }
    stopLocalCamera()
    showToast('Camera stopped', 'info')
  } else {
    await startLocalCamera()
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
  if (!isCameraOn.value) {
    showToast('Please start camera first', 'warning')
    return
  }
  
  try {
    const rtcApi = roomStore.getRtcApi()
    const stream = rtcApi.getStream()
    if (!stream) {
      console.error('No camera stream available')
      showToast('No camera stream available, please restart camera', 'warning')
      return
    }

    const roomId = '2001'
    const sessionId = await rtcApi.startPublish(stream, {
      streamurl: `webrtc://localhost/${roomId}/${myUid.value}`,
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

const playUser = async (user: RoomUser) => {
  console.log('=== playUser start ===')
  console.log('User info:', user)
  
  try {
    if (!user.streamId) {
      console.error('Error: User has no streamId')
      showToast('User has no streamId', 'warning')
      return
    }

    console.log('streamId exists:', user.streamId)
    playingUsers.value.add(user.uid)
    console.log('Added to playingUsers:', user.uid)

    const roomId = '2001'
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

    playingUsers.value.delete(user.uid)
    console.log('Removed from playingUsers:', user.uid)
    console.log('=== playUser completed ===')
    showToast('Play successful!', 'success')
  } catch (error) {
    console.error('=== playUser error ===')
    console.error('Error details:', error)
    playingUsers.value.delete(user.uid)
    console.log('Removed from playingUsers:', user.uid)
    
    const errorRemoteUser = remoteUsers.value.find(u => u.uid === user.uid)
    if (errorRemoteUser && !errorRemoteUser.videoStream) {
      remoteUsers.value = remoteUsers.value.filter(u => u.uid !== user.uid)
    }
    
    showToast('Play failed: ' + (error as Error).message, 'error')
  }
}

const isPlayingUser = (userId: string): boolean => {
  return playingUsers.value.has(userId)
}

onUnmounted(async () => {
  stopPublish()
  stopLocalCamera()
})
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
  gap: 16px;
}

.header-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.user-section {
  padding-bottom: 16px;
  border-bottom: 1px solid #3c3c3c;
}

.my-user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #2a2a2a;
  border-radius: 6px;
}

.info-label {
  font-size: 12px;
  color: #888;
  font-weight: 500;
}

.info-value {
  font-size: 13px;
  color: #4fc3f7;
  font-weight: 500;
  font-family: monospace;
}

.participants-section {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h2 {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
  color: #ffffff;
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

.remote-avatar {
  background: linear-gradient(135deg, #4caf50, #66bb6a);
  border: 2px solid #4caf50;
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

.control-btn.active {
  background-color: #0e639c;
  border-color: #1177bb;
  color: #ffffff;
}

.control-btn.active:hover {
  background-color: #1177bb;
  border-color: #2288cc;
}

.control-btn:disabled {
  background-color: #2a2a2a;
  border-color: #3c3c3c;
  color: #666;
  cursor: not-allowed;
}

.control-btn:disabled:hover {
  background-color: #2a2a2a;
  border-color: #3c3c3c;
  color: #666;
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
