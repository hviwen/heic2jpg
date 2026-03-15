<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NCard, NEmpty } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useConversionStore } from '../../stores/conversion'
import TaskItem from './TaskItem.vue'
import type { FileStatus } from '../../types'

const conversionStore = useConversionStore()
const { t } = useI18n()

const sortedTasks = computed(() => {
  const order: Record<FileStatus, number> = {
    uploading: 0,
    processing: 1,
    pending: 2,
    completed: 3,
    failed: 4,
    cancelled: 5
  }

  return [...conversionStore.tasks].sort((a, b) => order[a.status] - order[b.status])
})

const statusSummary = computed(() =>
  [
    { key: 'uploading', label: t('common.uploading'), count: conversionStore.tasks.filter((task) => task.status === 'uploading').length },
    { key: 'processing', label: t('common.processing'), count: conversionStore.tasks.filter((task) => task.status === 'processing').length },
    { key: 'pending', label: t('common.pending'), count: conversionStore.tasks.filter((task) => task.status === 'pending').length },
    { key: 'completed', label: t('common.completed'), count: conversionStore.tasks.filter((task) => task.status === 'completed').length },
    { key: 'failed', label: t('common.failed'), count: conversionStore.tasks.filter((task) => task.status === 'failed').length },
    { key: 'cancelled', label: t('common.cancel'), count: conversionStore.tasks.filter((task) => task.status === 'cancelled').length }
  ].filter((item) => item.count > 0)
)
</script>

<template>
  <NCard embedded :bordered="false" class="studio-panel list-shell">
    <div class="list-header">
      <div class="min-w-0">
        <div class="studio-label">{{ t('home.queueTitle') }}</div>
        <div class="list-subtitle">{{ t('home.queueSubtitle') }}</div>
      </div>

      <div class="list-actions">
        <NButton
          v-if="conversionStore.failedFiles > 0"
          secondary
          type="warning"
          @click="conversionStore.retryFailedTasks()"
        >
          {{ t('common.retry') }} {{ conversionStore.failedFiles }}
        </NButton>
        <NButton
          v-if="conversionStore.completedFiles > 0"
          secondary
          @click="conversionStore.downloadAllCompleted()"
        >
          {{ t('common.download') }}
        </NButton>
        <NButton
          v-if="conversionStore.completedFiles > 0"
          quaternary
          @click="conversionStore.clearCompletedFiles()"
        >
          {{ t('common.remove') }} {{ conversionStore.completedFiles }}
        </NButton>
      </div>
    </div>

    <div v-if="conversionStore.totalFiles === 0" class="list-empty">
      <NEmpty :description="t('home.emptyWorkspace')" />
    </div>

    <div v-else>
      <div v-if="statusSummary.length > 0" class="status-row">
        <div v-for="item in statusSummary" :key="item.key" class="status-chip">
          <span class="status-chip__label">{{ item.label }}</span>
          <span class="status-chip__count">{{ item.count }}</span>
        </div>
      </div>

      <div class="list-scroll">
        <div class="task-grid">
          <TaskItem
            v-for="task in sortedTasks"
            :key="task.id"
            :task="task"
          />
        </div>
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.list-shell {
  border-radius: 32px;
  padding: 22px;
}

.list-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.list-subtitle {
  margin-top: 10px;
  color: var(--studio-muted);
  font-size: 14px;
  line-height: 1.7;
}

.list-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.list-empty {
  padding: 48px 0 28px;
}

.status-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--studio-card) 86%, transparent);
  border: 1px solid color-mix(in srgb, var(--studio-line) 92%, transparent);
}

.status-chip__label {
  color: var(--studio-muted);
  font-size: 12px;
  font-weight: 700;
}

.status-chip__count {
  font-size: 12px;
  font-weight: 800;
}

.list-scroll {
  margin-top: 18px;
  max-height: calc(3 * 272px + 2 * 14px);
  overflow-y: auto;
  padding-right: 6px;
}

.task-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}

@media (max-width: 1280px) {
  .task-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 1080px) {
  .task-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .list-shell {
    padding: 18px;
  }

  .task-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .list-scroll {
    max-height: none;
    overflow: visible;
    padding-right: 0;
  }
}
</style>
