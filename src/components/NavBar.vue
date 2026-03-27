<template>
  <nav class="navbar">
    <div class="navbar-container">
      <div class="navbar-brand">
        <h1>Media Server</h1>
      </div>
      <ul class="navbar-menu">
        <li v-for="item in menuItems" :key="item.path" class="navbar-item">
          <router-link :to="item.path" class="navbar-link" :class="{ active: isActive(item.path) }">
            {{ item.name }}
          </router-link>
        </li>
      </ul>
      <div class="navbar-actions">
        <div class="connection-indicator" :class="statusClass">
          <span class="status-dot"></span>
          <span class="status-text">{{ statusText }}</span>
        </div>
        <Toast />
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed, onMounted } from 'vue'
import { useSSE } from '../composables/useSSE'
import Toast from './Toast.vue'
import { eventBus } from '../utils/eventBus'

const route = useRoute()

const SSE_URL = import.meta.env.VITE_SSE_URL || '/api/v1/sse/events'

const { status,  connect } = useSSE({
  url: SSE_URL,
  reconnectInterval: 3000,
  maxReconnectAttempts: 10,
  onMessage: (event) => {
    console.log('SSE message received:', event.data)
  },
  onEvent: (eventType, data) => {
    console.log('SSE custom event received:', eventType)
    console.log('SSE custom event data:', data)
    
    try {
      const eventData = JSON.parse(data)
      console.log('Parsed event data:', eventData)
      console.log('Event data keys:', Object.keys(eventData))
      console.log('Has eventType:', 'eventType' in eventData)
      
      if (eventData.eventType) {
        console.log('Emitting room event:', eventData)
        eventBus.emit('room_event', eventData)
        console.log('Room event emitted successfully')
      } else {
        console.log('No eventType in event data, skipping')
      }
    } catch (error) {
      console.error('Failed to parse SSE message:', error)
    }
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
    error: 'Error',
  }
  return textMap[status.value]
})

interface MenuItem {
  name: string
  path: string
}

const menuItems: MenuItem[] = [
  { name: 'Home', path: '/' },
  { name: 'Media', path: '/media' },
  { name: 'GB', path: '/gb' },
  { name: 'GB Device', path: '/gb-device' },
  { name: 'FLV Player', path: '/flv' },
  { name: 'About', path: '/about' },
]

const isActive = (path: string) => {
  return route.path === path
}

onMounted(() => {
  connect()
})
</script>

<style scoped>
.navbar {
  background-color: #252526;
  border-bottom: 1px solid #3c3c3c;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.navbar-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
}

.navbar-brand h1 {
  font-size: 20px;
  font-weight: 500;
  color: #ffffff;
  margin: 0;
  letter-spacing: 0.5px;
}

.navbar-menu {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 5px;
}

.navbar-item {
  margin: 0;
}

.navbar-link {
  display: block;
  padding: 10px 16px;
  color: #cccccc;
  text-decoration: none;
  font-size: 14px;
  font-weight: 400;
  border-radius: 2px;
  transition: all 0.15s;
  position: relative;
  white-space: nowrap;
}

.navbar-link:hover {
  background-color: #3c3c3c;
  color: #ffffff;
}

.navbar-link.active {
  color: #ffffff;
  font-weight: 500;
}

.navbar-link.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #0e639c;
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.connection-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background-color: #3c3c3c;
  border-radius: 3px;
  font-size: 12px;
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
  color: #cccccc;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@media (max-width: 768px) {
  .navbar-container {
    padding: 0 10px;
  }

  .navbar-brand h1 {
    font-size: 18px;
  }

  .navbar-link {
    padding: 10px 12px;
    font-size: 13px;
  }

  .navbar-actions {
    gap: 8px;
  }

  .connection-indicator {
    padding: 5px 8px;
    font-size: 11px;
  }

  .status-text {
    display: none;
  }
}

@media (max-width: 480px) {
  .navbar-container {
    padding: 0 8px;
  }

  .navbar-brand h1 {
    font-size: 16px;
  }

  .navbar-menu {
    gap: 2px;
  }

  .navbar-link {
    padding: 10px 8px;
    font-size: 12px;
  }

  .navbar-actions {
    gap: 6px;
  }

  .connection-indicator {
    padding: 4px 6px;
  }

  .status-dot {
    width: 6px;
    height: 6px;
  }
}
</style>
