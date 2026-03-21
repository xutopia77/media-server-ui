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
            :class="{ active: user.id === currentUser.id }"
          >
            <div class="user-avatar">{{ user.name.charAt(0) }}</div>
            <div class="user-info">
              <span class="user-name">{{ user.name }}</span>
              <span class="user-status" :class="user.status">
                {{ user.status }}
              </span>
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
            <button class="control-btn" title="Settings">
              <span class="icon">⚙️</span>
            </button>
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
            <div class="video-label">{{ remoteUser.name }}</div>
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
import { ref, onMounted, onUnmounted } from 'vue'
import NavBar from '../NavBar.vue'

interface User {
  id: string
  name: string
  status: 'online' | 'offline' | 'busy'
}

interface RemoteUser extends User {
  videoStream?: MediaStream
}

const currentUser = ref<User>({
  id: 'local',
  name: 'You',
  status: 'online'
})

const users = ref<User[]>([
  { id: 'local', name: 'You', status: 'online' },
  { id: 'user1', name: 'Alice', status: 'online' },
  { id: 'user2', name: 'Bob', status: 'online' },
  { id: 'user3', name: 'Charlie', status: 'offline' },
  { id: 'user4', name: 'Diana', status: 'busy' },
])

const remoteUsers = ref<RemoteUser[]>([
  { id: 'user1', name: 'Alice', status: 'online' },
  { id: 'user2', name: 'Bob', status: 'online' },
])

const localVideoRef = ref<HTMLVideoElement | null>(null)
const remoteVideoRefs = ref<Map<string, HTMLVideoElement>>(new Map())

const setRemoteVideoRef = (el: HTMLVideoElement | null, userId: string) => {
  if (el) {
    remoteVideoRefs.value.set(userId, el)
  }
}

onMounted(() => {
  startLocalCamera()
})

onUnmounted(() => {
  stopLocalCamera()
})

const startLocalCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      },
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
  if (localVideoRef.value && localVideoRef.value.srcObject) {
    const stream = localVideoRef.value.srcObject as MediaStream
    stream.getTracks().forEach((track) => track.stop())
    localVideoRef.value.srcObject = null
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
