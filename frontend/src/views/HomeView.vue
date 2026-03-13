<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NAlert, NButton, NCard, NProgress, NTag } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import FileUpload from '../components/upload/FileUpload.vue'
import ConversionSettings from '../components/processing/ConversionSettings.vue'
import TaskList from '../components/processing/TaskList.vue'
import StatsCard from '../components/common/StatsCard.vue'
import { useConversionStore } from '../stores/conversion'
import { formatFileSize } from '../utils/fileUtils'

const conversionStore = useConversionStore()
const route = useRoute()
const router = useRouter()
const { t, tm } = useI18n()

const authStatus = computed(() => route.query['auth'])
const authErrorReason = computed(() => route.query['reason'])

const currentModeLabel = computed(() => {
  if (conversionStore.options.conversionMode === 'browser') return t('home.modes.browser')
  if (conversionStore.options.conversionMode === 'server') return t('home.modes.server')
  return t('home.modes.auto')
})

const historyPreview = computed(() => conversionStore.history.slice(0, 3))
const rails = computed(() => tm('home.rails') as string[])

const quickFacts = computed(() => [
  { label: t('home.quickFacts.files'), value: conversionStore.totalFiles || '00' },
  { label: t('home.quickFacts.progress'), value: `${conversionStore.totalProgress}%` },
  { label: t('home.quickFacts.mode'), value: currentModeLabel.value },
  { label: t('home.quickFacts.history'), value: conversionStore.history.length }
])

const handleFilesSelected = (files: File[]) => {
  conversionStore.addFiles(files)
}
</script>

