import { ref } from 'vue'
import { gbFlvUrl, gbPlay, gbPlayStop } from '@/api/gb'
import { useAppMessage } from './useAppMessage'

/**
 * GB point-to-point play actions shared by the GB pages.
 *
 * The server does not report play state in /api/v1/gb/status (run_cmd
 * responses are fire-and-forget), so channels we sent an INVITE for in
 * this session are tracked locally under `requested`.
 */
export function useGbPlay() {
  const appMessage = useAppMessage()

  const requested = ref<Record<string, boolean>>({})
  const busy = ref<Record<string, boolean>>({})
  const playingUrl = ref('')

  async function play(devId: string) {
    if (busy.value[devId]) return
    busy.value[devId] = true
    try {
      await gbPlay(devId)
      requested.value[devId] = true
      playingUrl.value = gbFlvUrl(devId)
      appMessage.success(`Play request (INVITE) sent to ${devId}`)
    } catch (err) {
      appMessage.error((err as Error).message, 'GB play failed')
    } finally {
      busy.value[devId] = false
    }
  }

  async function stop(devId: string) {
    if (busy.value[devId]) return
    busy.value[devId] = true
    try {
      await gbPlayStop(devId)
      requested.value[devId] = false
      if (playingUrl.value === gbFlvUrl(devId)) playingUrl.value = ''
      appMessage.success(`Stop request (BYE) sent to ${devId}`)
    } catch (err) {
      appMessage.error((err as Error).message, 'GB stop failed')
    } finally {
      busy.value[devId] = false
    }
  }

  return { requested, busy, playingUrl, play, stop }
}
