import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RoomUser } from '@/utils/dataTypedef'
import { RtcApi, createRtcApi } from '@/utils/RtcApi'
import { eventBus } from '@/utils/eventBus'

export const useRoomStore = defineStore('room', () => {
  const rtcApi = createRtcApi()

  const users = ref<RoomUser[]>([])
  const myUid = ref<string>('')
  const error = ref<string | null>(null)

  const userCount = computed(() => users.value.length)

  const handleRoomEvent = (data: unknown) => {
    const eventData = data as { 
      eventType: string
      roomId: string
      uid: string
      data: { 
        user?: Partial<RoomUser>
        users?: RoomUser[]
      }
    }

    if (!eventData) return

    const { eventType, data: roomData } = eventData

    switch (eventType) {
      case 'InitialUsers':
        if (roomData?.users && Array.isArray(roomData.users)) {
          setUsers(roomData.users)
        }
        break
      case 'PublishStart':
        if (roomData?.user) {
          addUser(roomData.user as RoomUser)
        }
        break
      case 'PublishStop':
        if (roomData?.user) {
          const uid = roomData.user.streamId || roomData.user.uid
          if (uid) {
            removeUser(uid)
          }
        }
        break
      default:
        break
    }
  }

  eventBus.on('room_event', handleRoomEvent)

  const setMyUid = (uid: string) => {
    myUid.value = uid
  }

  const addUser = (user: RoomUser) => {
    const uid = user.streamId || user.uid.split('/').pop() || user.uid
    if (uid === myUid.value) return
    
    const existingIndex = users.value.findIndex(u => 
      (u.streamId || u.uid.split('/').pop() || u.uid) === uid
    )
    if (existingIndex === -1) {
      users.value.push({
        ...user,
        uid: uid,
        streamId: uid
      })
    }
  }

  const removeUser = (uid: string) => {
    users.value = users.value.filter(u => 
      (u.streamId || u.uid.split('/').pop() || u.uid) !== uid
    )
  }

  const setUsers = (newUsers: RoomUser[]) => {
    users.value = newUsers
      .filter(u => {
        const uid = u.streamId || u.uid.split('/').pop() || u.uid
        return uid !== myUid.value
      })
      .map(u => ({
        ...u,
        uid: u.streamId || u.uid.split('/').pop() || u.uid,
        streamId: u.streamId || u.uid.split('/').pop() || u.uid
      }))
  }

  const resetState = () => {
    users.value = []
    error.value = null
  }

  const getRtcApi = (): RtcApi => rtcApi

  return {
    users,
    myUid,
    error,
    userCount,
    setMyUid,
    addUser,
    removeUser,
    setUsers,
    resetState,
    getRtcApi
  }
})
