<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NCard, NProgress, NTag, NTooltip, useMessage } from 'naive-ui'
import { LinkIcon } from '@heroicons/vue/24/outline'
import { useI18n } from 'vue-i18n'
import type { FileStatus, FileTask } from '../../types'
import { useConversionStore } from '../../stores/conversion'
import { formatFileSize } from '../../utils/fileUtils'

const props = defineProps<{
  task: FileTask
  showDetails?: boolean
  showActions?: boolean
}>()

const conversionStore = useConversionStore()
const { t } = useI18n()
const message = useMessage()

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

const displayProgress = computed(() => {
  if (props.task.status === 'uploading') {
    return props.task.uploadProgress ?? props.task.progress
  }

  return props.task.progress
})

const canDownload = computed(() => props.task.status === 'completed' && !!props.task.result?.url)
const canCopyLink = computed(() => props.task.status === 'completed' && !!props.task.copyableUrl)
const canCancel = computed(() => props.task.status === 'pending')
const canRetry = computed(() => props.task.status === 'failed' || props.task.status === 'cancelled')
const canRemove = computed(() => props.task.status !== 'processing' && props.task.status !== 'uploading')

const processingTime = computed(() => {
  if (!props.task.startedAt) return '--'

  const endTime = props.task.completedAt || new Date()
  const seconds = Math.max(0, Math.round((endTime.getTime() - props.task.startedAt.getTime()) / 1000))
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
})

const statusHint = computed(() => {
  if (props.task.status === 'uploading') {
    return `${t('common.uploading')} ${displayProgress.value}%`
  }

  if (props.task.status === 'processing') {
    return `${t('common.processing')} ${displayProgress.value}%`
  }

  if (props.task.status === 'completed' && props.task.result?.size) {
    return `${formatFileSize(props.task.result.size)}`
  }

  return processingTime.value
})

const handleDownload = async () => {
  await conversionStore.downloadTask(props.task.id)
}

const handleCopyLink = async () => {
  if (!props.task.copyableUrl) {
    return
  }

  try {
    await navigator.clipboard.writeText(props.task.copyableUrl)
    message.success(t('common.copySuccess'))
  } catch {
    message.error(t('common.copyUnavailable'))
  }
}

const handleRetry = () => {
  conversionStore.retryTask(props.task.id)
}

const handleThumbnailLoad = () => {
  if (props.task.thumbnailState !== 'ready' && props.task.thumbnailState !== 'error') {
    conversionStore.setTaskThumbnailState(props.task.id, 'ready')
  }
}

const handleThumbnailError = () => {
  if (props.task.thumbnailState !== 'error') {
    conversionStore.setTaskThumbnailState(props.task.id, 'error')
  }
}
</script>

