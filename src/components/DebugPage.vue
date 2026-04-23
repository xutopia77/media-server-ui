<template>
  <div class="debug-page">
    <NavBar />
    <div class="debug-container">
      <h1>Debug Tools</h1>
      
      <div class="debug-section">
        <h2>Publish Commands</h2>
        <div class="command-grid">
          <div class="command-card">
            <h3>FFmpeg Publish</h3>
            <p>Start FFmpeg publishing to the server</p>
            <button 
              class="btn btn-primary" 
              @click="handleFfmpegPublish"
              :disabled="isCommandLoading"
            >
              {{ isCommandLoading ? 'Processing...' : 'Start FFmpeg Publish' }}
            </button>
          </div>
          
          <div class="command-card">
            <h3>RTMP Publish</h3>
            <p>Start RTMP publishing to the server</p>
            <button 
              class="btn btn-primary" 
              @click="handleRtmpPublish"
              :disabled="isCommandLoading"
            >
              {{ isCommandLoading ? 'Processing...' : 'Start RTMP Publish' }}
            </button>
          </div>
        </div>
      </div>
      
      <div class="debug-section">
        <h2>Play Commands</h2>
        <div class="command-grid">
          <div class="command-card">
            <h3>RTMP Play</h3>
            <p>Start RTMP playback from the server</p>
            <button 
              class="btn btn-primary" 
              @click="handleRtmpPlay"
              :disabled="isCommandLoading"
            >
              {{ isCommandLoading ? 'Processing...' : 'Start RTMP Play' }}
            </button>
          </div>
          
          <div class="command-card">
            <h3>File Play</h3>
            <p>Start file playback from the server</p>
            <button 
              class="btn btn-primary" 
              @click="handleFilePlay"
              :disabled="isCommandLoading"
            >
              {{ isCommandLoading ? 'Processing...' : 'Start File Play' }}
            </button>
          </div>
          
          <div class="command-card">
            <h3>Stop File Play</h3>
            <p>Stop current file playback</p>
            <button 
              class="btn btn-danger" 
              @click="handleFilePlayStop"
              :disabled="isCommandLoading"
            >
              {{ isCommandLoading ? 'Processing...' : 'Stop File Play' }}
            </button>
          </div>
        </div>
      </div>
      
      <div class="debug-section">
        <h2>Debug Log</h2>
        <div class="log-container">
          <div v-if="debugLogs.length === 0" class="no-logs">
            No debug logs yet. Execute commands to see logs.
          </div>
          <div v-else class="log-entries">
            <div 
              v-for="(log, index) in debugLogs" 
              :key="index" 
              class="log-entry"
              :class="log.type"
            >
              <span class="log-time">{{ log.time }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
          <button class="btn btn-secondary" @click="clearLogs">Clear Logs</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import NavBar from './NavBar.vue'
import { useRoomStore } from '@/stores/room'
import { useToast } from '@/composables/useToast'

interface DebugLog {
  time: string
  message: string
  type: 'info' | 'success' | 'error'
}

const { showToast } = useToast()
const roomStore = useRoomStore()

const isCommandLoading = ref(false)
const debugLogs = ref<DebugLog[]>([])

const generateUid = (): string => {
  const now = Date.now()
  const seconds = Math.floor(now / 1000)
  const milliseconds = now % 1000
  return `${seconds}${milliseconds.toString().padStart(3, '0')}`
}

const myUid = ref(generateUid())

const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
  const now = new Date()
  const time = now.toLocaleTimeString()
  debugLogs.value.unshift({ time, message, type })
}

const clearLogs = () => {
  debugLogs.value = []
}

const handleFfmpegPublish = async () => {
  try {
    isCommandLoading.value = true
    addLog('Starting FFmpeg publish...', 'info')
    const rtcApi = roomStore.getRtcApi()
    const response = await rtcApi.startFfmpegPublish()
    console.log('FFmpeg publish response:', response)
    addLog('FFmpeg publish successful: ' + JSON.stringify(response), 'success')
    showToast('FFmpeg publish successful!', 'success')
  } catch (error) {
    console.error('Error starting ffmpeg publish:', error)
    addLog('FFmpeg publish failed: ' + (error as Error).message, 'error')
    showToast('FFmpeg publish failed: ' + (error as Error).message, 'error')
  } finally {
    isCommandLoading.value = false
  }
}

