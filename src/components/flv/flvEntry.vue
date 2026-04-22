<template>
  <div class="flv-entry">
    <NavBar />
    <div class="content">
      <h1>FLV Player</h1>
      <div class="controls">
        <input v-model="flvUrl" type="text" placeholder="Enter FLV video URL" class="url-input" />
      </div>
      <div class="button-group">
        <button @click="startPlay" :disabled="isPlaying" class="play-button">
          <span class="icon">▶</span>
          Start Play
        </button>
        <button @click="stopPlay" :disabled="!isPlaying" class="stop-button">
          <span class="icon">⏹</span>
          Stop Play
        </button>
      </div>
      <div class="status-bar">
        <span class="status-label">Status:</span>
        <span class="status-value" :class="statusClass">{{ statusText }}</span>
        <span v-if="isPlaying" class="playback-rate">
          <label>Speed:</label>
          <select v-model="playbackRate" @change="updatePlaybackRate" class="rate-select">
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1">1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
        </span>
      </div>
      <div class="video-container">
        <video 
          id="videoElement" 
          ref="videoRef"
          controls 
          width="800" 
          height="450"
          @timeupdate="onTimeUpdate"
          @loadedmetadata="onMetadataLoaded"
          @seeking="onSeeking"
        ></video>
        <div v-if="duration > 0" class="progress-info">
          <span>{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import NavBar from '../NavBar.vue'
import flvjs from 'flv.js'

const flvUrl = ref('http://localhost:8090/flv/h264.640x360_aac_31s.flv')
let flvPlayer: flvjs.Player | null = null

const isPlaying = ref(false)
const errorMessage = ref('')
const playbackRate = ref('1')
const currentTime = ref(0)
const duration = ref(0)
const videoRef = ref<HTMLVideoElement | null>(null)

const statusText = computed(() => {
  if (isPlaying.value) {
    return 'Playing'
  }
  if (errorMessage.value) {
    return 'Error'
  }
  return 'Ready'
})

const statusClass = computed(() => {
  if (isPlaying.value) {
    return 'status-playing'
  }
  if (errorMessage.value) {
    return 'status-error'
  }
  return 'status-ready'
})

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const onTimeUpdate = () => {
  if (videoRef.value) {
    currentTime.value = videoRef.value.currentTime
  }
}

const onMetadataLoaded = () => {
  if (videoRef.value) {
    duration.value = videoRef.value.duration
    console.log('Video duration:', duration.value, 'seconds')
  }
}

const onSeeking = () => {
  if (videoRef.value) {
    console.log('Seeking to:', videoRef.value.currentTime)
  }
}

const updatePlaybackRate = () => {
  if (videoRef.value) {
    videoRef.value.playbackRate = parseFloat(playbackRate.value)
    console.log('Playback rate set to:', playbackRate.value)
  }
}

const startPlay = async () => {
  if (isPlaying.value) {
    return
  }

  if (!flvUrl.value.trim()) {
    errorMessage.value = 'Please enter a valid URL'
    return
  }

  errorMessage.value = ''

  try {
    if (flvPlayer) {
      flvPlayer.destroy()
      flvPlayer = null
    }

    const videoElement = document.getElementById('videoElement') as HTMLVideoElement
    if (!videoElement) {
      errorMessage.value = 'Video element not found'
      return
    }

    if (!flvjs.isSupported()) {
      errorMessage.value = 'FLV playback is not supported in this browser'
      return
    }

    const isLiveStream = flvUrl.value.includes('/flv_real/')
    
    flvPlayer = flvjs.createPlayer({
      type: 'flv',
      url: flvUrl.value,
      isLive: isLiveStream,
      cors: true,
      hasAudio: true,
      hasVideo: true
    }, {
      enableWorker: false,
      enableStashBuffer: true,
      stashInitialSize: 384,
      lazyLoad: false,
      lazyLoadMaxDuration: 0,
      lazyLoadRecoverDuration: 0,
      deferLoadAfterSourceOpen: false,
      seekType: 'range',
      seekParamStart: 'bstart',
      seekParamEnd: 'bend',
      rangeLoadZeroStart: false
    })

    flvPlayer.attachMediaElement(videoElement)
    flvPlayer.load()

    flvPlayer.on(flvjs.Events.ERROR, (errorType: string, errorDetail: string) => {
      console.error('FLV Player Error:', errorType, errorDetail)
      errorMessage.value = `${errorType}: ${errorDetail}`
      isPlaying.value = false
    })

    flvPlayer.on(flvjs.Events.LOADING_COMPLETE, () => {
      console.log('FLV loading complete')
    })

    flvPlayer.on(flvjs.Events.METADATA_ARRIVED, (metadata: any) => {
      console.log('Metadata arrived:', metadata)
      if (metadata.duration) {
        duration.value = metadata.duration
      }
    })

    await flvPlayer.play()
    isPlaying.value = true
    
    if (videoElement) {
      videoElement.playbackRate = parseFloat(playbackRate.value)
    }
    
    console.log('FLV playback started')
  } catch (err) {
    console.error('Playback failed:', err)
    errorMessage.value = (err as Error).message || 'Failed to start playback'
    isPlaying.value = false
  }
}

const stopPlay = () => {
  if (!isPlaying.value) {
    return
  }

  try {
    if (flvPlayer) {
      flvPlayer.pause()
      flvPlayer.unload()
      flvPlayer.detachMediaElement()
      flvPlayer.destroy()
      flvPlayer = null
    }

    const videoElement = document.getElementById('videoElement') as HTMLVideoElement
    if (videoElement) {
      videoElement.src = ''
      videoElement.load()
    }

    isPlaying.value = false
    errorMessage.value = ''
    currentTime.value = 0
    duration.value = 0
    console.log('FLV playback stopped')
  } catch (err) {
    console.error('Error stopping playback:', err)
    errorMessage.value = (err as Error).message || 'Failed to stop playback'
  }
}

onUnmounted(() => {
  if (flvPlayer) {
    flvPlayer.destroy()
    flvPlayer = null
  }
})
</script>

<style scoped>
.flv-entry {
  min-height: 100vh;
  background-color: #1e1e1e;
  color: #cccccc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 20px 40px;
  gap: 20px;
}

.content h1 {
  font-size: 32px;
  font-weight: 300;
  margin: 0;
  color: #ffffff;
}

.controls {
  display: flex;
  gap: 10px;
  width: 100%;
  max-width: 800px;
}

.url-input {
  flex: 1;
  padding: 12px 16px;
  font-size: 14px;
  background-color: #3c3c3c;
  color: #cccccc;
  border: 1px solid #3c3c3c;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.15s;
}

.url-input:focus {
  border-color: #0e639c;
}

.button-group {
  display: flex;
  gap: 12px;
  width: 100%;
  max-width: 800px;
}

.play-button,
.stop-button {
  flex: 1;
  padding: 12px 24px;
  font-size: 14px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.play-button {
  background-color: #0e639c;
  color: #ffffff;
}

.play-button:hover:not(:disabled) {
  background-color: #1177bb;
}

.play-button:disabled {
  background-color: #2a2a2a;
  color: #666;
  cursor: not-allowed;
}

.stop-button {
  background-color: #5a1d1d;
  color: #ffffff;
}

.stop-button:hover:not(:disabled) {
  background-color: #7a2d2d;
}

.stop-button:disabled {
  background-color: #2a2a2a;
  color: #666;
  cursor: not-allowed;
}

.icon {
  font-size: 16px;
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 800px;
  padding: 10px 16px;
  background-color: #252526;
  border-radius: 4px;
  border: 1px solid #3c3c3c;
}

.status-label {
  font-size: 13px;
  color: #888;
}

.status-value {
  font-size: 13px;
  font-weight: 500;
}

.status-ready {
  color: #888;
}

.status-playing {
  color: #4caf50;
}

.status-error {
  color: #f44336;
}

.playback-rate {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.playback-rate label {
  font-size: 13px;
  color: #888;
}

.rate-select {
  padding: 4px 8px;
  font-size: 13px;
  background-color: #3c3c3c;
  color: #cccccc;
  border: 1px solid #555;
  border-radius: 4px;
  cursor: pointer;
}

.rate-select:focus {
  outline: none;
  border-color: #0e639c;
}

.video-container {
  margin-top: 10px;
  background-color: #252526;
  padding: 20px;
  border-radius: 4px;
  border: 1px solid #3c3c3c;
}

.video-container video {
  background-color: #000000;
  border-radius: 2px;
}

.progress-info {
  margin-top: 10px;
  text-align: center;
  font-size: 14px;
  color: #888;
}
</style>
