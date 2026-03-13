<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NCard, NProgress, NTag } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import type { FileStatus, FileTask } from '../../types'
import { formatFileSize } from '../../utils/fileUtils'

const props = defineProps<{
  task: FileTask
  showDetails?: boolean
  showActions?: boolean
}>()

const emit = defineEmits<{
  cancel: [taskId: string]
  retry: [taskId: string]
  remove: [taskId: string]
}>()

const { t } = useI18n()

const statusConfig = computed(() => {
  const map: Record<FileStatus, { type: 'default' | 'info' | 'warning' | 'success' | 'error'; label: string }> = {
    pending: { type: 'default', label: t('common.pending') },
    uploading: { type: 'info', label: t('common.uploading') },
    processing: { type: 'warning', label: t('common.processing') },
    completed: { type: 'success', label: t('common.completed') },
    failed: { type: 'error', label: t('common.failed') },
    cancelled: { type: 'default', label: t('common.cancel') }
  }

  return map[props.task.status]
})

const canDownload = computed(() => props.task.status === 'completed' && props.task.result?.url)
const canCancel = computed(() => props.task.status === 'pending' || props.task.status === 'processing')
const canRetry = computed(() => props.task.status === 'failed' || props.task.status === 'cancelled')
const canRemove = computed(() => props.task.status !== 'processing')

const processingTime = computed(() => {
  if (!props.task.startedAt) return '--'

  const endTime = props.task.completedAt || new Date()
  const seconds = Math.round((endTime.getTime() - props.task.startedAt.getTime()) / 1000)
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
})

const handleDownload = () => {
  if (!canDownload.value || !props.task.result?.url) return
  const anchor = document.createElement('a')
  anchor.href = props.task.result.url
  anchor.download = props.task.result.filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}
</script>

<template>
  <NCard embedded :bordered="false" size="small" class="task-card">
    <div class="space-y-4">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="truncate text-sm font-semibold md:text-base">{{ task.originalName }}</div>
          <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--studio-muted)]">
            <NTag size="small" round :type="statusConfig.type" :bordered="false">{{ statusConfig.label }}</NTag>
            <span>{{ formatFileSize(task.originalSize) }}</span>
            <span v-if="task.result?.size">→ {{ formatFileSize(task.result.size) }}</span>
            <span>{{ processingTime }}</span>
          </div>
        </div>

        <div v-if="showActions !== false" class="flex flex-wrap justify-end gap-2">
          <NButton v-if="canDownload" size="small" secondary type="success" @click="handleDownload">
            {{ t('common.download') }}
          </NButton>
          <NButton v-if="canRetry" size="small" secondary type="warning" @click="emit('retry', task.id)">
            {{ t('common.retry') }}
          </NButton>
          <NButton v-if="canCancel" size="small" secondary type="error" @click="emit('cancel', task.id)">
            {{ t('common.cancel') }}
          </NButton>
          <NButton v-if="canRemove" size="small" quaternary @click="emit('remove', task.id)">
            {{ t('common.remove') }}
          </NButton>
        </div>
      </div>

      <NProgress
        v-if="task.status === 'processing' || task.status === 'uploading'"
        type="line"
        :percentage="task.progress"
        :indicator-placement="'inside'"
        processing
        :height="10"
        rail-color="color-mix(in srgb, var(--studio-muted) 18%, transparent)"
        color="var(--studio-accent)"
      />

      <div v-if="task.error" class="rounded-2xl border border-[color:color-mix(in_srgb,var(--studio-danger)_30%,transparent)] bg-[color:color-mix(in_srgb,var(--studio-danger)_10%,transparent)] px-4 py-3 text-sm text-[var(--studio-danger)]">
        {{ task.error }}
      </div>

      <div v-if="showDetails || task.status === 'completed'" class="grid gap-3 text-xs text-[var(--studio-muted)] md:grid-cols-4">
        <div>
          <div class="metric-label">{{ t('common.original') }}</div>
          <div class="metric-value">{{ formatFileSize(task.originalSize) }}</div>
        </div>
        <div v-if="task.result">
          <div class="metric-label">{{ t('common.converted') }}</div>
          <div class="metric-value">{{ formatFileSize(task.result.size) }}</div>
        </div>
        <div v-if="task.result?.width && task.result?.height">
          <div class="metric-label">{{ t('common.size') }}</div>
          <div class="metric-value">{{ task.result.width }} × {{ task.result.height }}</div>
        </div>
        <div v-if="task.result?.format">
          <div class="metric-label">{{ t('common.format') }}</div>
          <div class="metric-value">{{ task.result.format.toUpperCase() }}</div>
        </div>
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.task-card {
  border-radius: 22px;
  border: 1px solid var(--studio-line);
}

.metric-label {
  margin-bottom: 6px;
}

.metric-value {
  color: var(--studio-ink);
  font-weight: 700;
}
</style>
