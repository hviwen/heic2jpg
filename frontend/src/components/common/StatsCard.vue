<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NProgress } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useConversionStore } from '../../stores/conversion'
import { formatFileSize } from '../../utils/fileUtils'

const conversionStore = useConversionStore()
const { t } = useI18n()

const metricRows = computed(() => [
  { label: t('home.quickFacts.files'), value: conversionStore.totalFiles },
  { label: t('common.completed'), value: conversionStore.completedFiles },
  { label: t('common.failed'), value: conversionStore.failedFiles },
  { label: t('home.quickFacts.progress'), value: `${conversionStore.totalProgress}%` }
])
</script>

<template>
  <NCard embedded :bordered="false" class="studio-panel stats-card">
    <div class="stats-header">
      <div>
        <div class="studio-label">{{ t('home.statsTitle') }}</div>
        <h2 class="stats-title">{{ t('home.dashboardTitle') }}</h2>
      </div>
      <div class="stats-total">
        <div class="stats-total__value">{{ formatFileSize(conversionStore.totalOriginalSize) }}</div>
        <div class="stats-total__label">{{ t('common.original') }}</div>
      </div>
    </div>

    <div class="stats-grid">
      <div v-for="metric in metricRows" :key="metric.label" class="stats-metric">
        <div class="stats-metric__label">{{ metric.label }}</div>
        <div class="stats-metric__value">{{ metric.value }}</div>
      </div>
    </div>

    <div class="stats-foot">
      <div class="stats-foot__row">
        <span>{{ t('common.savedSpace') }}</span>
        <strong>
          {{
            conversionStore.totalConvertedSize > 0
              ? formatFileSize(Math.max(conversionStore.totalOriginalSize - conversionStore.totalConvertedSize, 0))
              : '--'
          }}
        </strong>
      </div>
      <div class="stats-foot__row">
        <span>{{ t('common.converted') }}</span>
        <strong>{{ formatFileSize(conversionStore.totalConvertedSize) }}</strong>
      </div>
      <NProgress
        class="stats-progress"
        type="line"
        :percentage="conversionStore.totalProgress"
        :show-indicator="false"
        :height="10"
        border-radius="999px"
        rail-color="color-mix(in srgb, var(--studio-muted) 20%, transparent)"
        color="var(--studio-accent)"
      />
    </div>
  </NCard>
</template>

<style scoped>
.stats-card {
  border-radius: 32px;
  padding: 22px;
}

.stats-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.stats-title {
  margin: 10px 0 0;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.stats-total {
  min-width: 0;
  text-align: right;
}

.stats-total__value {
  white-space: nowrap;
  font-size: 20px;
  font-weight: 800;
}

.stats-total__label {
  margin-top: 6px;
  color: var(--studio-muted);
  font-size: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.stats-metric {
  min-width: 0;
  border-radius: 20px;
  border: 1px solid var(--studio-line);
  padding: 14px;
}

.stats-metric__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--studio-muted);
  font-size: 12px;
}

.stats-metric__value {
  margin-top: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.stats-foot {
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

.stats-foot__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--studio-muted);
  font-size: 13px;
}

.stats-foot__row strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--studio-ink);
}

.stats-progress {
  margin-top: 4px;
}
</style>
