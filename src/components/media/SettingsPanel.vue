<template>
  <n-modal v-model:show="show" preset="card" title="WebRTC Settings" class="settings-modal">
    <n-alert type="info" :bordered="false" class="settings-hint">
      Settings apply when the camera starts and on new publish/play connections.
    </n-alert>
    <n-form label-placement="left" label-width="150">
      <n-form-item label="Camera Facing">
        <n-select v-model:value="settings.cameraFacing" :options="cameraOptions" />
      </n-form-item>
      <n-form-item label="Video Quality">
        <n-select v-model:value="settings.videoQuality" :options="qualityOptions" />
      </n-form-item>
      <n-form-item label="Frame Rate">
        <n-select v-model:value="settings.frameRate" :options="fpsOptions" />
      </n-form-item>
      <n-form-item label="Noise Cancellation">
        <n-switch v-model:value="settings.noiseCancellation" />
      </n-form-item>
      <n-form-item label="ICE Servers">
        <n-select v-model:value="settings.iceServers" :options="iceOptions" />
      </n-form-item>
    </n-form>
    <template #footer>
      <n-space justify="end">
        <n-button @click="reset">Reset</n-button>
        <n-button type="primary" @click="show = false">Done</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script lang="ts">
export interface WebRTCSettings {
  cameraFacing: '' | 'user' | 'environment'
  videoQuality: '480' | '720' | '1080'
  frameRate: '15' | '30' | '60'
  noiseCancellation: boolean
  iceServers: 'stun' | 'both'
}

export const DEFAULT_WEBRTC_SETTINGS: WebRTCSettings = {
  cameraFacing: '',
  videoQuality: '720',
  frameRate: '30',
  noiseCancellation: true,
  iceServers: 'stun'
}
</script>

<script setup lang="ts">
import { NAlert, NButton, NForm, NFormItem, NModal, NSelect, NSpace, NSwitch } from 'naive-ui'

const settings = defineModel<WebRTCSettings>('settings', { required: true })
const show = defineModel<boolean>('show', { required: true })

const cameraOptions = [
  { label: 'Default Camera', value: '' },
  { label: 'Front Camera', value: 'user' },
  { label: 'Back Camera', value: 'environment' }
]

const qualityOptions = [
  { label: '480p SD', value: '480' },
  { label: '720p HD', value: '720' },
  { label: '1080p Full HD', value: '1080' }
]

const fpsOptions = [
  { label: '15 FPS', value: '15' },
  { label: '30 FPS', value: '30' },
  { label: '60 FPS', value: '60' }
]

const iceOptions = [
  { label: 'STUN Only', value: 'stun' },
  { label: 'STUN + TURN', value: 'both' }
]

function reset() {
  Object.assign(settings.value, DEFAULT_WEBRTC_SETTINGS)
}
</script>