<template>
  <NCard embedded :bordered="false" size="small" class="task-card">
    <div class="task-preview">
      <img
        v-if="task.thumbnailUrl"
        :src="task.thumbnailUrl"
        :alt="task.originalName"
        class="task-preview__image"
        @load="handleThumbnailLoad"
        @error="handleThumbnailError"
      />
      <div v-else class="task-preview__empty">{{ task.originalName.slice(0, 1).toUpperCase() }}</div>

      <div v-if="task.status === 'uploading' || task.status === 'processing'" class="task-preview__overlay">
        <div class="task-preview__overlay-label">{{ displayProgress }}%</div>
      </div>
    </div>

    <div class="task-body">
      <button
        v-if="canRetry"
        class="task-name task-name--interactive"
        type="button"
        :title="task.originalName"
        @click="handleRetry"
      >
        {{ task.originalName }}
      </button>
      <div v-else class="task-name" :title="task.originalName">{{ task.originalName }}</div>

      <div class="task-meta">
        <NTag size="small" round :type="statusConfig.type" :bordered="false">{{ statusConfig.label }}</NTag>
        <span class="task-meta__text">{{ statusHint }}</span>
      </div>

      <div class="task-size-row">
        <span class="task-size-text">{{ formatFileSize(task.originalSize) }}</span>
        <span v-if="task.result?.size" class="task-size-text">→ {{ formatFileSize(task.result.size) }}</span>
      </div>

      <NProgress
        v-if="task.status === 'processing' || task.status === 'uploading'"
        type="line"
        :percentage="displayProgress"
        :show-indicator="false"
        :height="8"
        rail-color="color-mix(in srgb, var(--studio-muted) 18%, transparent)"
        color="var(--studio-accent)"
      />

      <div v-if="task.error" class="task-error" :title="task.error">{{ task.error }}</div>

      <div v-if="showActions !== false" class="task-actions">
        <NButton v-if="canDownload" size="tiny" secondary type="success" @click="handleDownload">
          {{ t('common.download') }}
        </NButton>

        <NButton v-if="canRetry" size="tiny" secondary type="warning" @click="handleRetry">
          {{ t('common.retry') }}
        </NButton>

        <NTooltip v-if="task.status === 'completed' && !canCopyLink" trigger="hover">
          <template #trigger>
            <span class="task-action-disabled">
              <NButton size="tiny" tertiary disabled>
                <template #icon>
                  <LinkIcon class="h-3.5 w-3.5" />
                </template>
                {{ t('common.copyLink') }}
              </NButton>
            </span>
          </template>
          {{ t('common.copyUnavailable') }}
        </NTooltip>

        <NButton v-else-if="canCopyLink" size="tiny" tertiary @click="handleCopyLink">
          <template #icon>
            <LinkIcon class="h-3.5 w-3.5" />
          </template>
          {{ t('common.copyLink') }}
        </NButton>

        <NButton v-if="canCancel" size="tiny" tertiary type="error" @click="conversionStore.cancelTask(task.id)">
          {{ t('common.cancel') }}
        </NButton>

        <NButton v-if="canRemove" size="tiny" quaternary @click="conversionStore.removeFile(task.id)">
          {{ t('common.remove') }}
        </NButton>
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.task-card {
  position: relative;
  overflow: hidden;
  border-radius: 24px;
  border: 1px solid var(--studio-line);
  padding: 12px;
}

.task-card::before {
  content: '';
  position: absolute;
  inset: 0;
  padding: 1px;
  border-radius: inherit;
  background:
    conic-gradient(
      from 0deg,
      transparent 0deg,
      transparent 52deg,
      color-mix(in srgb, var(--studio-accent) 78%, white) 96deg,
      color-mix(in srgb, var(--studio-warm) 60%, white) 136deg,
      transparent 176deg,
      transparent 360deg
    );
  opacity: 0;
  pointer-events: none;
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: task-card-glow-spin 2.6s linear infinite;
  transition: opacity 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.task-card:hover::before,
.task-card:focus-within::before {
  opacity: 1;
}

.task-preview {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 20px;
  background:
    radial-gradient(circle at top, color-mix(in srgb, var(--studio-accent) 16%, transparent), transparent 58%),
    color-mix(in srgb, var(--studio-card) 88%, white 12%);
  border: 1px solid color-mix(in srgb, var(--studio-line) 88%, transparent);
}

.task-preview__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.task-preview__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--studio-accent);
  font-size: 28px;
  font-weight: 800;
}

.task-preview__overlay {
  position: absolute;
  inset: auto 8px 8px;
  padding: 4px 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--studio-paper) 82%, transparent);
  backdrop-filter: blur(8px);
}

.task-preview__overlay-label {
  white-space: nowrap;
  font-size: 11px;
  font-weight: 800;
}

.task-body {
  margin-top: 12px;
  display: grid;
  gap: 10px;
}

@keyframes task-card-glow-spin {
  to {
    transform: rotate(1turn);
  }
}

.task-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.4;
}

.task-name--interactive {
  border: 0;
  background: transparent;
  padding: 0;
  text-align: left;
  color: var(--studio-danger);
  cursor: pointer;
}

.task-meta,
.task-size-row,
.task-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.task-meta {
  justify-content: space-between;
}

.task-meta__text,
.task-size-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--studio-muted);
  font-size: 11px;
}

.task-size-row {
  flex-wrap: nowrap;
}

.task-error {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--studio-danger);
  font-size: 11px;
}

.task-actions {
  flex-wrap: wrap;
}

.task-action-disabled {
  display: inline-flex;
}
</style>
