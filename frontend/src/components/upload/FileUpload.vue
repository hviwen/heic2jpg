<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { NAlert, NButton, NCard, NTag } from 'naive-ui'
import { ArrowUpTrayIcon, DocumentDuplicateIcon, FolderIcon } from '@heroicons/vue/24/outline'
import { useI18n } from 'vue-i18n'
import type { UploadComponentProps } from '../../types'

const props = withDefaults(defineProps<UploadComponentProps>(), {
  accept: () => ['.heic', '.heif'],
  maxSize: 100 * 1024 * 1024,
  maxFiles: 50,
  allowMultiple: true,
  allowFolder: true,
  disabled: false
})

const emit = defineEmits<{
  filesSelected: [files: File[]]
}>()

const { t } = useI18n()
const isDragging = ref(false)
const isProcessing = ref(false)
const errorMessage = ref<string | null>(null)
const dropzoneRef = ref<HTMLElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const acceptString = computed(() => props.accept.join(','))

const maxSizeFormatted = computed(() => formatFileSize(props.maxSize))

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function validateFile(file: File): boolean {
  if (file.size > props.maxSize) {
    errorMessage.value = `“${file.name}” ${maxSizeFormatted.value} 以上`
    return false
  }

  const fileName = file.name.toLowerCase()
  const isValidType = props.accept.some((ext) => fileName.endsWith(ext.toLowerCase()))
  if (!isValidType) {
    errorMessage.value = `“${file.name}” 不在 ${props.accept.join(', ')} 范围内`
    return false
  }

  return true
}

async function processFiles(files: File[]) {
  if (props.disabled || isProcessing.value) return

  isProcessing.value = true
  errorMessage.value = null

  try {
    if (files.length > props.maxFiles) {
      throw new Error(`最多选择 ${props.maxFiles} 个文件`)
    }

    const validFiles: File[] = []
    for (const file of files) {
      if (!validateFile(file)) {
        break
      }
      validFiles.push(file)
    }

    if (validFiles.length > 0) {
      emit('filesSelected', validFiles)
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '处理文件时发生错误'
  } finally {
    isProcessing.value = false
  }
}

function handleFileInputChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    void processFiles(Array.from(input.files))
  }
  input.value = ''
}

function triggerFileInput() {
  if (!props.disabled && !isProcessing.value) {
    fileInputRef.value?.click()
  }
}

function handleDragEnter(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  if (props.disabled || isProcessing.value) return

  const hasFiles = Array.from(event.dataTransfer?.items ?? []).some((item) => item.kind === 'file')
  if (hasFiles) {
    isDragging.value = true
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()

  const relatedTarget = event.relatedTarget as Node | null
  if (!dropzoneRef.value?.contains(relatedTarget)) {
    isDragging.value = false
  }
}

async function handleDrop(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  isDragging.value = false

  if (props.disabled || isProcessing.value) return
  const dataTransfer = event.dataTransfer
  if (!dataTransfer || dataTransfer.files.length === 0) return

  try {
    const files: File[] = []
    const items = dataTransfer.items

    if (props.allowFolder) {
      for (let i = 0; i < items.length; i += 1) {
        const item = items[i]
        if (!item || item.kind !== 'file') continue
        const entry = item.webkitGetAsEntry?.()
        if (entry?.isDirectory) {
          files.push(...(await getFilesFromDirectory(entry as FileSystemDirectoryEntry)))
        } else {
          const file = item.getAsFile()
          if (file) {
            files.push(file)
          }
        }
      }
    } else {
      files.push(...Array.from(dataTransfer.files))
    }

    if (files.length > 0) {
      await processFiles(files)
    }
  } catch {
    errorMessage.value = '处理拖放文件时发生错误'
  }
}

async function getFilesFromDirectory(directoryEntry: FileSystemDirectoryEntry): Promise<File[]> {
  const files: File[] = []
  const reader = directoryEntry.createReader()

  return new Promise((resolve, reject) => {
    const readEntries = () => {
      reader.readEntries(async (entries) => {
        if (entries.length === 0) {
          resolve(files)
          return
        }

        for (const entry of entries) {
          if (entry.isFile) {
            const file = await getFileFromEntry(entry as FileSystemFileEntry)
            if (file && validateFile(file)) {
              files.push(file)
            }
          } else if (entry.isDirectory) {
            files.push(...(await getFilesFromDirectory(entry as FileSystemDirectoryEntry)))
          }
        }

        readEntries()
      }, reject)
    }

    readEntries()
  })
}

function getFileFromEntry(fileEntry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => {
    fileEntry.file(resolve, reject)
  })
}

function handlePaste(event: ClipboardEvent) {
  if (props.disabled || isProcessing.value || !event.clipboardData) return

  const files: File[] = []
  for (const item of Array.from(event.clipboardData.items)) {
    if (item.kind !== 'file') continue
    const file = item.getAsFile()
    if (file && validateFile(file)) {
      files.push(file)
    }
  }

  if (files.length > 0) {
    void processFiles(files)
  }
}

function clearError() {
  errorMessage.value = null
}

onMounted(() => {
  document.addEventListener('paste', handlePaste)
})

onUnmounted(() => {
  document.removeEventListener('paste', handlePaste)
})
</script>

<template>
  <div class="space-y-4">
    <input
      ref="fileInputRef"
      type="file"
      :accept="acceptString"
      :multiple="allowMultiple"
      class="hidden"
      @change="handleFileInputChange"
    />

    <NCard
      ref="dropzoneRef"
      embedded
      :bordered="false"
      class="studio-panel upload-shell"
      :class="{ 'upload-shell--dragging': isDragging }"
      @dragenter="handleDragEnter"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <div class="space-y-5 p-2 text-center md:p-6">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-[var(--studio-line)] bg-[color:color-mix(in_srgb,var(--studio-accent)_14%,transparent)]">
          <ArrowUpTrayIcon class="h-8 w-8 text-[var(--studio-accent)]" />
        </div>

        <div class="space-y-2">
          <h3 class="studio-display text-3xl font-semibold leading-tight text-balance">
            {{ t('upload.title') }}
          </h3>
          <p class="mx-auto max-w-2xl text-sm leading-7 text-[var(--studio-muted)] md:text-base">
            {{ t('upload.subtitle') }}
          </p>
        </div>

        <div class="flex flex-wrap justify-center gap-2">
          <NTag round :bordered="false">
            {{ t('upload.hint') }}
          </NTag>
          <NTag round :bordered="false">
            <FolderIcon class="mr-1 h-4 w-4" />
            {{ t('upload.folder') }}
          </NTag>
          <NTag round :bordered="false">
            <DocumentDuplicateIcon class="mr-1 h-4 w-4" />
            {{ t('upload.paste') }}
          </NTag>
        </div>

        <NButton
          type="primary"
          strong
          size="large"
          :loading="isProcessing"
          :disabled="disabled"
          @click="triggerFileInput"
        >
          {{ t('upload.button') }}
        </NButton>
      </div>
    </NCard>

    <NAlert
      v-if="errorMessage"
      type="error"
      closable
      :title="t('upload.errorTitle')"
      @close="clearError"
    >
      {{ errorMessage }}
    </NAlert>
  </div>
</template>

<style scoped>
.upload-shell {
  border-radius: 34px;
  transition:
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 220ms cubic-bezier(0.22, 1, 0.36, 1),
    border-color 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.upload-shell--dragging {
  transform: translateY(-4px) scale(1.01);
  box-shadow:
    0 26px 50px rgba(45, 106, 79, 0.14),
    inset 0 0 0 1px color-mix(in srgb, var(--studio-accent) 32%, transparent);
}
</style>
