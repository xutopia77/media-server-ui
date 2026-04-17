import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RoomUser, RoomInfo, UserStatus, UserType } from '@/utils/dataTypedef'
import { RtcApi, createRtcApi } from '@/utils/RtcApi'
import { eventBus } from '@/utils/eventBus'

export const useRoomStore = defineStore('room', () => {
  const rtcApi = createRtcApi()

  const currentRoom = ref<RoomInfo | null>(null)
  const currentUser = ref<RoomUser | null>(null)
  const users = ref<RoomUser[]>([])
  const isJoined = ref(false)
  const isJoining = ref(false)
  const error = ref<string | null>(null)

  let keepAliveTimer: number | null = null

  const userCount = computed(() => users.value.length)
  const onlineUsers = computed(() => users.value.filter(u => u.status === 'online'))
  const otherUsers = computed(() => users.value.filter(u => u.uid !== currentUser.value?.uid))

  const generateUid = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  const createLocalUser = (uid: string, roomId: string): RoomUser => ({
    uid,
    roomId,
    type: 'rtc' as UserType,
    status: 'online' as UserStatus,
    nickname: '',
    joinedAt: Date.now(),
    lastActiveAt: Date.now(),
    appId: roomId,
    publishers: 0,
    subscribers: 0,
    streamDir: 'Publish',
    streamId: uid
  })

  const joinRoom = async (roomId: string, nickname?: string) => {
    if (isJoining.value) {
      return { success: false, error: 'Already joining room' }
    }

    isJoining.value = true
    error.value = null

    const uid = currentUser.value?.uid || generateUid()

    try {
      await rtcApi.joinRoom({
        roomId,
        uid,
        nickname: nickname || undefined
      })

      const localUser = createLocalUser(uid, roomId)
      currentUser.value = localUser

      currentRoom.value = {
        roomId,
        createdAt: Date.now(),
        users: [localUser]
      }

      users.value = [localUser]
      isJoined.value = true

      startKeepAlive(roomId, uid)

      eventBus.on('room_event', handleRoomEvent)

      return { success: true, uid }
    } catch (err) {
      const errorMsg = (err as Error).message || 'Unknown error'

      if (errorMsg.includes('already in room')) {
        const localUser = createLocalUser(uid, roomId)
        currentUser.value = localUser
        currentRoom.value = {
          roomId,
          createdAt: Date.now(),
          users: [localUser]
        }
        users.value = [localUser]
        isJoined.value = true

        startKeepAlive(roomId, uid)
        eventBus.on('room_event', handleRoomEvent)

        return { success: true, uid, message: 'Reconnected to room' }
      }

      error.value = errorMsg
      return { success: false, error: errorMsg }
    } finally {
      isJoining.value = false
    }
  }

  const leaveRoom = async () => {
    if (!currentRoom.value || !currentUser.value) {
      return { success: false, error: 'Not in a room' }
    }

    const roomId = currentRoom.value.roomId || ''
    if (!roomId) {
      return { success: false, error: 'Invalid room ID' }
    }

    stopKeepAlive()

    try {
      await rtcApi.leaveRoom({
        roomId,
        uid: currentUser.value.uid
      })

      resetState()
      return { success: true }
    } catch (err) {
      const errorMsg = (err as Error).message || 'Unknown error'
      error.value = errorMsg
      return { success: false, error: errorMsg }
    }
  }

  const resetState = () => {
    currentRoom.value = null
    currentUser.value = null
    users.value = []
    isJoined.value = false
    error.value = null
    eventBus.off('room_event', handleRoomEvent)
  }

  const startKeepAlive = (roomId: string, uid: string) => {
    stopKeepAlive()

    const sendKeepAlive = async () => {
      if (!isJoined.value) return

      try {
        await rtcApi.keepAlive({ roomId, uid })
      } catch (err) {
        console.error('Keep alive failed:', err)
      }
    }

    sendKeepAlive()
    keepAliveTimer = window.setInterval(sendKeepAlive, 10000)
  }

  const stopKeepAlive = () => {
    if (keepAliveTimer !== null) {
      clearInterval(keepAliveTimer)
      keepAliveTimer = null
    }
  }

  const handleRoomEvent = (data: unknown) => {
    const eventData = data as { eventType: string; roomId: string; uid: string; data: { user?: Partial<RoomUser>; users?: RoomUser[] } }

    if (!eventData) return

    const { eventType, data: roomData } = eventData

    switch (eventType) {
      case 'UserJoin':
      case 'UserLeave':
      case 'PublishStart':
      case 'PublishStop':
      case 'SubscribeStart':
      case 'SubscribeStop':
        if (roomData?.users) {
          updateUserList(roomData.users)
        }
        break
      default:
        break
    }
  }

  const updateUserList = (newUsers: RoomUser[]) => {
    if (!currentUser.value) return

    const localUser = users.value.find(u => u.uid === currentUser.value?.uid)

    users.value = [
      localUser || createLocalUser(currentUser.value.uid, currentUser.value.roomId),
      ...newUsers.filter(u => u.uid !== currentUser.value?.uid)
    ]

    if (currentRoom.value) {
      currentRoom.value.users = users.value
    }
  }

  const updateUserStatus = (uid: string, status: UserStatus) => {
    const user = users.value.find(u => u.uid === uid)
    if (user) {
      user.status = status
      user.lastActiveAt = Date.now()
    }
  }

  const getRtcApi = (): RtcApi => rtcApi

  return {
    currentRoom,
    currentUser,
    users,
    isJoined,
    isJoining,
    error,

    userCount,
    onlineUsers,
    otherUsers,

    joinRoom,
    leaveRoom,
    updateUserList,
    updateUserStatus,
    getRtcApi,
    generateUid
  }
})
