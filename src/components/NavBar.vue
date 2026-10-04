<template>
  <div class="navbar">
    <div class="navbar-brand">Media Server</div>
    <n-menu
      mode="horizontal"
      :value="activeKey"
      :options="menuOptions"
      class="navbar-menu"
      @update:value="onMenuSelect"
    />
    <n-tag :type="tagType" round size="small" :bordered="false" class="conn-tag">
      <span class="status-dot" :class="status" />
      {{ statusText }}
    </n-tag>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { MenuOption } from 'naive-ui'
import { useSSE } from '../composables/useSSE'
import http from '@/api/http'
import { eventBus } from '../utils/eventBus'

const route = useRoute()
const router = useRouter()

const SSE_URL = import.meta.env.VITE_SSE_URL || '/api/v1/sse/events'

interface Capabilities {
  gb: boolean
  debug: boolean
}

const capabilities = reactive<Capabilities>({
  gb: false,
  debug: false
})

const { status, connect } = useSSE({
  url: SSE_URL,
  reconnectInterval: 3000,
  maxReconnectAttempts: 10,
  onEvent: (_eventType, data) => {
    try {
      const eventData = JSON.parse(data)
      if (eventData?.eventType) {
        eventBus.emit('room_event', eventData)
      }
    } catch {
      // Ignore malformed SSE payloads
    }
  }
})

const tagType = computed(() => {
  switch (status.value) {
    case 'connected':
      return 'success'
    case 'connecting':
      return 'warning'
    default:
      return 'error'
  }
})

const statusText = computed(() => {
  const textMap = {
    connecting: 'Connecting...',
    connected: 'Connected',
    disconnected: 'Disconnected',
    error: 'Error'
  }
  return textMap[status.value]
})

interface MenuItem {
  name: string
  path: string
}

const baseMenuItems: MenuItem[] = [
  { name: 'Home', path: '/' },
  { name: 'Media', path: '/media' },
  { name: 'FLV Player', path: '/flv' },
  { name: 'About', path: '/about' }
]

const gbMenuItems: MenuItem[] = [
  { name: 'GB', path: '/gb' },
  { name: 'GB Device', path: '/gb-device' }
]

const debugMenuItem: MenuItem = { name: 'Debug', path: '/debug' }

const menuOptions = computed<MenuOption[]>(() => {
  const items = [...baseMenuItems]

  if (capabilities.gb) {
    items.splice(3, 0, ...gbMenuItems)
  }

  if (capabilities.debug) {
    items.splice(items.length - 1, 0, debugMenuItem)
  }

  return items.map((item) => ({ label: item.name, key: item.path }))
})

const activeKey = computed(() => route.path)

const onMenuSelect = (key: string) => {
  router.push(key)
}

async function fetchCapabilities() {
  try {
    const response = await http.post('/api/v1/sys_info', { cmd: 'sys_info' })
    const caps = response.data?.data?.capabilities
    if (caps) {
      capabilities.gb = !!caps.gb
      capabilities.debug = !!caps.debug
    }
  } catch (error) {
    console.error('Failed to fetch capabilities:', error)
  }
}

onMounted(() => {
  connect()
  fetchCapabilities()
})
</script>

<style scoped>
.navbar {
  max-width: 1400px;
  margin: 0 auto;
  height: 60px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.navbar-brand {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
}

.navbar-menu {
  flex: 1;
  justify-content: center;
}

.conn-tag {
  flex-shrink: 0;
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
  background-color: #f44336;
}

.status-dot.connected {
  background-color: #4caf50;
  animation: pulse 2s infinite;
}

.status-dot.connecting {
  background-color: #ffa500;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@media (max-width: 768px) {
  .navbar {
    padding: 0 10px;
  }

  .navbar-brand {
    font-size: 16px;
  }

  .conn-tag :deep(.n-tag__content) .status-text,
  .conn-tag {
    font-size: 11px;
  }
}
</style>
