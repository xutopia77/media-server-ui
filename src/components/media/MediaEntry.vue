<template>
  <div class="media-entry">
    <NavBar />
    <div class="video-chat-container">
      <div class="user-sidebar">
        <div class="sidebar-header">
          <h2>Participants</h2>
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
          <h1>Video Chat</h1>
          <div class="video-controls">
            <button class="control-btn" title="Mute">
              <span class="icon">🎤</span>
            </button>
            <button class="control-btn" title="Camera">
              <span class="icon">📹</span>
            </button>
            <button class="control-btn" title="Share Screen">
              <span class="icon">🖥️</span>
            </button>
            <button class="control-btn" title="Publish Stream" @click="togglePublish">
              <span class="icon">{{ isPublishing ? '🛑' : '📡' }}</span>
            </button>
            <button class="control-btn" title="Settings" @click="toggleSettings">
              <span class="icon">⚙️</span>
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
              <h3>Advanced Settings</h3>
              <div class="setting-item">
                <label>Enable Debug Mode</label>
                <div class="toggle-switch">
                  <input type="checkbox" id="debugMode" v-model="settings.debugMode">
                  <label for="debugMode" class="switch"></label>
                </div>
              </div>
              <div class="setting-item">
                <label>Auto-reconnect</label>
                <div class="toggle-switch">
                  <input type="checkbox" id="autoReconnect" v-model="settings.autoReconnect">
                  <label for="autoReconnect" class="switch"></label>
                </div>
              </div>
              <div class="setting-item">
                <label>Connection Timeout (seconds)</label>
                <input type="number" v-model="settings.connectionTimeout" min="5" max="60">
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
import { ref, onMounted, onUnmounted, reactive } from 'vue'
import NavBar from '../NavBar.vue'
import { createRtcApi } from '@/utils/RtcApi'
import * as Dty from '@/utils/dataTypedef'

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
  debugMode: boolean
  autoReconnect: boolean
  connectionTimeout: number
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
const roomInfo = ref<Dty.RoomInfo | null>(null)
const sysInfo = ref<Dty.SysInfoData | null>(null)
const rtcApi = createRtcApi()
let roomInfoTimer: number | null = null
let heartBeatTimer: number | null = null

const settings = reactive<WebRTCSettings>({
  cameraDevice: '',
  videoQuality: '720',
  frameRate: '30',
  microphoneDevice: '',
  audioQuality: 'high',
  noiseCancellation: true,
  iceServers: 'both',
  bandwidthLimit: 'unlimited',
  debugMode: false,
  autoReconnect: true,
  connectionTimeout: 30
})

const defaultSettings: WebRTCSettings = {
  cameraDevice: '',
  videoQuality: '720',
  frameRate: '30',
  microphoneDevice: '',
  audioQuality: 'high',
  noiseCancellation: true,
  iceServers: 'both',
  bandwidthLimit: 'unlimited',
  debugMode: false,
  autoReconnect: true,
  connectionTimeout: 30
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

onMounted(() => {
  generateLocalStreamId()
  startLocalCamera()
  fetchRoomInfo()
  startRoomInfoPolling()
  startHeartBeat()
})

onUnmounted(() => {
  stopRoomInfoPolling()
  stopHeartBeat()
  stopPublish()
  stopLocalCamera()
})

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
      alert('请先启动摄像头')
      return
    }

    const localUser = users.value.find(u => u.id === 'local')
    if (!localUser || !localUser.streamId) {
      console.error('No local streamId available')
      alert('本地 streamId 不可用')
      return
    }

    const sessionId = await rtcApi.startPublish(stream, {
      streamurl: `webrtc://localhost/2001/${localUser.streamId}`,
      clientip: '127.0.0.1'
    })

    isPublishing.value = true
    console.log('Publish started, Session ID:', sessionId)
    alert('推流成功！Session ID: ' + sessionId)
  } catch (error) {
    console.error('Error starting publish:', error)
    alert('推流失败: ' + (error as Error).message)
  }
}

