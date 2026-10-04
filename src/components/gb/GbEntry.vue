<template>
  <div class="gb-entry">
    <h1>GB28181</h1>
    <n-result status="info" title="Under Development" description="GB28181 signaling and streaming is not available yet.">
      <template #footer>
        <n-button @click="router.push('/')">Back to Home</n-button>
      </template>
    </n-result>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { NButton, NResult } from 'naive-ui'

const router = useRouter()
</script>

<style scoped>
.gb-entry {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.gb-entry h1 {
  font-size: 32px;
  font-weight: 300;
  color: #ffffff;
}
</style>
