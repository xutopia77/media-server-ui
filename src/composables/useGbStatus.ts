import { onUnmounted, ref } from 'vue'
import { getGbStatus, type GbStatus } from '@/api/gb'

/**
 * Shared GB status loader with optional 5s polling.
 *
 * Both GB pages use this to keep the registered device / catalog data fresh.
 * Polling skips a tick while a request is still in flight; the timer is
 * cleared automatically when the owning component unmounts.
 */
export function useGbStatus(pollMs = 5000) {
  const status = ref<GbStatus>({ users: [] })
  const loading = ref(false)
  const error = ref('')
  const autoRefresh = ref(true)
  const lastUpdated = ref(0)

  let timer: ReturnType<typeof setInterval> | null = null

  async function refresh() {
    if (loading.value) return
    loading.value = true
    try {
      status.value = await getGbStatus()
      error.value = ''
      lastUpdated.value = Date.now()
    } catch (err) {
      error.value = (err as Error).message
    } finally {
      loading.value = false
    }
  }

  function startPolling() {
    if (timer !== null) return
    timer = setInterval(() => {
      if (autoRefresh.value) void refresh()
    }, pollMs)
  }

  function stopPolling() {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  onUnmounted(stopPolling)

  return { status, loading, error, autoRefresh, lastUpdated, refresh, startPolling, stopPolling }
}
