<template>
  <div class="app-container">
    <div class="connection-indicator" :class="statusClass">
      <span class="status-dot"></span>
      <span class="status-text">{{ statusText }}</span>
      <span v-if="lastHeartbeat" class="last-heartbeat">
        Last heartbeat: {{ formatTime(lastHeartbeat) }}
      </span>
    </div>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSSE } from './composables/useSSE'

const SSE_URL = import.meta.env.VITE_SSE_URL || '/api/v1/sse/events'

const { status, lastHeartbeat, connect } = useSSE({
  url: SSE_URL,
  reconnectInterval: 3000,
  maxReconnectAttempts: 10,
  onMessage: (event) => {
    console.log('SSE message received:', event.data)
  },
  onError: (event) => {
    console.error('SSE connection error:', event)
  },
  onOpen: () => {
    console.log('SSE connection opened')
  },
  onClose: () => {
    console.log('SSE connection closed')
  },
})

const statusClass = computed(() => {
  return `status-${status.value}`
})

const statusText = computed(() => {
  const textMap = {
    connecting: 'Connecting...',
    connected: 'Connected',
    disconnected: 'Disconnected',
    error: 'Connection Error',
  }
  return textMap[status.value]
})

const formatTime = (date: Date) => {
  return date.toLocaleTimeString()
}

onMounted(() => {
  connect()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background-color: #1e1e1e;
  color: #cccccc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
}

#app {
  width: 100%;
  min-height: 100vh;
}

.app-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
}

.connection-indicator {
  position: fixed;
  top: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #2d2d2d;
  border-radius: 4px;
  font-size: 12px;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-connecting .status-dot {
  background-color: #ffa500;
}

.status-connected .status-dot {
  background-color: #4caf50;
}

.status-disconnected .status-dot {
  background-color: #f44336;
  animation: none;
}

.status-error .status-dot {
  background-color: #f44336;
  animation: none;
}

.status-text {
  font-weight: 500;
}

.last-heartbeat {
  color: #888;
  margin-left: 8px;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
