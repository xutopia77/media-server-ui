<template>
  <div class="about-entry">
    <NavBar />
    <div class="content">
      <h1>About</h1>
      <div class="about-card">
        <h2>Media Server</h2>
        <p class="version">Version 1.0.0</p>
        <p class="description">
          A comprehensive media server application providing video streaming, 
          Game Boy emulation, and media management capabilities.
        </p>
        <div class="features">
          <div class="feature">
            <div class="feature-icon">📺</div>
            <h3>FLV Streaming</h3>
            <p>Low-latency video streaming with FLV format support</p>
          </div>
          <div class="feature">
            <div class="feature-icon">🎮</div>
            <h3>Game Boy Emulator</h3>
            <p>Play classic Game Boy games in your browser</p>
          </div>
          <div class="feature">
            <div class="feature-icon">📁</div>
            <h3>Media Library</h3>
            <p>Organize and manage your media files</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import NavBar from '../NavBar.vue'
</script>

<style scoped>
.about-entry {
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

.about-card {
  background-color: #252526;
  border: 1px solid #3c3c3c;
  border-radius: 4px;
  padding: 40px;
  max-width: 800px;
  width: 100%;
}

.about-card h2 {
  font-size: 28px;
  font-weight: 500;
  margin: 0 0 8px;
  color: #ffffff;
}

.version {
  font-size: 14px;
  color: #0e639c;
  margin: 0 0 20px;
  font-weight: 500;
}

.description {
  font-size: 16px;
  color: #cccccc;
  margin: 0 0 40px;
  line-height: 1.6;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
}

.feature {
  text-align: center;
  padding: 20px;
  background-color: #2d2d2d;
  border-radius: 4px;
  border: 1px solid #3c3c3c;
}

.feature-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.feature h3 {
  font-size: 18px;
  font-weight: 500;
  margin: 0 0 8px;
  color: #ffffff;
}

.feature p {
  font-size: 14px;
  color: #888;
  margin: 0;
  line-height: 1.5;
}
</style>
