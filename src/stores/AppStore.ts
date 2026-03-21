import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    isLoading: false,
    error: null as string | null,
    notification: null as { message: string; type: 'success' | 'error' | 'info' } | null
  }),

  getters: {
    hasError: (state) => state.error !== null,
    hasNotification: (state) => state.notification !== null
  },

  actions: {
    setLoading(loading: boolean) {
      this.isLoading = loading
    },

    setError(message: string | null) {
      this.error = message
    },

    clearError() {
      this.error = null
    },

    showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
      this.notification = { message, type }
    },

    clearNotification() {
      this.notification = null
    }
  }
})
