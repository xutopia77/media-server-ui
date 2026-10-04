<template>
  <div class="about-entry">
    <n-card title="Media Server" class="about-card">
      <p class="version">Version 1.0.0</p>
      <p class="description">
        A media server application providing WebRTC video streaming, FLV playback,
        and GB28181 device access.
      </p>
      <div class="features">
        <div class="feature">
          <div class="feature-icon">📺</div>
          <h3>FLV Streaming</h3>
          <p>Low-latency video streaming with FLV format support</p>
        </div>
        <div class="feature">
          <div class="feature-icon">📡</div>
          <h3>WebRTC</h3>
          <p>Publish and play real-time streams in the browser</p>
        </div>
        <div class="feature">
          <div class="feature-icon">🗂️</div>
          <h3>GB28181</h3>
          <p>Access devices through the GB28181 signaling standard</p>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { NCard } from 'naive-ui'
</script>

<style scoped>
.about-entry {
  height: 100%;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.about-card {
  max-width: 760px;
  width: 100%;
}

.version {
  font-size: 13px;
  color: #1177bb;
  margin: 0 0 12px;
  font-weight: 500;
}

.description {
  font-size: 15px;
  color: #cccccc;
  margin: 0 0 24px;
  line-height: 1.6;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.feature {
  text-align: center;
  padding: 16px;
  background-color: #2d2d2d;
  border-radius: 4px;
  border: 1px solid #3c3c3c;
}

.feature-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.feature h3 {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 6px;
  color: #ffffff;
}

.feature p {
  font-size: 13px;
  color: #858585;
  margin: 0;
  line-height: 1.5;
}
</style>
