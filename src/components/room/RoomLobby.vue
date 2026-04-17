<template>
  <div class="room-lobby">
    <NavBar />
    <div class="lobby-content">
      <div class="lobby-header">
        <h1>Video Chat Room</h1>
        <p class="subtitle">Join a room to start video chatting with others</p>
      </div>

      <div class="room-form-container">
        <div class="room-form">
          <h2>Join Room</h2>
          
          <div class="form-group">
            <label for="roomId">Room ID</label>
            <input
              id="roomId"
              v-model="formData.roomId"
              type="text"
              placeholder="Enter room ID (e.g., 2001)"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="uid">User ID</label>
            <input
              id="uid"
              v-model="formData.uid"
              type="text"
              placeholder="Enter your user ID"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="nickname">Nickname (Optional)</label>
            <input
              id="nickname"
              v-model="formData.nickname"
              type="text"
              placeholder="Enter your nickname"
              class="form-input"
            />
          </div>

          <button
            class="join-btn"
            @click="handleJoinRoom"
            :disabled="isJoining || !isFormValid"
          >
            {{ isJoining ? 'Joining...' : 'Join Room' }}
          </button>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
        </div>

        <div class="room-tips">
          <h3>Tips</h3>
          <ul>
            <li>Room ID: Use an existing room ID or create a new one</li>
            <li>User ID: Your unique identifier in the room</li>
            <li>Nickname: Display name shown to other participants</li>
            <li>Default Room: You can use "2001" as a test room</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '../NavBar.vue'
import { createRtcApi } from '@/utils/RtcApi'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const rtcApi = createRtcApi()
const { showToast } = useToast()

const formData = ref({
  roomId: '2001',
  uid: '',
  nickname: ''
})

const isJoining = ref(false)
const errorMessage = ref('')

const isFormValid = computed(() => {
  return formData.value.roomId.trim() !== '' && formData.value.uid.trim() !== ''
})

const generateUid = () => {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000)
  return `${timestamp}_${random}`
}

if (!formData.value.uid) {
  formData.value.uid = generateUid()
}

const handleJoinRoom = async () => {
  if (!isFormValid.value) {
    errorMessage.value = 'Please fill in all required fields'
    return
  }

  isJoining.value = true
  errorMessage.value = ''

  try {
    router.push({
      path: '/media',
      query: {
        roomId: formData.value.roomId.trim(),
        uid: formData.value.uid.trim(),
        nickname: formData.value.nickname.trim()
      }
    })
  } catch (error) {
    console.error('Failed to navigate:', error)
    errorMessage.value = (error as Error).message || 'Failed to navigate'
    showToast('Failed to navigate', 'error')
  } finally {
    isJoining.value = false
  }
}
</script>

<style scoped>
.room-lobby {
  min-height: 100vh;
  background-color: #1e1e1e;
  color: #cccccc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.lobby-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 20px 40px;
  gap: 40px;
}

.lobby-header {
  text-align: center;
}

.lobby-header h1 {
  font-size: 42px;
  font-weight: 300;
  margin: 0 0 16px;
  color: #ffffff;
}

.subtitle {
  font-size: 16px;
  color: #888;
  margin: 0;
}

.room-form-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  max-width: 900px;
  width: 100%;
}

.room-form {
  background-color: #252526;
  border: 1px solid #3c3c3c;
  border-radius: 8px;
  padding: 32px;
}

.room-form h2 {
  font-size: 24px;
  font-weight: 500;
  margin: 0 0 24px;
  color: #ffffff;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #cccccc;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 14px;
  color: #ffffff;
  background-color: #3c3c3c;
  border: 1px solid #555;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: #0e639c;
}

.form-input::placeholder {
  color: #888;
}

.join-btn {
  width: 100%;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 500;
  color: #ffffff;
  background-color: #0e639c;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.join-btn:hover:not(:disabled) {
  background-color: #1177bb;
}

.join-btn:disabled {
  background-color: #555;
  cursor: not-allowed;
}

.error-message {
  margin-top: 16px;
  padding: 12px;
  font-size: 14px;
  color: #f44336;
  background-color: rgba(244, 67, 54, 0.1);
  border: 1px solid #f44336;
  border-radius: 4px;
}

.room-tips {
  background-color: #252526;
  border: 1px solid #3c3c3c;
  border-radius: 8px;
  padding: 32px;
}

.room-tips h3 {
  font-size: 20px;
  font-weight: 500;
  margin: 0 0 16px;
  color: #ffffff;
}

.room-tips ul {
  margin: 0;
  padding-left: 20px;
}

.room-tips li {
  font-size: 14px;
  color: #888;
  margin-bottom: 12px;
  line-height: 1.5;
}

.room-tips li:last-child {
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .room-form-container {
    grid-template-columns: 1fr;
  }
}
</style>
