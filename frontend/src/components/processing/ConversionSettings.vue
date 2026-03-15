<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  NButton,
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
  { value: 'auto', label: t('home.modes.auto') },
  { value: 'browser', label: t('home.modes.browser') },
  { value: 'server', label: t('home.modes.server') }
])

const formatOptions = [
  { value: 'jpeg', label: 'JPG' },
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WebP' }
] as const

const qualityStops = {
  52: '52',
  68: '68',
  82: '82',
  90: '90'
}

function updateOptions(updates: Partial<ConversionOptions>) {
  localOptions.value = { ...localOptions.value, ...updates }
  conversionStore.updateOptions(localOptions.value)
}

function resetToDefaults() {
  const defaults: ConversionOptions = {
    quality: 82,
    keepMetadata: false,
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
  <div class="settings-shell">
    <div class="settings-block">
      <div class="settings-head">
        <div>
          <div class="settings-label">{{ t('settings.modeTitle') }}</div>
          <p class="settings-hint">{{ t('settings.modeHint') }}</p>
        </div>
        <NButton quaternary size="small" @click="resetToDefaults">{{ t('common.reset') }}</NButton>
      </div>

      <NRadioGroup
        :value="localOptions.conversionMode"
        @update:value="(value) => updateOptions({ conversionMode: value as ConversionMode })"
      >
        <div class="settings-grid">
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
    </div>

    <div class="settings-block">
      <div class="settings-head">
        <div>
          <div class="settings-label">{{ t('settings.formatTitle') }}</div>
          <p class="settings-hint">{{ t('settings.qualityDescription') }}</p>
        </div>
      </div>

      <NSpace vertical :size="16">
        <NRadioGroup
          :value="localOptions.outputFormat"
          @update:value="(value) => updateOptions({ outputFormat: value as OutputFormat })"
          class="w-full"
        >
          <div class="settings-grid">
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
            <div class="settings-inline">
              <span class="settings-hint settings-hint--inline">{{ t('settings.qualityDescription') }}</span>
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
    </div>

    <div class="settings-block">
      <div class="settings-head">
        <div>
          <div class="settings-label">{{ t('settings.advanced') }}</div>
          <p class="settings-hint">{{ t('settings.dimensionsHint') }}</p>
        </div>
        <NButton quaternary size="small" @click="showAdvanced = !showAdvanced">
          {{ t('settings.advanced') }}
        </NButton>
      </div>

      <NCollapseTransition :show="showAdvanced">
        <div class="settings-advanced">
          <NFormItem :label="t('settings.metadata')">
            <div class="settings-inline">
              <span class="settings-hint settings-hint--inline">{{ t('settings.metadataHint') }}</span>
              <NSwitch
                :value="localOptions.keepMetadata"
                @update:value="(value) => updateOptions({ keepMetadata: value })"
              />
            </div>
          </NFormItem>

          <div class="settings-grid settings-grid--dimensions">
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
    </div>
  </div>
</template>

<style scoped>
.settings-shell {
  display: grid;
  gap: 14px;
}

.settings-block {
  border-radius: 24px;
  border: 1px solid var(--studio-line);
  padding: 16px;
  background: color-mix(in srgb, var(--studio-card) 92%, transparent);
}

.settings-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.settings-label {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.settings-hint {
  margin-top: 6px;
  color: var(--studio-muted);
  font-size: 12px;
  line-height: 1.6;
}

.settings-hint--inline {
  margin-top: 0;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.settings-grid--dimensions {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.settings-inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.settings-advanced {
  display: grid;
  gap: 16px;
  padding-top: 6px;
}

:deep(.settings-pill .n-radio__label) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 700;
}

:deep(.settings-pill.n-radio-button--checked) {
  background: color-mix(in srgb, var(--studio-accent) 14%, transparent);
}

@media (max-width: 640px) {
  .settings-grid,
  .settings-grid--dimensions {
    grid-template-columns: 1fr;
  }
}
</style>
