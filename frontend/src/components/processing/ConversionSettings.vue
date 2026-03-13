<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  NButton,
  NCard,
  NCollapseTransition,
  NFormItem,
  NInputNumber,
  NRadioButton,
  NRadioGroup,
  NSlider,
  NSpace,
  NSwitch
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useConversionStore } from '../../stores/conversion'
import type { ConversionMode, ConversionOptions, OutputFormat } from '../../types'

const conversionStore = useConversionStore()
const { t } = useI18n()

const localOptions = ref<ConversionOptions>({ ...conversionStore.options })
const showAdvanced = ref(false)

const modeOptions = computed(() => [
  { value: 'auto', label: t('home.modes.auto'), description: 'auto' },
  { value: 'browser', label: t('home.modes.browser'), description: 'browser' },
  { value: 'server', label: t('home.modes.server'), description: 'server' }
])

const formatOptions = [
  { value: 'jpeg', label: 'JPEG' },
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WebP' }
] as const

const qualityStops = {
  60: '60',
  80: '80',
  90: '90',
  95: '95'
}

function updateOptions(updates: Partial<ConversionOptions>) {
  localOptions.value = { ...localOptions.value, ...updates }
  conversionStore.updateOptions(localOptions.value)
}

function resetToDefaults() {
  const defaults: ConversionOptions = {
    quality: 90,
    keepMetadata: true,
    outputFormat: 'jpeg',
    conversionMode: 'auto',
    maxWidth: undefined,
    maxHeight: undefined
  }
  localOptions.value = defaults
  conversionStore.updateOptions(defaults)
}

watch(
  () => conversionStore.options,
  (newOptions) => {
    localOptions.value = { ...newOptions }
  },
  { immediate: true, deep: true }
)
</script>

<template>
  <div class="space-y-5">
    <NCard embedded :bordered="false" class="studio-panel settings-card">
      <NSpace vertical :size="20">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="studio-label">{{ t('settings.modeTitle') }}</div>
            <p class="mt-2 text-sm leading-7 text-[var(--studio-muted)]">
              {{ t('home.settingsSubtitle') }}
            </p>
          </div>
          <NButton quaternary size="small" @click="resetToDefaults">{{ t('common.reset') }}</NButton>
        </div>

        <NRadioGroup
          :value="localOptions.conversionMode"
          @update:value="(value) => updateOptions({ conversionMode: value as ConversionMode })"
        >
          <div class="grid gap-3 md:grid-cols-3">
            <NRadioButton
              v-for="option in modeOptions"
              :key="option.value"
              :value="option.value"
              class="settings-pill"
            >
              {{ option.label }}
            </NRadioButton>
          </div>
        </NRadioGroup>
      </NSpace>
    </NCard>

    <NCard embedded :bordered="false" class="studio-panel settings-card">
      <NSpace vertical :size="18">
        <div class="studio-label">{{ t('settings.formatTitle') }}</div>
        <NRadioGroup
          :value="localOptions.outputFormat"
          @update:value="(value) => updateOptions({ outputFormat: value as OutputFormat })"
        >
          <div class="grid gap-3 md:grid-cols-3">
            <NRadioButton
              v-for="option in formatOptions"
              :key="option.value"
              :value="option.value"
              class="settings-pill"
            >
              {{ option.label }}
            </NRadioButton>
          </div>
        </NRadioGroup>

        <NFormItem :label="t('settings.qualityTitle')">
          <div class="w-full space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-[var(--studio-muted)]">{{ t('settings.qualityDescription') }}</span>
              <strong>{{ localOptions.quality }}%</strong>
            </div>
            <NSlider
              :value="localOptions.quality"
              :step="1"
              :min="1"
              :max="100"
              :marks="qualityStops"
              @update:value="(value) => updateOptions({ quality: Number(value) })"
            />
          </div>
        </NFormItem>
      </NSpace>
    </NCard>

    <NCard embedded :bordered="false" class="studio-panel settings-card">
      <div class="flex items-center justify-between gap-3">
        <div>
          <div class="studio-label">{{ t('settings.advanced') }}</div>
          <p class="mt-2 text-sm text-[var(--studio-muted)]">{{ t('settings.dimensionsHint') }}</p>
        </div>
        <NButton quaternary size="small" @click="showAdvanced = !showAdvanced">
          {{ t('settings.advanced') }}
        </NButton>
      </div>

      <NCollapseTransition :show="showAdvanced">
        <div class="mt-5 space-y-5">
          <NFormItem :label="t('settings.metadata')">
            <div class="flex w-full items-center justify-between gap-4">
              <span class="text-sm text-[var(--studio-muted)]">{{ t('settings.metadataHint') }}</span>
              <NSwitch
                :value="localOptions.keepMetadata"
                @update:value="(value) => updateOptions({ keepMetadata: value })"
              />
            </div>
          </NFormItem>

          <div class="grid gap-4 md:grid-cols-2">
            <NFormItem :label="`${t('settings.width')} (${t('common.optional')})`">
              <NInputNumber
                clearable
                :min="1"
                :max="10000"
                :value="localOptions.maxWidth ?? null"
                @update:value="(value) => updateOptions({ maxWidth: value ?? undefined })"
              />
            </NFormItem>
            <NFormItem :label="`${t('settings.height')} (${t('common.optional')})`">
              <NInputNumber
                clearable
                :min="1"
                :max="10000"
                :value="localOptions.maxHeight ?? null"
                @update:value="(value) => updateOptions({ maxHeight: value ?? undefined })"
              />
            </NFormItem>
          </div>
        </div>
      </NCollapseTransition>
    </NCard>
  </div>
</template>

<style scoped>
.settings-card {
  border-radius: 28px;
}

:deep(.settings-pill .n-radio-button__state-border),
:deep(.settings-pill .n-radio-button__state-border-disabled) {
  border-radius: 18px;
}

:deep(.settings-pill .n-radio-button__state-border) {
  border-color: var(--studio-line);
}

:deep(.settings-pill .n-radio__label) {
  font-weight: 700;
}

:deep(.settings-pill.n-radio-button--checked) {
  background: color-mix(in srgb, var(--studio-accent) 14%, transparent);
}
</style>
