<template>
  <div class="gb-entry">
    <n-card title="GB28181 Server" class="gb-card">
      <template #header-extra>
        <div class="header-actions">
          <n-text depth="3" class="updated-text">{{ lastUpdatedText }}</n-text>
          <n-switch v-model:value="autoRefresh" size="small">
            <template #checked>Auto refresh</template>
            <template #unchecked>Auto refresh</template>
          </n-switch>
          <n-button size="small" :loading="loading" @click="refresh">Refresh</n-button>
        </div>
      </template>

      <n-alert v-if="error" type="error" closable class="error-alert" @close="error = ''">
        {{ error }}
      </n-alert>

      <div class="stats">
        <n-statistic label="Registered Devices" :value="userRows.length" />
        <n-statistic label="Catalog Channels" :value="channelRows.length" />
      </div>
    </n-card>

    <n-card title="Registered SIP Devices" class="gb-card">
      <n-data-table
        size="small"
        :columns="userColumns"
        :data="userRows"
        :bordered="false"
        :loading="loading && userRows.length === 0"
      >
        <template #empty>
          <n-empty description="No GB device registered yet" />
        </template>
      </n-data-table>
    </n-card>

    <n-card title="Channel Catalog" class="gb-card">
      <n-data-table
        size="small"
        :columns="channelColumns"
        :data="channelRows"
        :bordered="false"
        :loading="loading && channelRows.length === 0"
      >
        <template #empty>
          <n-empty description="No channel in catalog. Use the Query Catalog action above." />
        </template>
      </n-data-table>

      <n-alert v-if="play.playingUrl.value" type="success" closable class="flv-alert" @close="play.playingUrl.value = ''">
        <p class="flv-alert-title">Play requested. Once the device sends media, pull the live stream via HTTP-FLV:</p>
        <n-text code>{{ play.playingUrl.value }}</n-text>
      </n-alert>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NEmpty,
  NStatistic,
  NSwitch,
  NTag,
  NText,
  type DataTableColumns
} from 'naive-ui'
import { queryGbCatalog, type GbUser } from '@/api/gb'
import { useGbStatus } from '@/composables/useGbStatus'
import { useGbPlay } from '@/composables/useGbPlay'
import { useAppMessage } from '@/composables/useAppMessage'

interface UserRow {
  id: string
  address: string
  channels: number
}

interface ChannelRow {
  id: string
  model: string
  userId: string
}

const appMessage = useAppMessage()
const { status, loading, error, autoRefresh, lastUpdated, refresh, startPolling } = useGbStatus()
const play = useGbPlay()

const catalogBusy = ref<Record<string, boolean>>({})

const userRows = computed<UserRow[]>(() =>
  status.value.users.map((user: GbUser) => ({
    id: user.id,
    address: `${user.ip}:${user.port}`,
    channels: user.devices?.length ?? 0
  }))
)

const channelRows = computed<ChannelRow[]>(() => {
  const rows: ChannelRow[] = []
  for (const user of status.value.users) {
    for (const dev of user.devices ?? []) {
      rows.push({ id: dev.id, model: dev.model ?? '', userId: user.id })
    }
  }
  return rows
})

const lastUpdatedText = computed(() =>
  lastUpdated.value ? `Updated ${new Date(lastUpdated.value).toLocaleTimeString()}` : 'Not updated yet'
)

async function queryCatalog(row: UserRow) {
  if (catalogBusy.value[row.id]) return
  catalogBusy.value[row.id] = true
  try {
    await queryGbCatalog(row.id)
    appMessage.success(`Catalog query sent to ${row.id}; channels will show up after the device replies`)
  } catch (err) {
    appMessage.error((err as Error).message, 'Catalog query failed')
  } finally {
    catalogBusy.value[row.id] = false
  }
}

const userColumns: DataTableColumns<UserRow> = [
  { title: 'Device ID', key: 'id', minWidth: 220 },
  { title: 'Address', key: 'address', width: 200 },
  { title: 'Channels', key: 'channels', width: 110 },
  {
    title: 'Actions',
    key: 'actions',
    width: 160,
    render(row) {
      return h(
        NButton,
        {
          size: 'small',
          loading: !!catalogBusy.value[row.id],
          onClick: () => queryCatalog(row)
        },
        { default: () => 'Query Catalog' }
      )
    }
  }
]

const channelColumns: DataTableColumns<ChannelRow> = [
  { title: 'Channel ID', key: 'id', minWidth: 220 },
  { title: 'Model', key: 'model', minWidth: 120 },
  { title: 'Source Device', key: 'userId', minWidth: 200 },
  {
    title: 'Status',
    key: 'status',
    width: 140,
    render(row) {
      return play.requested.value[row.id]
        ? h(NTag, { type: 'success', size: 'small', bordered: false }, { default: () => 'Play Requested' })
        : h(NTag, { size: 'small', bordered: false }, { default: () => 'Idle' })
    }
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 170,
    render(row) {
      return h('div', { class: 'row-actions' }, [
        h(
          NButton,
          {
            size: 'small',
            type: 'primary',
            loading: !!play.busy.value[row.id],
            onClick: () => play.play(row.id)
          },
          { default: () => 'Play' }
        ),
        h(
          NButton,
          {
            size: 'small',
            type: 'error',
            secondary: true,
            loading: !!play.busy.value[row.id],
            onClick: () => play.stop(row.id)
          },
          { default: () => 'Stop' }
        )
      ])
    }
  }
]

onMounted(() => {
  void refresh()
  startPolling()
})
</script>

<style scoped>
.gb-entry {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
}

.gb-card {
  max-width: 960px;
  margin: 0 auto 20px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.updated-text {
  font-size: 12px;
}

.stats {
  display: flex;
  gap: 48px;
}

.error-alert {
  margin-bottom: 12px;
}

.flv-alert {
  margin-top: 12px;
}

.flv-alert-title {
  margin-bottom: 4px;
}

.row-actions {
  display: flex;
  gap: 8px;
}
</style>
