<template>
  <div class="gb-device-entry">
    <n-card title="GB28181 Device" class="gb-card">
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

      <n-select
        v-model:value="selectedId"
        class="device-select"
        filterable
        placeholder="Select a registered device"
        :options="deviceOptions"
        :consistent-menu-width="false"
      />

      <template v-if="selectedUser">
        <n-descriptions label-placement="left" size="small" bordered class="device-info">
          <n-descriptions-item label="Device ID">{{ selectedUser.id }}</n-descriptions-item>
          <n-descriptions-item label="Address">{{ selectedUser.ip }}:{{ selectedUser.port }}</n-descriptions-item>
          <n-descriptions-item label="Channels">{{ selectedUser.devices?.length ?? 0 }}</n-descriptions-item>
        </n-descriptions>

        <n-data-table
          class="channel-table"
          size="small"
          :columns="channelColumns"
          :data="selectedChannels"
          :bordered="false"
        >
          <template #empty>
            <n-empty description="No channel in catalog for this device. Query the catalog on the GB page first." />
          </template>
        </n-data-table>

        <n-alert
          v-if="play.playingUrl.value"
          type="success"
          closable
          class="flv-alert"
          @close="play.playingUrl.value = ''"
        >
          <p class="flv-alert-title">Play requested. Once the device sends media, pull the live stream via HTTP-FLV:</p>
          <n-text code>{{ play.playingUrl.value }}</n-text>
        </n-alert>
      </template>
      <n-empty v-else class="page-empty" description="No GB device registered yet" />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from 'vue'
import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NEmpty,
  NSelect,
  NSwitch,
  NTag,
  NText,
  type DataTableColumns
} from 'naive-ui'
import type { GbUser } from '@/api/gb'
import { useGbStatus } from '@/composables/useGbStatus'
import { useGbPlay } from '@/composables/useGbPlay'

interface ChannelRow {
  id: string
  model: string
}

const { status, loading, error, autoRefresh, lastUpdated, refresh, startPolling } = useGbStatus()
const play = useGbPlay()

const selectedId = ref('')

const deviceOptions = computed(() =>
  status.value.users.map((user) => ({
    label: `${user.id} (${user.ip}:${user.port})`,
    value: user.id
  }))
)

// Drop the selection when the picked device unregisters.
watch(
  () => status.value.users,
  (users) => {
    if (selectedId.value && !users.some((u) => u.id === selectedId.value)) {
      selectedId.value = ''
    }
  }
)

const selectedUser = computed<GbUser | undefined>(() =>
  status.value.users.find((user) => user.id === selectedId.value)
)

const selectedChannels = computed<ChannelRow[]>(
  () =>
    selectedUser.value?.devices?.map((dev) => ({
      id: dev.id,
      model: dev.model ?? ''
    })) ?? []
)

const lastUpdatedText = computed(() =>
  lastUpdated.value ? `Updated ${new Date(lastUpdated.value).toLocaleTimeString()}` : 'Not updated yet'
)

const channelColumns: DataTableColumns<ChannelRow> = [
  { title: 'Channel ID', key: 'id', minWidth: 220 },
  { title: 'Model', key: 'model', minWidth: 120 },
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
.gb-device-entry {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
}

.gb-card {
  max-width: 960px;
  margin: 0 auto;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.updated-text {
  font-size: 12px;
}

.device-select {
  max-width: 480px;
  margin-bottom: 16px;
}

.device-info {
  margin-bottom: 16px;
}

.channel-table {
  margin-bottom: 12px;
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

.page-empty {
  padding: 40px 0;
}

.row-actions {
  display: flex;
  gap: 8px;
}
</style>
