<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NCard, NEmpty, NSpace } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useConversionStore } from '../../stores/conversion'
import TaskItem from './TaskItem.vue'
import type { FileStatus, FileTask } from '../../types'

const conversionStore = useConversionStore()
const { t } = useI18n()

const sortedTasks = computed(() => {
  const order: Record<FileStatus, number> = {
    processing: 0,
    uploading: 1,
    pending: 2,
    completed: 3,
    failed: 4,
    cancelled: 5
  }

  return [...conversionStore.tasks].sort((a, b) => order[a.status] - order[b.status])
})

const groupedTasks = computed(() => {
  const groups: Record<'processing' | 'uploading' | 'pending' | 'completed' | 'failed' | 'cancelled', FileTask[]> = {
    processing: [],
    uploading: [],
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
  { key: 'processing', label: t('common.processing'), tasks: groupedTasks.value.processing },
  { key: 'pending', label: t('common.pending'), tasks: groupedTasks.value.pending },
  { key: 'completed', label: t('common.completed'), tasks: groupedTasks.value.completed },
  { key: 'failed', label: t('common.failed'), tasks: groupedTasks.value.failed },
  { key: 'cancelled', label: t('common.cancel'), tasks: groupedTasks.value.cancelled }
])

const handleCancelTask = (taskId: string) => {
  const task = conversionStore.tasks.find((item) => item.id === taskId)
  if (task && (task.status === 'pending' || task.status === 'processing')) {
    task.status = 'cancelled'
    task.progress = 0
  }
}

const handleRetryTask = (taskId: string) => {
  const task = conversionStore.tasks.find((item) => item.id === taskId)
  if (task && (task.status === 'failed' || task.status === 'cancelled')) {
    task.status = 'pending'
    task.progress = 0
    task.error = undefined
  }
}

const handleRemoveTask = (taskId: string) => {
  conversionStore.removeFile(taskId)
}

const clearCompleted = () => {
  conversionStore.tasks
    .filter((task) => task.status === 'completed')
    .forEach((task) => conversionStore.removeFile(task.id))
}
</script>

<template>
  <NCard embedded :bordered="false" class="studio-panel list-shell">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <div class="studio-label">{{ t('home.queueTitle') }}</div>
        <div class="mt-2 text-sm leading-7 text-[var(--studio-muted)]">{{ t('home.queueSubtitle') }}</div>
      </div>

      <NSpace>
        <NButton
          v-if="conversionStore.failedFiles > 0"
          secondary
          type="warning"
          @click="conversionStore.retryFailedTasks()"
        >
          {{ t('common.retry') }} {{ conversionStore.failedFiles }}
        </NButton>
        <NButton v-if="conversionStore.completedFiles > 0" quaternary @click="clearCompleted">
          {{ t('common.remove') }} {{ conversionStore.completedFiles }}
        </NButton>
        <NButton v-if="conversionStore.completedFiles > 0" type="primary" @click="conversionStore.downloadAllCompleted()">
          {{ t('common.download') }}
        </NButton>
      </NSpace>
    </div>

    <div v-if="conversionStore.totalFiles === 0" class="py-10">
      <NEmpty :description="t('home.noHistory')" />
    </div>

    <div v-else class="space-y-5">
      <section v-for="section in sections" :key="section.key" v-show="section.tasks.length > 0" class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--studio-muted)]">
            {{ section.label }}
          </h3>
          <span class="text-xs text-[var(--studio-muted)]">{{ section.tasks.length }}</span>
        </div>

        <TaskItem
          v-for="task in section.tasks"
          :key="task.id"
          :task="task"
          @cancel="handleCancelTask"
          @retry="handleRetryTask"
          @remove="handleRemoveTask"
        />
      </section>
    </div>
  </NCard>
</template>

<style scoped>
.list-shell {
  border-radius: 28px;
}
</style>
