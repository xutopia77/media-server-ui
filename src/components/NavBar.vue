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
    <n-alert v-if="capError" type="error" class="cap-alert" :show-icon="true" closable>
      Failed to load capabilities from the server; feature menus are hidden until it succeeds.
    </n-alert>
    <n-tag :type="tagType" round size="small" :bordered="false" class="conn-tag">
      <span class="status-dot" :class="status" />
      {{ statusText }}
    </n-tag>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { MenuOption } from 'naive-ui'
import { useSSE } from '../composables/useSSE'
import { getCapabilities, type Capabilities } from '@/api/capabilities'
import { eventBus } from '../utils/eventBus'

const route = useRoute()
const router = useRouter()

const SSE_URL = import.meta.env.VITE_SSE_URL || '/api/v1/sse/events'

// Feature menus default to hidden and only show what the server grants:
// when the capabilities request fails, an error banner is shown instead.
const capabilities = reactive<Capabilities>({
  gb: false,
  gb_device: false,
  debug: false
})

const capError = ref(false)

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
  { name: 'Admin', path: '/admin' }
]

const aboutMenuItem: MenuItem = { name: 'About', path: '/about' }

const gbMenuItem: MenuItem = { name: 'GB', path: '/gb' }
const gbDeviceMenuItem: MenuItem = { name: 'GB Device', path: '/gb-device' }
const debugMenuItem: MenuItem = { name: 'Debug', path: '/debug' }

const menuOptions = computed<MenuOption[]>(() => {
  const items = [...baseMenuItems]

  if (capabilities.gb) {
    items.push(gbMenuItem)
  }

  if (capabilities.gb_device) {
    items.push(gbDeviceMenuItem)
  }

  if (capabilities.debug) {
    items.push(debugMenuItem)
  }

  items.push(aboutMenuItem)

  return items.map((item) => ({ label: item.name, key: item.path }))
})

const activeKey = computed(() => route.path)

const onMenuSelect = (key: string) => {
  router.push(key)
}

async function fetchCapabilities() {
  try {
    const caps = await getCapabilities()
    capabilities.gb = !!caps.gb
    capabilities.gb_device = !!caps.gb_device
    capabilities.debug = !!caps.debug
    capError.value = false
  } catch (error) {
    // Feature menus stay hidden; surface the failure on the page instead.
    capError.value = true
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

.cap-alert {
  flex-basis: 100%;
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
