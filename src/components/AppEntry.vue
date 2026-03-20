<template>
  <div class="app-entry">
    <h1>欢迎使用媒体服务器</h1>
    <button @click="goToFlv" class="nav-button">进入 FLV 播放器</button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goToFlv = () => {
  router.push('/flv')
}
</script>

<style scoped>
.app-entry {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 20px;
  background-color: #1e1e1e;
  color: #cccccc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.app-entry h1 {
  font-size: 32px;
  font-weight: 300;
  margin: 0;
  color: #ffffff;
}

.nav-button {
  padding: 10px 20px;
  font-size: 14px;
  background-color: #0e639c;
  color: #ffffff;
  border: none;
  border-radius: 2px;
  cursor: pointer;
  transition: background-color 0.15s;
  font-weight: 500;
  min-width: 120px;
}

.nav-button:hover {
  background-color: #1177bb;
}

.nav-button:active {
  background-color: #0e639c;
}
</style>
