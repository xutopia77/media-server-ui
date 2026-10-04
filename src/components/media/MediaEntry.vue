<template>
  <n-layout has-sider class="media-entry">
    <n-layout-sider bordered :width="280" content-style="display: flex; flex-direction: column; height: 100%">
      <div class="sidebar-header">
        <div class="my-id">My ID: <code>{{ myUid }}</code></div>
        <div class="pub-row">
          <span class="pub-title">Publishers</span>
          <n-tag size="small" type="info" round>{{ roomStore.userCount }} online</n-tag>
        </div>
      </div>
      <div class="user-list">
        <n-empty v-if="roomStore.users.length === 0" description="No publishers yet" class="user-empty" />
        <div v-for="user in roomStore.users" :key="user.uid" class="user-item">
          <n-avatar round :size="36">{{ userLabel(user.uid).charAt(0).toUpperCase() }}</n-avatar>
          <div class="user-meta">
            <div class="user-name">{{ userLabel(user.uid) }}</div>
            <div class="user-sub">{{ user.status }} · P{{ user.publishers }} S{{ user.subscribers }}</div>
          </div>
          <n-button
            size="tiny"
            type="primary"
            secondary
            :loading="pendingUids.has(user.uid)"
            :disabled="user.uid in remoteStreams"
            @click="playUser(user)"
          >
            {{ user.uid in remoteStreams ? 'Playing' : 'Play' }}
          </n-button>
        </div>
      </div>
    </n-layout-sider>

    <n-layout-content content-style="padding: 16px;" class="media-content">
      <div class="control-bar">
        <n-button :type="isCameraOn ? 'primary' : 'default'" @click="toggleCamera">
          {{ isCameraOn ? 'Camera Off' : 'Camera On' }}
        </n-button>
        <n-button :type="isMuted ? 'warning' : 'default'" :disabled="!isCameraOn" @click="toggleMute">
          {{ isMuted ? 'Unmute' : 'Mute' }}
        </n-button>
        <n-button
          :type="isScreenSharing ? 'primary' : 'default'"
          :disabled="!isCameraOn && !isScreenSharing"
          @click="toggleScreenShare"
        >
          {{ isScreenSharing ? 'Stop Share' : 'Screen' }}
        </n-button>
        <n-button :type="isPublishing ? 'error' : 'success'" :disabled="!isCameraOn" @click="togglePublish">
          {{ isPublishing ? 'Stop Publish' : 'Publish' }}
        </n-button>
        <n-button quaternary @click="showSettings = true">Settings</n-button>
      </div>

      <div class="video-grid">
        <VideoCard
          v-if="isCameraOn"
          :stream="localPreviewStream"
          :label="`Local (${myUid})`"
          :status="isPublishing ? 'Publishing' : 'Preview'"
          muted
        />
        <VideoCard
          v-for="item in remoteItems"
          :key="item.uid"
          :stream="item.stream"
          :label="userLabel(item.uid)"
          :status="userStatus(item.uid)"
          show-stop
          @stop="stopPlay(item.uid)"
        />
        <n-empty
          v-if="!isCameraOn && Object.keys(remoteStreams).length === 0"
          description="No active video"
          class="grid-empty"
        >
          <template #extra>Start the camera and publish, or play a publisher from the list.</template>
        </n-empty>
      </div>
    </n-layout-content>

    <SettingsPanel v-model:show="showSettings" v-model:settings="settings" />
  </n-layout>
</template>

<script setup lang="ts">
import { computed, onUnmounted, reactive, ref, shallowReactive, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { NAvatar, NButton, NEmpty, NLayout, NLayoutContent, NLayoutSider, NTag } from 'naive-ui'
import { useRoomStore } from '@/stores/room'
import type { CameraOptions, RoomUser } from '@/utils/dataTypedef'
import { getIceServers } from '@/utils/RtcApi'
import { useAppMessage } from '@/composables/useAppMessage'
import VideoCard from './VideoCard.vue'
import SettingsPanel, { DEFAULT_WEBRTC_SETTINGS, type WebRTCSettings } from './SettingsPanel.vue'

const message = useAppMessage()
const roomStore = useRoomStore()
const route = useRoute()

// roomId / uid come from the URL query, with sensible defaults.
const queryRoomId = typeof route.query.roomId === 'string' && route.query.roomId ? route.query.roomId : ''
const queryUid = typeof route.query.uid === 'string' && route.query.uid ? route.query.uid : ''
const roomId = queryRoomId || '2001'

const generateUid = (): string => {
  const now = Date.now()
  return `${Math.floor(now / 1000)}${(now % 1000).toString().padStart(3, '0')}`
}
const myUid = queryUid || generateUid()
roomStore.setMyUid(myUid)

// ---------------------------------------------------------------- state

const settings = reactive<WebRTCSettings>({ ...DEFAULT_WEBRTC_SETTINGS })
const showSettings = ref(false)

const isCameraOn = ref(false)
const isPublishing = ref(false)
const isMuted = ref(false)
const isScreenSharing = ref(false)

const localStream = shallowRef<MediaStream | null>(null)
const screenStream = shallowRef<MediaStream | null>(null)
const localPreviewStream = computed(() => screenStream.value ?? localStream.value)

// uid -> remote MediaStream. shallowReactive keeps native MediaStream objects unproxied.
const remoteStreams = shallowReactive<Record<string, MediaStream>>({})
const pendingUids = reactive(new Set<string>())

const remoteItems = computed(() =>
  Object.entries(remoteStreams).map(([uid, stream]) => ({ uid, stream }))
)

// ---------------------------------------------------------------- helpers

function userLabel(uid: string): string {
  const user = roomStore.users.find((u) => u.uid === uid)
  return user?.streamId || user?.uid || uid
}

function userStatus(uid: string): string {
  const user = roomStore.users.find((u) => u.uid === uid)
  return user?.status ?? 'connecting'
}

function buildCameraOptions(): CameraOptions {
  const sizes: Record<WebRTCSettings['videoQuality'], [number, number]> = {
    '480': [640, 480],
    '720': [1280, 720],
    '1080': [1920, 1080]
  }
  const [width, height] = sizes[settings.videoQuality]
  return {
    width,
    height,
    frameRate: Number(settings.frameRate),
    facingMode: settings.cameraFacing || undefined,
    audio: true,
    noiseSuppression: settings.noiseCancellation
  }
}

// ---------------------------------------------------------------- camera / mute

async function toggleCamera() {
  if (isCameraOn.value) {
    if (isPublishing.value) stopPublish()
    rtcApi().stopCamera()
    localStream.value = null
    isCameraOn.value = false
    message.info('Camera stopped')
    return
  }
  try {
    const stream = await rtcApi().startCamera(buildCameraOptions())
    localStream.value = stream
    isCameraOn.value = true
    isMuted.value = false
    message.success('Camera started')
  } catch (error) {
    message.error('Camera access failed: ' + (error as Error).message)
  }
}

function toggleMute() {
  if (!isCameraOn.value) {
    message.warning('Start the camera first')
    return
  }
  const track = localStream.value?.getAudioTracks()[0]
  if (!track) {
    message.warning('No audio track available')
    return
  }
  track.enabled = isMuted.value
  isMuted.value = !isMuted.value
}

// ---------------------------------------------------------------- screen share

async function toggleScreenShare() {
  if (isScreenSharing.value) {
    stopScreenShare()
    return
  }
  if (!isCameraOn.value) {
    message.warning('Start the camera first')
    return
  }
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
    const track = stream.getVideoTracks()[0]
    if (!track) {
      throw new Error('No screen track')
    }
    screenStream.value = stream
    isScreenSharing.value = true
    await rtcApi().replaceVideoTrack(track)
    // Browser "Stop sharing" button ends the track; restore the camera then.
    track.addEventListener('ended', () => stopScreenShare())
    message.info('Screen sharing started')
  } catch (error) {
    message.error('Screen share failed: ' + (error as Error).message)
  }
}

