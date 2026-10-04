<template>
  <div class="app-entry">
    <h1>Welcome to Media Server</h1>
    <p class="description">Select a feature from the navigation menu to get started</p>
    <div class="feature-cards">
      <n-card hoverable class="feature-card" @click="router.push('/media')">
        <div class="feature-icon">📹</div>
        <h2>Video Chat</h2>
        <p>Join a room to publish and play WebRTC streams</p>
      </n-card>
      <n-card hoverable class="feature-card" @click="router.push('/flv')">
        <div class="feature-icon">📺</div>
        <h2>FLV Player</h2>
        <p>Stream and play FLV videos with low latency</p>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { NCard } from 'naive-ui'

const router = useRouter()
</script>

<style scoped>
.app-entry {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 16px;
}

.app-entry h1 {
  font-size: 36px;
  font-weight: 300;
  color: #ffffff;
  text-align: center;
}

.description {
  font-size: 15px;
  color: #858585;
  text-align: center;
  max-width: 600px;
}

.feature-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
  max-width: 760px;
  width: 100%;
  margin-top: 12px;
}

.feature-card {
  text-align: center;
  cursor: pointer;
}

.feature-icon {
  font-size: 44px;
  margin-bottom: 12px;
}

.feature-card h2 {
  font-size: 18px;
  font-weight: 500;
  margin: 0 0 8px;
  color: #ffffff;
}

.feature-card p {
  font-size: 13px;
  color: #858585;
  margin: 0;
  line-height: 1.5;
}
</style>
