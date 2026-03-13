<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NProgress, NStatistic } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useConversionStore } from '../../stores/conversion'
import { formatFileSize } from '../../utils/fileUtils'

const conversionStore = useConversionStore()
const { t } = useI18n()

const compressionRatio = computed(() => {
  if (conversionStore.totalConvertedSize === 0 || conversionStore.totalOriginalSize === 0) {
    return 0
  }

  const ratio = (1 - conversionStore.totalConvertedSize / conversionStore.totalOriginalSize) * 100
  return Math.max(0, Math.round(ratio * 10) / 10)
})

const successRate = computed(() => {
  if (conversionStore.totalFiles === 0) {
    return 100
  }

  return Math.round((conversionStore.completedFiles / conversionStore.totalFiles) * 100)
})

const metrics = computed(() => [
  {
    label: t('home.quickFacts.files'),
    value: conversionStore.totalFiles
  },
  {
    label: t('home.quickFacts.progress'),
    value: `${conversionStore.totalProgress}%`
  },
  {
    label: t('common.savedSpace'),
    value:
      conversionStore.totalConvertedSize > 0
        ? formatFileSize(Math.max(conversionStore.totalOriginalSize - conversionStore.totalConvertedSize, 0))
        : '--'
  },
  {
    label: t('history.summarySuccess'),
    value: `${successRate.value}%`
  }
])
</script>

<template>
  <NCard embedded :bordered="false" class="studio-panel stats-card">
    <div class="mb-5 flex items-center justify-between">
      <div>
        <div class="studio-label">{{ t('home.statsTitle') }}</div>
        <h3 class="mt-2 text-xl font-bold">{{ t('home.queueSubtitle') }}</h3>
      </div>
      <div class="text-right text-sm text-[var(--studio-muted)]">
        <div>{{ formatFileSize(conversionStore.totalOriginalSize) }}</div>
        <div>→ {{ formatFileSize(conversionStore.totalConvertedSize) }}</div>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <div v-for="metric in metrics" :key="metric.label" class="metric-tile">
        <div class="metric-tile__label">{{ metric.label }}</div>
        <div class="metric-tile__value">{{ metric.value }}</div>
      </div>
    </div>

    <div class="mt-6 grid gap-4 md:grid-cols-2">
      <NStatistic :label="t('home.quickFacts.progress')" :value="conversionStore.totalProgress">
        <template #suffix>%</template>
      </NStatistic>
      <NStatistic :label="t('common.compression')" :value="compressionRatio">
        <template #suffix>%</template>
      </NStatistic>
    </div>

    <div class="mt-5">
      <NProgress
        type="line"
        :percentage="conversionStore.totalProgress"
        :show-indicator="false"
        :height="10"
        border-radius="999px"
        rail-color="color-mix(in srgb, var(--studio-muted) 20%, transparent)"
        color="var(--studio-accent)"
      />
      <div class="mt-2 flex justify-between text-xs text-[var(--studio-muted)]">
        <span>{{ conversionStore.completedFiles }} {{ t('common.completed') }}</span>
        <span>{{ conversionStore.failedFiles }} {{ t('common.failed') }}</span>
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.stats-card {
  border-radius: 28px;
}

.metric-tile {
  border-radius: 22px;
  border: 1px solid var(--studio-line);
  background: color-mix(in srgb, var(--studio-card) 70%, transparent);
  padding: 18px;
}

.metric-tile__label {
  font-size: 12px;
  color: var(--studio-muted);
}

.metric-tile__value {
  margin-top: 8px;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.04em;
}
</style>
