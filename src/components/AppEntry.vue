<template>
  <div class="app-entry">
    <NavBar />
    <div class="content">
      <h1>Welcome to Media Server</h1>
      <p class="description">Select a feature from the navigation menu to get started</p>
      <div class="feature-cards">
        <div class="feature-card" @click="goToMedia">
          <div class="feature-icon">📹</div>
          <h2>Video Chat</h2>
          <p>Join a room to start video chatting with others</p>
        </div>
        <div class="feature-card" @click="goToFlv">
          <div class="feature-icon">📺</div>
          <h2>FLV Player</h2>
          <p>Stream and play FLV videos with low latency</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import NavBar from './NavBar.vue'

const router = useRouter()

const goToMedia = () => {
  router.push('/media')
}

const goToFlv = () => {
  router.push('/flv')
}
</script>

<style scoped>
.app-entry {
  min-height: 100vh;
  background-color: #1e1e1e;
  color: #cccccc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px 40px;
  gap: 30px;
}

.app-entry h1 {
  font-size: 42px;
  font-weight: 300;
  margin: 0;
  color: #ffffff;
  text-align: center;
}

.description {
  font-size: 16px;
  color: #888;
  margin: 0;
  text-align: center;
  max-width: 600px;
}

.feature-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  max-width: 800px;
  width: 100%;
  margin-top: 20px;
}

.feature-card {
  background-color: #252526;
  border: 1px solid #3c3c3c;
  border-radius: 4px;
  padding: 30px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.feature-card:hover {
  background-color: #2d2d2d;
  border-color: #0e639c;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.feature-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.feature-card h2 {
  font-size: 20px;
  font-weight: 500;
  margin: 0 0 12px;
  color: #ffffff;
}

.feature-card p {
  font-size: 14px;
  color: #888;
  margin: 0;
  line-height: 1.5;
}
</style>