function stopScreenShare() {
  const stream = screenStream.value
  if (!stream) return
  screenStream.value = null
  isScreenSharing.value = false
  stream.getTracks().forEach((track) => track.stop())
  const camTrack = localStream.value?.getVideoTracks()[0]
  if (camTrack && isPublishing.value) {
    rtcApi().replaceVideoTrack(camTrack).catch(() => {})
  }
  message.info('Screen sharing stopped')
}

// ---------------------------------------------------------------- publish

async function togglePublish() {
  if (isPublishing.value) {
    stopPublish()
    return
  }
  if (!isCameraOn.value || !localStream.value) {
    message.warning('Start the camera first')
    return
  }
  try {
    const sessionId = await rtcApi().startPublish(localStream.value, {
      streamurl: `webrtc://${window.location.host}/${roomId}/${myUid}`,
      clientip: '127.0.0.1',
      iceServers: getIceServers(settings.iceServers)
    })
    isPublishing.value = true
    message.success('Publish started, session: ' + sessionId)
  } catch (error) {
    message.error('Publish failed: ' + (error as Error).message)
  }
}

function stopPublish() {
  rtcApi().stopPublish()
  isPublishing.value = false
  message.info('Publish stopped')
}

// ---------------------------------------------------------------- play (remote)

async function playUser(user: RoomUser) {
  const streamId = user.streamId || user.uid
  if (!streamId) {
    message.warning('User has no streamId')
    return
  }
  if (user.uid in remoteStreams || pendingUids.has(user.uid)) return

  pendingUids.add(user.uid)
  try {
    const stream = await rtcApi().startPlay(user.uid, {
      streamurl: `webrtc://${window.location.host}/${roomId}/${streamId}`,
      clientip: '127.0.0.1',
      iceServers: getIceServers(settings.iceServers)
    })
    remoteStreams[user.uid] = stream
  } catch (error) {
    message.error('Play failed: ' + (error as Error).message)
  } finally {
    pendingUids.delete(user.uid)
  }
}

function stopPlay(uid: string) {
  rtcApi().stopPlay(uid)
  delete remoteStreams[uid]
}

// Keep playing cards in sync with the room user list (publisher left -> stop & remove).
watch(
  () => roomStore.users.map((u) => u.uid).join(','),
  () => {
    const active = new Set(roomStore.users.map((u) => u.uid))
    for (const uid of Object.keys(remoteStreams)) {
      if (!active.has(uid)) {
        stopPlay(uid)
      }
    }
  }
)

onUnmounted(() => {
  rtcApi().stopAllPlays()
  rtcApi().stopPublish()
  rtcApi().stopCamera()
  screenStream.value?.getTracks().forEach((track) => track.stop())
})

// The room store owns the single RtcApi instance.
function rtcApi() {
  return roomStore.getRtcApi()
}
</script>

<style scoped>
.media-entry {
  height: 100%;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #3c3c3c;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.my-id {
  font-size: 12px;
  color: #858585;
}

.my-id code {
  color: #4fc3f7;
  font-family: monospace;
}

.pub-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pub-title {
  font-size: 15px;
  font-weight: 500;
  color: #ffffff;
}

.user-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.user-empty {
  margin-top: 40px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 4px;
}

.user-item:hover {
  background-color: rgba(255, 255, 255, 0.04);
}

.user-meta {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 13px;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-sub {
  font-size: 11px;
  color: #858585;
}

.control-bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.video-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-content: flex-start;
}

.grid-empty {
  margin: 80px auto;
}
</style>