<template>
  <div class="space-y-6 pb-6">
    <NAlert v-if="authStatus === 'success'" type="success" :bordered="false">
      {{ t('auth.signedIn') }}
    </NAlert>
    <NAlert v-else-if="authStatus === 'error'" type="error" :bordered="false">
      {{ t('auth.failed') }}
      <span v-if="authErrorReason"> {{ t('auth.reason') }}: {{ authErrorReason }}</span>
    </NAlert>

    <section class="hero-grid">
      <NCard embedded :bordered="false" class="studio-panel hero-primary">
        <div class="space-y-6">
          <div class="studio-kicker">
            <span class="inline-block h-2 w-2 rounded-full bg-[var(--studio-warm)]"></span>
            {{ t('home.eyebrow') }}
          </div>

          <div class="space-y-4">
            <h1 class="studio-display max-w-4xl text-5xl font-semibold leading-[0.95] text-balance md:text-6xl">
              {{ t('home.title') }}
            </h1>
            <p class="max-w-3xl text-base leading-8 text-[var(--studio-muted)] md:text-lg">
              {{ t('home.description') }}
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <NButton type="primary" size="large" strong @click="conversionStore.startConversion()">
              {{ t('home.primaryAction') }}
            </NButton>
            <NButton size="large" secondary @click="router.push('/about')">
              {{ t('home.secondaryAction') }}
            </NButton>
          </div>

          <div class="grid gap-3 md:grid-cols-4">
            <div v-for="fact in quickFacts" :key="fact.label" class="fact-card">
              <div class="fact-card__label">{{ fact.label }}</div>
              <div class="fact-card__value">{{ fact.value }}</div>
            </div>
          </div>
        </div>
      </NCard>

      <div class="space-y-6">
        <StatsCard />

        <NCard embedded :bordered="false" class="studio-panel hero-aside">
          <div class="studio-label">{{ t('home.railsTitle') }}</div>
          <ul class="mt-4 space-y-3">
            <li v-for="rail in rails" :key="rail" class="aside-item">
              {{ rail }}
            </li>
          </ul>
        </NCard>
      </div>
    </section>

    <section class="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
      <div class="space-y-6">
        <NCard embedded :bordered="false" class="studio-panel feature-card">
          <div class="mb-6 flex items-start justify-between gap-4">
            <div>
              <div class="studio-label">{{ t('home.uploadTitle') }}</div>
              <p class="mt-2 text-sm leading-7 text-[var(--studio-muted)]">{{ t('home.uploadSubtitle') }}</p>
            </div>
            <NTag round :bordered="false">{{ formatFileSize(conversionStore.totalOriginalSize) }}</NTag>
          </div>

          <FileUpload
            :accept="['.heic', '.heif', '.HEIC', '.HEIF']"
            :max-size="100 * 1024 * 1024"
            :max-files="50"
            :allow-multiple="true"
            :allow-folder="true"
            @files-selected="handleFilesSelected"
          />
        </NCard>

        <TaskList />
      </div>

      <div class="space-y-6">
        <NCard embedded :bordered="false" class="studio-panel feature-card">
          <div class="mb-5">
            <div class="studio-label">{{ t('home.settingsTitle') }}</div>
            <p class="mt-2 text-sm leading-7 text-[var(--studio-muted)]">{{ t('home.settingsSubtitle') }}</p>
          </div>
          <ConversionSettings />
        </NCard>

        <NCard embedded :bordered="false" class="studio-panel feature-card">
          <div class="flex items-center justify-between gap-3">
            <div>
              <div class="studio-label">{{ t('home.historyTitle') }}</div>
              <p class="mt-2 text-sm leading-7 text-[var(--studio-muted)]">{{ t('home.historySubtitle') }}</p>
            </div>
            <NButton text type="primary" @click="router.push('/history')">{{ t('nav.history') }}</NButton>
          </div>

          <div v-if="historyPreview.length === 0" class="rounded-[24px] border border-dashed border-[var(--studio-line)] px-5 py-8 text-sm text-[var(--studio-muted)]">
            {{ t('home.noHistory') }}
          </div>
          <div v-else class="mt-4 space-y-3">
            <div v-for="item in historyPreview" :key="item.id" class="history-row">
              <div>
                <div class="text-sm font-semibold">{{ new Date(item.timestamp).toLocaleString() }}</div>
                <div class="text-xs text-[var(--studio-muted)]">
                  {{ item.totalFiles }} files · {{ item.successful }}/{{ item.totalFiles }}
                </div>
              </div>
              <div class="min-w-[120px] text-right">
                <div class="text-sm font-semibold">{{ item.options.outputFormat.toUpperCase() }}</div>
                <div class="text-xs text-[var(--studio-muted)]">{{ formatFileSize(item.totalSize) }}</div>
              </div>
            </div>
          </div>
        </NCard>

        <NCard embedded :bordered="false" class="studio-panel feature-card">
          <div class="studio-label">{{ t('home.supportTitle') }}</div>
          <p class="mt-2 text-sm leading-7 text-[var(--studio-muted)]">{{ t('home.supportDescription') }}</p>
          <div class="mt-5 flex flex-wrap gap-3">
            <NButton secondary @click="router.push('/about')">{{ t('home.supportHelp') }}</NButton>
            <NButton tag="a" href="https://github.com/sponsors" target="_blank">
              {{ t('home.supportSponsor') }}
            </NButton>
          </div>
        </NCard>
      </div>
    </section>

    <section class="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <NCard embedded :bordered="false" class="studio-panel feature-card">
        <div class="flex items-center justify-between gap-4">
          <div>
            <div class="studio-label">{{ t('home.quickFacts.progress') }}</div>
            <div class="mt-3 text-2xl font-extrabold tracking-tight">
              {{ conversionStore.completedFiles }} / {{ conversionStore.totalFiles || 0 }}
            </div>
          </div>
          <NTag round :bordered="false">{{ currentModeLabel }}</NTag>
        </div>

        <div class="mt-5">
          <NProgress
            type="line"
            :percentage="conversionStore.totalProgress"
            :show-indicator="false"
            :height="12"
            rail-color="color-mix(in srgb, var(--studio-muted) 18%, transparent)"
            color="var(--studio-accent)"
          />
        </div>

        <p class="mt-4 text-sm leading-7 text-[var(--studio-muted)]">
          {{ t('home.privacy') }}
        </p>
      </NCard>

      <NCard embedded :bordered="false" class="studio-panel feature-card studio-dot-grid">
        <div class="studio-label">{{ t('home.railsTitle') }}</div>
        <div class="mt-3 space-y-3 text-sm leading-7 text-[var(--studio-muted)]">
          <p>{{ t('home.privacy') }}</p>
          <p>{{ t('home.shellNote') }}</p>
        </div>
      </NCard>
    </section>
  </div>
</template>

<style scoped>
.hero-grid {
  display: grid;
  gap: 24px;
  align-items: start;
}

.hero-primary,
.hero-aside,
.feature-card {
  border-radius: 34px;
}

.hero-primary {
  padding: 26px;
}

.hero-aside,
.feature-card {
  padding: 24px;
}

.fact-card {
  border-radius: 24px;
  border: 1px solid var(--studio-line);
  background: color-mix(in srgb, var(--studio-card) 72%, transparent);
  padding: 16px 18px;
}

.fact-card__label {
  font-size: 12px;
  color: var(--studio-muted);
}

.fact-card__value {
  margin-top: 8px;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.05em;
}

.aside-item {
  position: relative;
  padding-left: 18px;
  font-size: 14px;
  line-height: 1.9;
  color: var(--studio-muted);
}

.aside-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 11px;
  height: 6px;
  width: 6px;
  border-radius: 999px;
  background: var(--studio-accent);
}

.history-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  border: 1px solid var(--studio-line);
  border-radius: 22px;
  padding: 16px;
}

@media (min-width: 1200px) {
  .hero-grid {
    grid-template-columns: 1.35fr 0.9fr;
  }
}

@media (max-width: 768px) {
  .hero-primary,
  .hero-aside,
  .feature-card {
    border-radius: 28px;
    padding: 18px;
  }

  .fact-card__value {
    font-size: 22px;
  }
}
</style>
