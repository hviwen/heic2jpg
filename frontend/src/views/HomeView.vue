<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { NAlert, NButton, NCard, NTag, useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import FileUpload from '../components/upload/FileUpload.vue'
import ConversionSettings from '../components/processing/ConversionSettings.vue'
import TaskList from '../components/processing/TaskList.vue'
import StatsCard from '../components/common/StatsCard.vue'
import { useConversionStore } from '../stores/conversion'
import { MAX_UPLOAD_FILE_SIZE, MAX_UPLOAD_FILES } from '../constants/upload'
import { formatFileSize } from '../utils/fileUtils'

const conversionStore = useConversionStore()
const route = useRoute()
const { t } = useI18n()
const message = useMessage()

const authStatus = computed(() => route.query['auth'])
const authErrorReason = computed(() => route.query['reason'])

const currentModeLabel = computed(() => {
  if (conversionStore.options.conversionMode === 'browser') return t('home.modes.browser')
  if (conversionStore.options.conversionMode === 'server') return t('home.modes.server')
  return t('home.modes.auto')
})

const handleFilesSelected = (files: File[]) => {
  try {
    conversionStore.addFiles(files)
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('upload.errorTitle'))
  }
}
</script>

<template>
  <div class="space-y-5 pb-6">
    <NAlert v-if="authStatus === 'success'" type="success" :bordered="false">
      {{ t('auth.signedIn') }}
    </NAlert>
    <NAlert v-else-if="authStatus === 'error'" type="error" :bordered="false">
      {{ t('auth.failed') }}
      <span v-if="authErrorReason"> {{ t('auth.reason') }}: {{ authErrorReason }}</span>
    </NAlert>

    <section class="workspace-shell">
      <div class="workspace-main">
        <NCard embedded :bordered="false" class="studio-panel workspace-card workspace-card--upload">
          <div class="workspace-card__header">
            <div class="min-w-0">
              <div class="studio-label">{{ t('home.uploadTitle') }}</div>
              <h1 class="workspace-title">{{ t('home.title') }}</h1>
              <p class="workspace-description">{{ t('home.description') }}</p>
            </div>

            <div class="workspace-summary">
              <NTag round :bordered="false">{{ currentModeLabel }}</NTag>
              <NTag round :bordered="false">{{ conversionStore.totalFiles }}/{{ MAX_UPLOAD_FILES }}</NTag>
              <NTag round :bordered="false">{{ formatFileSize(conversionStore.totalOriginalSize) }}</NTag>
            </div>
          </div>

          <FileUpload
            :accept="['.heic', '.heif', '.HEIC', '.HEIF']"
            :max-size="MAX_UPLOAD_FILE_SIZE"
            :max-files="MAX_UPLOAD_FILES"
            :current-count="conversionStore.totalFiles"
            :allow-multiple="true"
            :allow-folder="true"
            @files-selected="handleFilesSelected"
          />
        </NCard>

        <TaskList />
      </div>

      <aside class="workspace-sidebar">
        <div class="workspace-sidebar__sticky">
          <StatsCard />

          <NCard embedded :bordered="false" class="studio-panel workspace-card workspace-card--actions">
            <div class="studio-label">{{ t('home.controlsTitle') }}</div>
            <p class="workspace-actions__description">{{ t('home.privacy') }}</p>

            <div class="workspace-actions">
              <NButton
                type="primary"
                strong
                size="large"
                :disabled="!conversionStore.canStartProcessing"
                @click="conversionStore.startConversion()"
              >
                {{ t('home.primaryAction') }}
              </NButton>
              <NButton
                secondary
                size="large"
                :disabled="conversionStore.completedFiles === 0"
                @click="conversionStore.downloadAllCompleted()"
              >
                {{ t('common.download') }}
              </NButton>
              <NButton
                quaternary
                size="large"
                :disabled="conversionStore.completedFiles === 0"
                @click="conversionStore.clearCompletedFiles()"
              >
                {{ t('home.clearCompleted') }}
              </NButton>
            </div>
          </NCard>

          <NCard embedded :bordered="false" class="studio-panel workspace-card workspace-card--settings">
            <div class="workspace-card__header workspace-card__header--stack">
              <div class="min-w-0">
                <div class="studio-label">{{ t('home.settingsTitle') }}</div>
                <p class="workspace-description">{{ t('home.settingsSubtitle') }}</p>
              </div>
            </div>
            <ConversionSettings />
          </NCard>
        </div>
      </aside>
    </section>
  </div>
</template>

<style scoped>
.workspace-shell {
  display: grid;
  gap: 24px;
  align-items: start;
}

.workspace-main {
  display: grid;
  gap: 24px;
}

.workspace-card {
  border-radius: 34px;
  padding: 24px;
}

.workspace-card--upload {
  padding: 24px;
}

.workspace-card__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.workspace-card__header--stack {
  margin-bottom: 16px;
}

.workspace-title {
  margin: 12px 0 0;
  font-family: 'Fraunces', 'Times New Roman', serif;
  font-size: clamp(2rem, 3vw, 3rem);
  line-height: 0.98;
  letter-spacing: -0.04em;
}

.workspace-description {
  margin-top: 12px;
  max-width: 40rem;
  color: var(--studio-muted);
  font-size: 14px;
  line-height: 1.75;
}

.workspace-summary {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.workspace-sidebar {
  min-width: 0;
}

.workspace-sidebar__sticky {
  display: grid;
  gap: 18px;
}

.workspace-actions__description {
  margin: 10px 0 0;
  color: var(--studio-muted);
  font-size: 14px;
  line-height: 1.7;
}

.workspace-actions {
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

@media (min-width: 1100px) {
  .workspace-shell {
    grid-template-columns: minmax(0, 1.48fr) minmax(320px, 0.82fr);
  }

  .workspace-sidebar__sticky {
    position: sticky;
    top: 102px;
  }
}

@media (max-width: 768px) {
  .workspace-card {
    padding: 18px;
  }

  .workspace-title {
    font-size: 2rem;
  }

  .workspace-summary {
    justify-content: flex-start;
  }
}
</style>
