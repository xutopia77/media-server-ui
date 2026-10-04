import { ref, onUnmounted } from 'vue'

export type SSEStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface SSEOptions {
  url: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  onMessage?: (event: MessageEvent) => void
  onEvent?: (event: string, data: string) => void
  onError?: (event: Event) => void
  onOpen?: (event: Event) => void
  onClose?: (event: Event) => void
}

export function useSSE(options: SSEOptions) {
  const {
    url,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
    onMessage,
    onEvent,
    onError,
    onOpen,
    onClose,
  } = options

  const status = ref<SSEStatus>('disconnected')
  const eventSource = ref<EventSource | null>(null)
  const reconnectAttempts = ref(0)
  const lastHeartbeat = ref<Date | null>(null)

  let reconnectTimer: number | null = null

  const connect = () => {
    if (eventSource.value) {
      eventSource.value.close()
      eventSource.value = null
    }

    status.value = 'connecting'

    try {
      eventSource.value = new EventSource(url)

      eventSource.value.onopen = (event) => {
        status.value = 'connected'
        reconnectAttempts.value = 0
        onOpen?.(event)
      }

      eventSource.value.onmessage = (event) => {
        lastHeartbeat.value = new Date()
        onMessage?.(event)
      }

      if (onEvent) {
        eventSource.value.addEventListener('room_event', (event: MessageEvent) => {
          onEvent(event.type, event.data)
        })
      }

      eventSource.value.onerror = (event) => {
        status.value = 'error'
        onError?.(event)

        if (reconnectAttempts.value < maxReconnectAttempts) {
          reconnectAttempts.value++
          scheduleReconnect()
        } else {
          status.value = 'disconnected'
          disconnect()
        }
      }
    } catch (error) {
      status.value = 'error'
      onError?.(error as Event)
    }
  }

  const scheduleReconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
    }

    reconnectTimer = window.setTimeout(() => {
      connect()
    }, reconnectInterval)
  }

  const disconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }

    if (eventSource.value) {
      eventSource.value.close()
      eventSource.value = null
      onClose?.(new Event('close'))
    }

    status.value = 'disconnected'
  }

  const reconnect = () => {
    reconnectAttempts.value = 0
    connect()
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    status,
    lastHeartbeat,
    connect,
    disconnect,
    reconnect,
  }
}
