<template>
  <div class="flv-entry">
    <NavBar />
    <div class="content">
      <h1>FLV Player</h1>
      <div class="controls">
        <input v-model="flvUrl" type="text" placeholder="Enter FLV video URL" class="url-input" />
        <button @click="loadVideo" class="load-button">Load Video</button>
      </div>
      <div class="video-container">
        <video id="videoElement" controls width="800" height="450"></video>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import NavBar from '../NavBar.vue'
import flvjs from 'flv.js'

const flvUrl = ref('http://localhost:8090/flv/h264.640x360_aac_31s.flv')
let flvPlayer: flvjs.Player | null = null

const loadVideo = () => {
  if (flvPlayer) {
    flvPlayer.destroy()
    flvPlayer = null
  }

  const videoElement = document.getElementById('videoElement') as HTMLVideoElement
  if (videoElement) {
    if (flvjs.isSupported()) {
      flvPlayer = flvjs.createPlayer({
        type: 'flv',
        url: flvUrl.value,
        isLive: true,
        cors: true
      })
      flvPlayer.attachMediaElement(videoElement)
      flvPlayer.load()
      try {
        flvPlayer.play()
      } catch (err) {
        console.error('Playback failed:', err)
      }
    } else {
      console.error('FLV playback is not supported in this browser')
    }
  }
}

onMounted(() => {
  loadVideo()
})

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
  padding: 10px 14px;
  font-size: 14px;
  background-color: #3c3c3c;
  color: #cccccc;
  border: 1px solid #3c3c3c;
  border-radius: 2px;
  outline: none;
}

.url-input:focus {
  border-color: #0e639c;
}

.load-button {
  padding: 10px 20px;
  font-size: 14px;
  background-color: #0e639c;
  color: #ffffff;
  border: none;
  border-radius: 2px;
  cursor: pointer;
  transition: background-color 0.15s;
  font-weight: 500;
  white-space: nowrap;
}

.load-button:hover {
  background-color: #1177bb;
}

.load-button:active {
  background-color: #0e639c;
}

.video-container {
  margin-top: 20px;
  background-color: #252526;
  padding: 20px;
  border-radius: 4px;
  border: 1px solid #3c3c3c;
}

.video-container video {
  background-color: #000000;
  border-radius: 2px;
}
</style>
