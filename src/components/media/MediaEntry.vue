<template>
  <div class="media-entry">
    <NavBar />
    <div class="content">
      <h1>Media</h1>
      <p class="description">Manage and browse your media files</p>
      <div class="placeholder">
        <div class="placeholder-icon">📁</div>
        <h2>Media Library</h2>
        <p>This feature is under development</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import NavBar from '../NavBar.vue'
</script>

<style scoped>
.media-entry {
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
  gap: 30px;
}

.content h1 {
  font-size: 36px;
  font-weight: 300;
  margin: 0;
  color: #ffffff;
}

.description {
  font-size: 16px;
  color: #888;
  margin: 0;
  text-align: center;
}

.placeholder {
  background-color: #252526;
  border: 1px solid #3c3c3c;
  border-radius: 4px;
  padding: 60px 40px;
  text-align: center;
  margin-top: 40px;
}

.placeholder-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.placeholder h2 {
  font-size: 24px;
  font-weight: 500;
  margin: 0 0 12px;
  color: #ffffff;
}

.placeholder p {
  font-size: 14px;
  color: #888;
  margin: 0;
}
</style>