const handleRtmpPublish = async () => {
  try {
    isCommandLoading.value = true
    addLog('Starting RTMP publish...', 'info')
    const rtcApi = roomStore.getRtcApi()
    const response = await rtcApi.startRtmpPublish()
    console.log('RTMP publish response:', response)
    addLog('RTMP publish successful: ' + JSON.stringify(response), 'success')
    showToast('RTMP publish successful!', 'success')
  } catch (error) {
    console.error('Error starting rtmp publish:', error)
    addLog('RTMP publish failed: ' + (error as Error).message, 'error')
    showToast('RTMP publish failed: ' + (error as Error).message, 'error')
  } finally {
    isCommandLoading.value = false
  }
}

const handleRtmpPlay = async () => {
  try {
    isCommandLoading.value = true
    addLog('Starting RTMP play...', 'info')
    const rtcApi = roomStore.getRtcApi()
    const response = await rtcApi.startRtmpPlay(myUid.value)
    console.log('RTMP play response:', response)
    addLog('RTMP play successful: ' + JSON.stringify(response), 'success')
    showToast('RTMP play successful!', 'success')
  } catch (error) {
    console.error('Error starting rtmp play:', error)
    addLog('RTMP play failed: ' + (error as Error).message, 'error')
    showToast('RTMP play failed: ' + (error as Error).message, 'error')
  } finally {
    isCommandLoading.value = false
  }
}

const handleFilePlay = async () => {
  try {
    isCommandLoading.value = true
    addLog('Starting file play...', 'info')
    const rtcApi = roomStore.getRtcApi()
    const response = await rtcApi.startFilePlay()
    console.log('File play response:', response)
    addLog('File play successful: ' + JSON.stringify(response), 'success')
    showToast('File play successful!', 'success')
  } catch (error) {
    console.error('Error starting file play:', error)
    addLog('File play failed: ' + (error as Error).message, 'error')
    showToast('File play failed: ' + (error as Error).message, 'error')
  } finally {
    isCommandLoading.value = false
  }
}

const handleFilePlayStop = async () => {
  try {
    isCommandLoading.value = true
    addLog('Stopping file play...', 'info')
    const rtcApi = roomStore.getRtcApi()
    const response = await rtcApi.stopFilePlay()
    console.log('File play stop response:', response)
    addLog('File play stopped: ' + JSON.stringify(response), 'success')
    showToast('File play stopped successfully!', 'success')
  } catch (error) {
    console.error('Error stopping file play:', error)
    addLog('File play stop failed: ' + (error as Error).message, 'error')
    showToast('File play stop failed: ' + (error as Error).message, 'error')
  } finally {
    isCommandLoading.value = false
  }
}
</script>

<style scoped>
.debug-page {
  min-height: 100vh;
  background-color: #1e1e1e;
  color: #cccccc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.debug-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.debug-container h1 {
  font-size: 28px;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid #3c3c3c;
}

.debug-section {
  margin-bottom: 32px;
}

.debug-section h2 {
  font-size: 20px;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 16px;
}

.command-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.command-card {
  background-color: #2d2d2d;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #3c3c3c;
}

.command-card h3 {
  font-size: 16px;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 8px;
}

.command-card p {
  font-size: 13px;
  color: #888;
  margin-bottom: 16px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #0e639c;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background-color: #1177bb;
}

.btn-danger {
  background-color: #c42b1c;
  color: #ffffff;
}

.btn-danger:hover:not(:disabled) {
  background-color: #e02e1d;
}

.btn-secondary {
  background-color: #3c3c3c;
  color: #cccccc;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #4a4a4a;
}

.log-container {
  background-color: #2d2d2d;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #3c3c3c;
}

.no-logs {
  color: #888;
  font-size: 14px;
  text-align: center;
  padding: 20px;
}

.log-entries {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.log-entry {
  display: flex;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 13px;
  font-family: monospace;
}

.log-entry.info {
  background-color: #1e1e1e;
  color: #cccccc;
}

.log-entry.success {
  background-color: #1e3a1e;
  color: #4caf50;
}

.log-entry.error {
  background-color: #3a1e1e;
  color: #f44336;
}

.log-time {
  color: #888;
  flex-shrink: 0;
}

.log-message {
  word-break: break-word;
}
</style>
