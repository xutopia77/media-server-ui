<template>
  <div class="flv-entry">
    <n-card title="FLV Player" class="flv-card">
      <div class="controls">
        <n-input v-model:value="flvUrl" placeholder="Enter FLV video URL" clearable />
        <n-select v-model:value="playbackRate" :options="rateOptions" class="rate-select" />
      </div>
      <div class="button-group">
        <n-button type="primary" :disabled="isPlaying" @click="startPlay">Start Play</n-button>
        <n-button type="error" secondary :disabled="!isPlaying" @click="stopPlay">Stop Play</n-button>
        <n-tag :type="statusType" size="small">{{ statusText }}</n-tag>
      </div>

      <n-alert v-if="errorMessage" type="error" closable class="error-alert" @close="errorMessage = ''">
        {{ errorMessage }}
      </n-alert>

      <div class="video-container">
        <video
          ref="videoRef"
          controls
          class="flv-video"
          @timeupdate="onTimeUpdate"
          @loadedmetadata="onMetadataLoaded"
        ></video>
        <div v-if="duration > 0" class="progress-info">
          {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { NAlert, NButton, NCard, NInput, NSelect, NTag } from 'naive-ui'
import flvjs from 'flv.js'

const flvUrl = ref('http://localhost:8090/flv/h264.640x360_aac_31s.flv')
let flvPlayer: flvjs.Player | null = null

const isPlaying = ref(false)
const errorMessage = ref('')
const playbackRate = ref('1')
const currentTime = ref(0)
const duration = ref(0)
const videoRef = ref<HTMLVideoElement | null>(null)

const rateOptions = ['0.5', '0.75', '1', '1.25', '1.5', '2'].map((r) => ({
  label: `${r}x`,
  value: r
}))

const statusText = computed(() => {
  if (isPlaying.value) return 'Playing'
  if (errorMessage.value) return 'Error'
  return 'Ready'
})

const statusType = computed<'success' | 'error' | 'default'>(() => {
  if (isPlaying.value) return 'success'
  if (errorMessage.value) return 'error'
  return 'default'
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
  }
}

const startPlay = async () => {
  if (isPlaying.value) return

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

    const videoElement = videoRef.value
    if (!videoElement) {
      errorMessage.value = 'Video element not found'
      return
    }

    if (!flvjs.isSupported()) {
      errorMessage.value = 'FLV playback is not supported in this browser'
      return
    }

    const isLiveStream = flvUrl.value.includes('/flv_real/')

    flvPlayer = flvjs.createPlayer(
      {
        type: 'flv',
        url: flvUrl.value,
        isLive: isLiveStream,
        cors: true,
        hasAudio: true,
        hasVideo: true
      },
      {
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
      }
    )

    flvPlayer.attachMediaElement(videoElement)
    flvPlayer.load()

    flvPlayer.on(flvjs.Events.ERROR, (errorType: string, errorDetail: string) => {
      errorMessage.value = `${errorType}: ${errorDetail}`
      isPlaying.value = false
    })

    flvPlayer.on(flvjs.Events.METADATA_ARRIVED, (metadata: { duration?: number }) => {
      if (metadata.duration) {
        duration.value = metadata.duration
      }
    })

    await flvPlayer.play()
    isPlaying.value = true
    videoElement.playbackRate = parseFloat(playbackRate.value)
  } catch (err) {
    errorMessage.value = (err as Error).message || 'Failed to start playback'
    isPlaying.value = false
  }
}

const stopPlay = () => {
  if (!isPlaying.value) return

  try {
    if (flvPlayer) {
      flvPlayer.pause()
      flvPlayer.unload()
      flvPlayer.detachMediaElement()
      flvPlayer.destroy()
      flvPlayer = null
    }

    if (videoRef.value) {
      videoRef.value.src = ''
      videoRef.value.load()
    }

    isPlaying.value = false
    errorMessage.value = ''
    currentTime.value = 0
    duration.value = 0
  } catch (err) {
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
  height: 100%;
  overflow-y: auto;
  padding: 20px;
}

.flv-card {
  max-width: 860px;
  margin: 0 auto;
}

.controls {
  display: flex;
  gap: 12px;
}

.rate-select {
  width: 110px;
}

.button-group {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.error-alert {
  margin-top: 12px;
}

.video-container {
  margin-top: 16px;
}

.flv-video {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #000000;
  border-radius: 2px;
}

.progress-info {
  margin-top: 10px;
  text-align: center;
  font-size: 14px;
  color: #858585;
}
</style>
