<template>
  <div class="toast-wrapper">
    <button 
      class="toast-toggle-btn" 
      @click="togglePanel" 
      :class="{ 'has-unread': activeToastCount > 0 }"
      title="Notifications"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>
      </svg>
      <span v-if="activeToastCount > 0" class="toast-badge">{{ activeToastCount }}</span>
    </button>
    
    <div v-show="isPanelOpen" class="toast-container">
      <div class="toast-list">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="[
            `toast-${toast.type}`,
            { 'toast-dismissed': toast.dismissed }
          ]"
        >
          <div class="toast-icon">
            {{ getToastIcon(toast.type) }}
          </div>
          <div class="toast-content">
            <div class="toast-message">{{ toast.message }}</div>
            <div class="toast-time">{{ formatTime(toast.timestamp) }}</div>
          </div>
          <button class="toast-close" @click="dismissToast(toast.id)" title="Dismiss">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
            </svg>
          </button>
        </div>
        <div v-if="toasts.length === 0" class="toast-empty">
          <div class="toast-empty-icon">📭</div>
          <div class="toast-empty-text">No notifications</div>
        </div>
      </div>
      <div v-if="toasts.length > 0" class="toast-footer">
        <button class="toast-clear" @click="clearAll" title="Clear all notifications">
          Clear All
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToast } from '@/composables/useToast'

const { toasts, dismissToast, clearAll, getToastIcon, formatTime } = useToast()

const isPanelOpen = ref(false)

const activeToastCount = computed(() => {
  return toasts.value.filter(t => !t.dismissed).length
})

const togglePanel = () => {
  isPanelOpen.value = !isPanelOpen.value
}
</script>

<style scoped>
.toast-wrapper {
  position: fixed;
  top: 10px;
  right: 10px;
  z-index: 9999;
}

.toast-toggle-btn {
  position: relative;
  background-color: #3c3c3c;
  border: none;
  color: #cccccc;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.toast-toggle-btn:hover {
  background-color: #4c4c4c;
  color: #ffffff;
  transform: scale(1.05);
}

.toast-toggle-btn.has-unread {
  background-color: #0e639c;
  color: #ffffff;
}

.toast-toggle-btn.has-unread:hover {
  background-color: #1177bb;
}

.toast-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background-color: #f44336;
  color: #ffffff;
  font-size: 11px;
  font-weight: bold;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  border: 2px solid #1e1e1e;
}

.toast-container {
  position: absolute;
  top: 50px;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: calc(100vh - 120px);
  pointer-events: none;
}

.toast-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  pointer-events: auto;
  max-height: calc(100vh - 180px);
  min-width: 320px;
  max-width: 420px;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 4px;
  background-color: #252526;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  min-width: 320px;
  max-width: 420px;
  transition: all 0.3s ease;
  opacity: 1;
  transform: translateX(0);
}

.toast-dismissed {
  opacity: 0;
  transform: translateX(100%);
  pointer-events: none;
}

.toast-success {
  border-left: 3px solid #4caf50;
}

.toast-error {
  border-left: 3px solid #f44336;
}

.toast-info {
  border-left: 3px solid #2196f3;
}

.toast-warning {
  border-left: 3px solid #ff9800;
}

.toast-icon {
  font-size: 18px;
  font-weight: bold;
  min-width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

.toast-success .toast-icon {
  color: #4caf50;
}

.toast-error .toast-icon {
  color: #f44336;
}

.toast-info .toast-icon {
  color: #2196f3;
}

.toast-warning .toast-icon {
  color: #ff9800;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-message {
  font-size: 13px;
  color: #cccccc;
  line-height: 1.4;
  word-wrap: break-word;
}

.toast-time {
  font-size: 11px;
  color: #858585;
  margin-top: 4px;
}

.toast-close {
  background: none;
  border: none;
  color: #858585;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  transition: all 0.15s;
  flex-shrink: 0;
}

.toast-close:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #cccccc;
}

.toast-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #858585;
}

.toast-empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.toast-empty-text {
  font-size: 14px;
}

.toast-footer {
  display: flex;
  justify-content: flex-end;
  pointer-events: auto;
  padding-top: 8px;
}

.toast-clear {
  background-color: #3c3c3c;
  border: none;
  color: #cccccc;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.15s;
}

.toast-clear:hover {
  background-color: #4c4c4c;
  color: #ffffff;
}

.toast-list::-webkit-scrollbar {
  width: 6px;
}

.toast-list::-webkit-scrollbar-track {
  background: transparent;
}

.toast-list::-webkit-scrollbar-thumb {
  background: #3c3c3c;
  border-radius: 3px;
}

.toast-list::-webkit-scrollbar-thumb:hover {
  background: #4c4c4c;
}
</style>
