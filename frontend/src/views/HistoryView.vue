<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NEmpty, NProgress, NStatistic, NTag } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useConversionStore } from '../stores/conversion'
import { formatFileSize } from '../utils/fileUtils'

const conversionStore = useConversionStore()
const { t } = useI18n()

const history = computed(() => conversionStore.history)

const summary = computed(() => {
  const totalBatches = history.value.length
  const totalFiles = history.value.reduce((sum, item) => sum + item.totalFiles, 0)
  const averageSuccess =
    totalBatches === 0
      ? 0
      : Math.round(
          history.value.reduce((sum, item) => sum + Math.round((item.successful / Math.max(item.totalFiles, 1)) * 100), 0) /
            totalBatches
        )
  return {
    totalBatches,
    totalFiles,
    averageSuccess
  }
})
</script>

<template>
  <div class="space-y-6">
    <NCard embedded :bordered="false" class="studio-panel page-shell">
      <div class="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div class="studio-label">{{ t('nav.history') }}</div>
          <h1 class="studio-display mt-3 text-4xl font-semibold">{{ t('history.pageTitle') }}</h1>
          <p class="mt-4 max-w-3xl text-sm leading-7 text-[var(--studio-muted)] md:text-base">
            {{ t('history.pageDescription') }}
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <NStatistic :label="t('history.summaryTotal')" :value="summary.totalBatches" />
          <NStatistic :label="t('history.summaryFiles')" :value="summary.totalFiles" />
          <NStatistic :label="t('history.summarySuccess')" :value="summary.averageSuccess">
            <template #suffix>%</template>
          </NStatistic>
        </div>
      </div>
    </NCard>

    <div v-if="history.length === 0">
      <NCard embedded :bordered="false" class="studio-panel page-shell">
        <NEmpty :description="t('history.emptyDescription')">
          <template #extra>
            {{ t('history.emptyTitle') }}
          </template>
        </NEmpty>
      </NCard>
    </div>

    <div v-else class="grid gap-4">
      <NCard
        v-for="item in history"
        :key="item.id"
        embedded
        :bordered="false"
        class="studio-panel history-card"
      >
        <div class="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div class="space-y-4">
            <div class="flex flex-wrap items-center gap-2">
              <NTag round :bordered="false">{{ new Date(item.timestamp).toLocaleString() }}</NTag>
              <NTag round type="success" :bordered="false">{{ item.options.outputFormat.toUpperCase() }}</NTag>
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
              <div class="history-metric">
                <div class="history-metric__label">{{ t('home.quickFacts.files') }}</div>
                <div class="history-metric__value">{{ item.totalFiles }}</div>
              </div>
              <div class="history-metric">
                <div class="history-metric__label">{{ t('common.completed') }}</div>
                <div class="history-metric__value">{{ item.successful }}</div>
              </div>
              <div class="history-metric">
                <div class="history-metric__label">{{ t('common.failed') }}</div>
                <div class="history-metric__value">{{ item.failed }}</div>
              </div>
            </div>

            <div class="text-sm text-[var(--studio-muted)]">
              {{ formatFileSize(item.totalSize) }} · {{ Math.round(item.conversionTime / 1000) }}s
            </div>
          </div>

          <div class="space-y-4">
            <NProgress
              type="line"
              :percentage="Math.round((item.successful / Math.max(item.totalFiles, 1)) * 100)"
              :show-indicator="false"
              :height="10"
              rail-color="color-mix(in srgb, var(--studio-muted) 18%, transparent)"
              color="var(--studio-accent)"
            />

            <div class="space-y-2">
              <div v-for="file in item.files.slice(0, 4)" :key="`${item.id}-${file.originalName}`" class="history-file">
                <div class="truncate">{{ file.originalName }}</div>
                <div class="flex items-center gap-2 text-xs text-[var(--studio-muted)]">
                  <span>{{ file.status }}</span>
                  <span>{{ formatFileSize(file.size) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </NCard>
    </div>
  </div>
</template>

<style scoped>
.page-shell,
.history-card {
  border-radius: 32px;
  padding: 24px;
}

.history-metric {
  border-radius: 22px;
  border: 1px solid var(--studio-line);
  padding: 16px;
}

.history-metric__label,
.history-file {
  font-size: 13px;
  color: var(--studio-muted);
}

.history-metric__value {
  margin-top: 8px;
  color: var(--studio-ink);
  font-size: 28px;
  font-weight: 800;
}
</style>
