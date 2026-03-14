<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NCard, NEmpty } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useConversionStore } from '../../stores/conversion'
import TaskItem from './TaskItem.vue'
import type { FileStatus, FileTask } from '../../types'

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

const groupedTasks = computed(() => {
  const groups: Record<'uploading' | 'processing' | 'pending' | 'completed' | 'failed' | 'cancelled', FileTask[]> = {
    uploading: [],
    processing: [],
    pending: [],
    completed: [],
    failed: [],
    cancelled: []
  }

  sortedTasks.value.forEach((task) => {
    groups[task.status].push(task)
  })

  return groups
})

const sections = computed(() => [
  { key: 'uploading', label: t('common.uploading'), tasks: groupedTasks.value.uploading },
  { key: 'processing', label: t('common.processing'), tasks: groupedTasks.value.processing },
  { key: 'pending', label: t('common.pending'), tasks: groupedTasks.value.pending },
  { key: 'completed', label: t('common.completed'), tasks: groupedTasks.value.completed },
  { key: 'failed', label: t('common.failed'), tasks: groupedTasks.value.failed },
  { key: 'cancelled', label: t('common.cancel'), tasks: groupedTasks.value.cancelled }
])
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

    <div v-else class="list-scroll">
      <section v-for="section in sections" v-show="section.tasks.length > 0" :key="section.key" class="list-section">
        <div class="section-header">
          <h3 class="section-title">{{ section.label }}</h3>
          <span class="section-count">{{ section.tasks.length }}</span>
        </div>

        <div class="task-grid">
          <TaskItem
            v-for="task in section.tasks"
            :key="task.id"
            :task="task"
          />
        </div>
      </section>
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

.list-scroll {
  margin-top: 20px;
  max-height: calc(6 * 190px + 5 * 18px);
  overflow-y: auto;
  padding-right: 6px;
}

.list-section + .list-section {
  margin-top: 22px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.section-title,
.section-count {
  white-space: nowrap;
  color: var(--studio-muted);
}

.section-title {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.section-count {
  font-size: 12px;
}

.task-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(156px, 1fr));
  gap: 14px;
}

@media (max-width: 768px) {
  .list-shell {
    padding: 18px;
  }

  .task-grid {
    grid-template-columns: repeat(auto-fill, minmax(142px, 1fr));
  }

  .list-scroll {
    max-height: none;
    overflow: visible;
    padding-right: 0;
  }
}
</style>
