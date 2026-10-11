<template>
  <div class="video-card">
    <video ref="videoEl" :muted="muted" autoplay playsinline></video>
    <div class="video-footer">
      <span class="video-label">{{ label }}</span>
      <span v-if="status" class="video-status">
        <span class="status-dot" />
        {{ status }}
      </span>
      <n-button v-if="showStop" size="tiny" type="error" secondary @click="emit('stop')">Stop</n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  stream: MediaStream | null
  label: string
  status?: string
  muted?: boolean
  showStop?: boolean
}>()

const emit = defineEmits<{ stop: [] }>()

const videoEl = ref<HTMLVideoElement | null>(null)

// Bind the stream as soon as the element exists and whenever it changes,
// so callers never need to wait for rendering (no setTimeout hacks).
watch(
  () => props.stream,
  (stream) => {
    if (videoEl.value) {
      videoEl.value.srcObject = stream
    }
  },
  { immediate: true, flush: 'post' }
)
</script>

<style scoped>
.video-card {
  background-color: #252526;
  border: 1px solid #3c3c3c;
  border-radius: 6px;
  overflow: hidden;
  min-width: 240px;
  flex: 1 1 320px;
  max-width: 560px;
}

.video-card video {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #000000;
  object-fit: cover;
}

.video-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
}

.video-label {
  flex: 1;
  font-size: 13px;
  color: #cccccc;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #858585;
}

.status-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #4caf50;
}
</style>
