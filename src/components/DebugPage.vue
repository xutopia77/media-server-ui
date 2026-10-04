<template>
  <div class="debug-page">
    <n-card title="Debug Tools" class="debug-card">
      <h3 class="section-title">Publish Commands</h3>
      <div class="command-grid">
        <n-button type="primary" :loading="loadingCmd === 'ffmpeg_publish'" @click="runCommand('ffmpeg_publish')">
          Start FFmpeg Publish
        </n-button>
        <n-button type="primary" :loading="loadingCmd === 'rtmp_publish'" @click="runCommand('rtmp_publish')">
          Start RTMP Publish
        </n-button>
      </div>

      <h3 class="section-title">Play Commands</h3>
      <div class="command-grid">
        <n-button type="primary" :loading="loadingCmd === 'rtmp_play'" @click="runCommand('rtmp_play')">
          Start RTMP Play
        </n-button>
        <n-button type="primary" :loading="loadingCmd === 'file_play'" @click="runCommand('file_play')">
          Start File Play
        </n-button>
        <n-button type="error" secondary :loading="loadingCmd === 'file_play_stop'" @click="runCommand('file_play_stop')">
          Stop File Play
        </n-button>
      </div>

      <h3 class="section-title">Debug Log</h3>
      <n-log :log="logText" :rows="14" class="debug-log" trim />
      <div class="log-actions">
        <n-button size="small" @click="logs = []">Clear Logs</n-button>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { NButton, NCard, NLog } from 'naive-ui'
import { useRoomStore } from '@/stores/room'
import { useAppMessage } from '@/composables/useAppMessage'

type DebugCmd = 'ffmpeg_publish' | 'rtmp_publish' | 'rtmp_play' | 'file_play' | 'file_play_stop'

interface DebugLog {
  time: string
  message: string
  type: 'info' | 'success' | 'error'
}

const message = useAppMessage()
const roomStore = useRoomStore()

const loadingCmd = ref<DebugCmd | null>(null)
const logs = ref<DebugLog[]>([])

const logText = computed(() =>
  logs.value.map((l) => `[${l.time}] ${l.type.toUpperCase()}: ${l.message}`).join('\n')
)

const addLog = (text: string, type: DebugLog['type'] = 'info') => {
  const time = new Date().toLocaleTimeString()
  logs.value.unshift({ time, message: text, type })
}

async function runCommand(cmd: DebugCmd) {
  const rtcApi = roomStore.getRtcApi()
  loadingCmd.value = cmd
  addLog(`Running command: ${cmd}...`)
  try {
    const response = await rtcApi.runCmd(cmd)
    addLog(`${cmd} response: ${JSON.stringify(response)}`, 'success')
  } catch (error) {
    addLog(`${cmd} failed: ${(error as Error).message}`, 'error')
    message.error(`${cmd} failed: ${(error as Error).message}`)
  } finally {
    loadingCmd.value = null
  }
}
</script>

<style scoped>
.debug-page {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.debug-card {
  width: 100%;
  max-width: 900px;
}

.section-title {
  font-size: 15px;
  font-weight: 500;
  color: #ffffff;
  margin: 16px 0 10px;
}

.section-title:first-of-type {
  margin-top: 0;
}

.command-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.debug-log {
  border: 1px solid #3c3c3c;
  border-radius: 4px;
  background-color: #1e1e1e;
}

.log-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}
</style>
