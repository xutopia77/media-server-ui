import { ref, reactive } from 'vue'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  timestamp: number
  dismissed: boolean
}

const toasts = ref<Toast[]>([])
let toastIdCounter = 0

export const useToast = () => {
  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    duration: number = 0
  ) => {
    const id = `toast-${toastIdCounter++}`
    const toast: Toast = {
      id,
      message,
      type,
      timestamp: Date.now(),
      dismissed: false
    }

    toasts.value.unshift(toast)

    if (toasts.value.length > 5) {
      toasts.value.pop()
    }

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id)
      }, duration)
    }
  }

  const dismissToast = (id: string) => {
    const toast = toasts.value.find(t => t.id === id)
    if (toast) {
      toast.dismissed = true
      setTimeout(() => {
        removeToast(id)
      }, 300)
    }
  }

  const removeToast = (id: string) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  const clearAll = () => {
    toasts.value.forEach(toast => {
      toast.dismissed = true
    })
    setTimeout(() => {
      toasts.value = []
    }, 300)
  }

  const getToastIcon = (type: string): string => {
    const icons: Record<string, string> = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
      warning: '⚠'
    }
    return icons[type] || icons.info || ''
  }

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
  }

  return {
    toasts,
    showToast,
    dismissToast,
    removeToast,
    clearAll,
    getToastIcon,
    formatTime
  }
}