const stopPublish = () => {
  rtcApi.stopPublish()
  isPublishing.value = false
  console.log('Publish stopped')
  alert('推流已停止')
}

const fetchRoomInfo = async () => {
  try {
    const info = await rtcApi.getRoomInfo()
    roomInfo.value = info
    console.log('Room info updated:', info)

    if (info && info.users) {
      const roomUsers: User[] = info.users.map((roomUser: Dty.RoomUser) => ({
        id: roomUser.uid,
        status: 'online',
        appId: roomUser.appId,
        publishers: roomUser.publishers,
        streamDir: roomUser.streamDir,
        streamId: roomUser.streamId,
        subscribers: roomUser.subscribers,
        type: roomUser.type,
        uid: roomUser.uid
      }))

      const localUser = users.value.find(u => u.id === 'local')
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
    }
  } catch (error) {
    console.error('Error fetching room info:', error)
  }
}

const startRoomInfoPolling = () => {
  fetchRoomInfo()
  roomInfoTimer = window.setInterval(() => {
    fetchRoomInfo()
  }, 5000)
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

const callUser = async (user: User) => {
  console.log('=== callUser 开始 ===')
  console.log('用户信息:', user)
  
  try {
    if (!user.streamId) {
      console.error('错误：用户没有 streamId')
      alert('用户没有 streamId')
      return
    }

    console.log('streamId 存在:', user.streamId)
    callingUsers.value.add(user.id)
    console.log('已添加到 callingUsers:', user.id)

    const streamurl = `webrtc://localhost/2001/${user.streamId}`
    console.log('准备拉流，streamurl:', streamurl)

    const existingRemoteUser = remoteUsers.value.find(u => u.id === user.id)
    if (existingRemoteUser) {
      console.log('更新现有远程用户:', user.id)
    } else {
      console.log('添加新远程用户:', user.id)
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

    console.log('startPlay 成功，获取到流:', stream)

    const updatedRemoteUser = remoteUsers.value.find(u => u.id === user.id)
    if (updatedRemoteUser) {
      updatedRemoteUser.videoStream = stream
    }

    const videoElement = remoteVideoRefs.value.get(user.id)
    console.log('查找 video 元素，userId:', user.id, 'videoElement:', videoElement)
    if (videoElement) {
      videoElement.srcObject = stream
      console.log('已设置 video srcObject')
    } else {
      console.warn('未找到对应的 video 元素')
    }

    callingUsers.value.delete(user.id)
    console.log('已从 callingUsers 移除:', user.id)
    console.log('=== callUser 成功完成 ===')
    alert('拉流成功！')
  } catch (error) {
    console.error('=== callUser 出错 ===')
    console.error('错误详情:', error)
    console.error('错误类型:', error instanceof Error ? error.name : typeof error)
    console.error('错误消息:', error instanceof Error ? error.message : String(error))
    callingUsers.value.delete(user.id)
    console.log('已从 callingUsers 移除:', user.id)
    
    const errorRemoteUser = remoteUsers.value.find(u => u.id === user.id)
    if (errorRemoteUser && !errorRemoteUser.videoStream) {
      remoteUsers.value = remoteUsers.value.filter(u => u.id !== user.id)
    }
    
    alert('拉流失败: ' + (error as Error).message)
  }
}

const isCallingUser = (userId: string): boolean => {
  return callingUsers.value.has(userId)
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
  height: calc(100vh - 60px);
  overflow: hidden;
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
  overflow: hidden;
}

.video-header {
  padding: 16px 24px;
  border-bottom: 1px solid #3c3c3c;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #252526;
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
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid #3c3c3c;
  background-color: #3c3c3c;
  color: #cccccc;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.control-btn:hover {
  background-color: #4c4c4c;
  border-color: #5c5c5c;
  color: #ffffff;
}

.control-btn .icon {
  font-size: 18px;
}

.settings-panel {
  background-color: #252526;
  border-bottom: 1px solid #3c3c3c;
  max-height: 400px;
  overflow-y: auto;
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
  overflow-y: auto;
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
