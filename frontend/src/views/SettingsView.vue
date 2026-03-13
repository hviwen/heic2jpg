<script setup lang="ts">
import { computed, ref } from 'vue'
import { NButton, NCard, NForm, NFormItem, NSelect, NSlider, NSpace, NSwitch } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useConversionStore } from '../stores/conversion'
import { usePreferencesStore } from '../stores/preferences'
import { useThemeStore } from '../stores/theme'
import type { AppLocale } from '../i18n/messages'

const { t } = useI18n()
const conversionStore = useConversionStore()
const preferencesStore = usePreferencesStore()
const themeStore = useThemeStore()

const themeOptions = computed(() => [
  { label: t('common.light'), value: 'light' },
  { label: t('common.dark'), value: 'dark' },
  { label: t('common.auto'), value: 'auto' }
])

const languageOptions = computed(() => [
  { label: t('common.chinese'), value: 'zh-CN' },
  { label: t('common.english'), value: 'en-US' }
])

const formatOptions = [
  { label: 'JPEG', value: 'jpeg' },
  { label: 'PNG', value: 'png' },
  { label: 'WebP', value: 'webp' }
]

const modeOptions = computed(() => [
  { label: t('home.modes.auto'), value: 'auto' },
  { label: t('home.modes.browser'), value: 'browser' },
  { label: t('home.modes.server'), value: 'server' }
])

const notificationPlaceholder = ref(false)
</script>

<template>
  <div class="space-y-6">
    <NCard embedded :bordered="false" class="studio-panel settings-page">
      <div class="studio-label">{{ t('nav.settings') }}</div>
      <h1 class="studio-display mt-3 text-4xl font-semibold">{{ t('settings.pageTitle') }}</h1>
      <p class="mt-4 max-w-3xl text-sm leading-7 text-[var(--studio-muted)] md:text-base">
        {{ t('settings.pageDescription') }}
      </p>
    </NCard>

    <div class="grid gap-6 lg:grid-cols-2">
      <NCard embedded :bordered="false" class="studio-panel settings-page">
        <div class="studio-label">{{ t('common.theme') }}</div>
        <NForm label-placement="top" class="mt-4">
          <NFormItem :label="t('common.theme')">
            <NSelect :value="themeStore.theme" :options="themeOptions" @update:value="themeStore.setTheme" />
          </NFormItem>
          <NFormItem :label="t('common.language')">
            <NSelect
              :value="preferencesStore.language"
              :options="languageOptions"
              @update:value="(value) => preferencesStore.setLanguage(value as AppLocale)"
            />
          </NFormItem>
        </NForm>
      </NCard>

      <NCard embedded :bordered="false" class="studio-panel settings-page">
        <div class="studio-label">{{ t('settings.behavior') }}</div>
        <p class="mt-3 text-sm leading-7 text-[var(--studio-muted)]">{{ t('settings.behaviorHint') }}</p>

        <NForm label-placement="top" class="mt-4">
          <NFormItem :label="t('settings.formatTitle')">
            <NSelect
              :value="conversionStore.options.outputFormat"
              :options="formatOptions"
              @update:value="(value) => conversionStore.updateOptions({ outputFormat: value })"
            />
          </NFormItem>
          <NFormItem :label="t('settings.modeTitle')">
            <NSelect
              :value="conversionStore.options.conversionMode"
              :options="modeOptions"
              @update:value="(value) => conversionStore.updateOptions({ conversionMode: value })"
            />
          </NFormItem>
          <NFormItem :label="t('settings.qualityTitle')">
            <NSlider
              :value="conversionStore.options.quality"
              :step="1"
              :min="1"
              :max="100"
              @update:value="(value) => conversionStore.updateOptions({ quality: Number(value) })"
            />
          </NFormItem>
          <NFormItem :label="t('settings.metadata')">
            <NSwitch
              :value="conversionStore.options.keepMetadata"
              @update:value="(value) => conversionStore.updateOptions({ keepMetadata: value })"
            />
          </NFormItem>
        </NForm>
      </NCard>
    </div>

    <NCard embedded :bordered="false" class="studio-panel settings-page">
      <div class="flex items-start justify-between gap-4">
        <div>
          <div class="studio-label">{{ t('settings.notifications') }}</div>
          <p class="mt-3 text-sm leading-7 text-[var(--studio-muted)]">{{ t('settings.notificationsHint') }}</p>
        </div>
        <NSwitch v-model:value="notificationPlaceholder" />
      </div>

      <NSpace class="mt-5">
        <NButton type="primary" @click="conversionStore.loadFromStorage()">{{ t('common.save') }}</NButton>
        <NButton quaternary @click="themeStore.setTheme('auto')">{{ t('common.reset') }}</NButton>
      </NSpace>
    </NCard>
  </div>
</template>

<style scoped>
.settings-page {
  border-radius: 32px;
  padding: 24px;
}
</style>
