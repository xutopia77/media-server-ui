<template>
  <div class="admin-entry">
    <n-card title="Server Streams" class="admin-card">
      <template #header-extra>
        <div class="header-actions">
          <n-text depth="3" class="updated-text">{{ lastUpdatedText }}</n-text>
          <n-button size="small" :loading="loading" @click="refresh">Refresh</n-button>
        </div>
      </template>

      <n-alert v-if="error" type="error" closable class="error-alert" @close="error = ''">
        {{ error }}
      </n-alert>

      <n-data-table
        size="small"
        :columns="columns"
        :data="rows"
        :bordered="false"
        :loading="loading && rows.length === 0"
      >
        <template #empty>
          <n-empty description="No streams on the server" />
        </template>
      </n-data-table>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, onUnmounted, ref } from 'vue'
import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NEmpty,
  NTag,
  NText,
  type DataTableColumns
} from 'naive-ui'
import { getStreams, type StreamInfo } from '@/api/streams'

/**
 * Server stream statistics page. Data comes from GET /api/v1/streams
 * (see src/api/streams.ts for the field contract) and is polled every 10s.
 * Columns adapt to the fields actually present in the response: a known
 * field missing from every row is hidden, and unknown extra fields are
 * appended with their raw key as the column title.
 */
type StreamRow = StreamInfo

interface FieldDef {
  key: string
  title: string
}

// Contract fields in display order; all optional, missing ones are hidden.
const fieldDefs: FieldDef[] = [
  { key: 'roomId', title: 'Room ID' },
  { key: 'streamId', title: 'Stream ID' },
  { key: 'type', title: 'Type' },
  { key: 'videoCodec', title: 'Video' },
  { key: 'audioCodec', title: 'Audio' },
  { key: 'gopCache', title: 'GOP Cache' },
  { key: 'viewers', title: 'Viewers' },
  { key: 'subscribeTotal', title: 'Subscribers' },
  { key: 'duration', title: 'Duration' }
]

const rows = ref<StreamRow[]>([])
const loading = ref(false)
const error = ref('')
const lastUpdated = ref(0)

let timer: ReturnType<typeof setInterval> | null = null

const lastUpdatedText = computed(() =>
  lastUpdated.value ? `Updated ${new Date(lastUpdated.value).toLocaleTimeString()}` : 'Not updated yet'
)

function renderValue(v: unknown) {
  if (typeof v === 'boolean') {
    return h(
      NTag,
      { size: 'small', bordered: false, type: v ? 'success' : 'default' },
      { default: () => (v ? 'Yes' : 'No') }
    )
  }
  return String(v ?? '')
}

const columns = computed<DataTableColumns<StreamRow>>(() => {
  // With no data yet, show all contract fields so the empty table has headers.
  let fields = fieldDefs
  if (rows.value.length > 0) {
    const present = fieldDefs.filter((f) => rows.value.some((row) => row[f.key] !== undefined))
    const knownKeys = new Set(present.map((f) => f.key))
    const extraKeys: string[] = []
    for (const row of rows.value) {
      for (const key of Object.keys(row)) {
        if (!knownKeys.has(key) && row[key] !== undefined && !extraKeys.includes(key)) {
          extraKeys.push(key)
        }
      }
    }
    fields = [...present, ...extraKeys.map((key) => ({ key, title: key }))]
  }

  return fields.map((f) => ({
    title: f.title,
    key: f.key,
    minWidth: 110,
    render(row: StreamRow) {
      return renderValue(row[f.key])
    }
  }))
})

async function refresh() {
  if (loading.value) return
  loading.value = true
  try {
    rows.value = await getStreams()
    error.value = ''
    lastUpdated.value = Date.now()
  } catch (err) {
    error.value = (err as Error).message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void refresh()
  timer = setInterval(() => void refresh(), 10000)
})

onUnmounted(() => {
  if (timer !== null) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<style scoped>
.admin-entry {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.admin-card {
  width: 100%;
  max-width: 960px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.updated-text {
  font-size: 12px;
}

.error-alert {
  margin-bottom: 12px;
}
</style>
