import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type { BatchConversion, ConversionOptions, FileTask, HistoryItem } from '../types'
import { MAX_UPLOAD_FILE_SIZE, MAX_UPLOAD_FILES } from '../constants/upload'
import { useBrowserConverter } from '../composables/useBrowserConverter'
import { useServerConverter } from '../composables/useServerConverter'
import { downloadFiles, getConvertedFilename } from '../utils/fileUtils'
import { getApiBaseUrl, toApiUrl } from '../utils/api'

const DEFAULT_OPTIONS: ConversionOptions = {
  quality: 82,
  keepMetadata: false,
  outputFormat: 'jpeg',
  conversionMode: 'auto'
}

const HISTORY_LIMIT = 50
const OPTIONS_STORAGE_KEY = 'heic2jpg-conversion-options'
const HISTORY_STORAGE_KEY = 'heic2jpg-conversion-history'
const ERROR_THUMBNAIL_URL = '/assets/error.svg'

const normalizeOptionalDimension = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  const parsed = Number.parseInt(String(value).trim(), 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined
  }

  return parsed
}

const sanitizeOptions = (rawOptions?: Partial<ConversionOptions> | null): ConversionOptions => ({
  ...DEFAULT_OPTIONS,
  ...(rawOptions ?? {}),
  quality:
    typeof rawOptions?.quality === 'number' && rawOptions.quality >= 1 && rawOptions.quality <= 100
      ? rawOptions.quality
      : DEFAULT_OPTIONS.quality,
  maxWidth: normalizeOptionalDimension(rawOptions?.maxWidth),
  maxHeight: normalizeOptionalDimension(rawOptions?.maxHeight)
})

const createPreviewUrl = (file: File) => URL.createObjectURL(file)

export const useConversionStore = defineStore('conversion', () => {
  const tasks = ref<FileTask[]>([])
  const activeBatchId = ref<string | null>(null)
  const batches = ref<BatchConversion[]>([])
  const options = ref<ConversionOptions>({ ...DEFAULT_OPTIONS })
  const isProcessing = ref(false)
  const history = ref<HistoryItem[]>([])

  const browserConverter = useBrowserConverter()
  const serverConverter = useServerConverter()

  const totalFiles = computed(() => tasks.value.length)
  const pendingFiles = computed(() => tasks.value.filter((task) => task.status === 'pending').length)
  const processingFiles = computed(() =>
    tasks.value.filter((task) => task.status === 'processing' || task.status === 'uploading').length
  )
  const completedFiles = computed(() => tasks.value.filter((task) => task.status === 'completed').length)
  const failedFiles = computed(() => tasks.value.filter((task) => task.status === 'failed').length)

  const totalProgress = computed(() => {
    if (tasks.value.length === 0) {
      return 0
    }

    const total = tasks.value.reduce((sum, task) => sum + task.progress, 0)
    return Math.round(total / tasks.value.length)
  })

  const totalOriginalSize = computed(() => tasks.value.reduce((sum, task) => sum + task.originalSize, 0))
  const totalConvertedSize = computed(() =>
    tasks.value
      .filter((task) => task.status === 'completed' && task.result)
      .reduce((sum, task) => sum + (task.result?.size ?? 0), 0)
  )

  const currentBatch = computed(() => batches.value.find((batch) => batch.id === activeBatchId.value))
  const canStartProcessing = computed(() => pendingFiles.value > 0 && !isProcessing.value)
  const canCancelProcessing = computed(() => isProcessing.value || processingFiles.value > 0)

  const revokeObjectUrl = (url?: string) => {
    if (url?.startsWith('blob:')) {
      URL.revokeObjectURL(url)
    }
  }

  const getTask = (taskId: string) => tasks.value.find((task) => task.id === taskId)

  const syncBatchSummary = (batchId: string) => {
    const batch = batches.value.find((item) => item.id === batchId)
    if (!batch) {
      return
    }

    const batchTaskIds = new Set(batch.tasks.map((task) => task.id))
    const scopedTasks = tasks.value.filter((task) => batchTaskIds.has(task.id))

    batch.processedFiles = scopedTasks.filter((task) => task.status === 'completed' || task.status === 'failed').length
    batch.successfulFiles = scopedTasks.filter((task) => task.status === 'completed').length
    batch.failedFiles = scopedTasks.filter((task) => task.status === 'failed').length
  }

  const setTaskThumbnailState = (
    taskId: string,
    state: 'idle' | 'loading' | 'ready' | 'error'
  ) => {
    const task = getTask(taskId)
    if (!task) {
      return
    }

    task.thumbnailState = state

    if (state === 'error') {
      revokeObjectUrl(task.thumbnailUrl)
      task.thumbnailUrl = ERROR_THUMBNAIL_URL
    }
  }

  const restoreTaskThumbnail = (task: FileTask) => {
    if (task.thumbnailUrl === ERROR_THUMBNAIL_URL || task.thumbnailState === 'error') {
      revokeObjectUrl(task.thumbnailUrl)
      task.thumbnailUrl = createPreviewUrl(task.file)
    }

    task.thumbnailState = 'loading'
  }

  const createTask = (file: File): FileTask => ({
    id: uuidv4(),
    file,
    originalName: file.name,
    originalSize: file.size,
    originalType: file.type,
    status: 'pending',
    progress: 0,
    uploadProgress: 0,
    thumbnailUrl: createPreviewUrl(file),
    thumbnailState: 'loading'
  })

  const addFiles = (fileList: File[]) => {
    if (tasks.value.length + fileList.length > MAX_UPLOAD_FILES) {
      throw new Error(`最多只能保留 ${MAX_UPLOAD_FILES} 个文件`)
    }

    const oversizedFile = fileList.find((file) => file.size > MAX_UPLOAD_FILE_SIZE)
    if (oversizedFile) {
      throw new Error(`${oversizedFile.name} 超过 30 MB`)
    }

    const newTasks = fileList.map(createTask)
    tasks.value.push(...newTasks)
    return newTasks.map((task) => task.id)
  }

  const cleanupTaskResources = (task: FileTask) => {
    revokeObjectUrl(task.thumbnailUrl)
    revokeObjectUrl(task.result?.url)
  }

  const removeFile = (taskId: string) => {
    const index = tasks.value.findIndex((task) => task.id === taskId)
    if (index === -1) {
      return
    }

    const task = tasks.value[index]
    if (!task) {
      return
    }

    cleanupTaskResources(task)
    tasks.value.splice(index, 1)
  }

  const clearAllFiles = () => {
    tasks.value.forEach(cleanupTaskResources)
    tasks.value = []
    activeBatchId.value = null
    isProcessing.value = false
  }

  const clearCompletedFiles = () => {
    const completedTaskIds = tasks.value.filter((task) => task.status === 'completed').map((task) => task.id)
    completedTaskIds.forEach(removeFile)
  }

  const updateOptions = (newOptions: Partial<ConversionOptions>) => {
    options.value = sanitizeOptions({ ...options.value, ...newOptions })
    localStorage.setItem(OPTIONS_STORAGE_KEY, JSON.stringify(options.value))
  }

  const determineConversionMode = (): 'browser' | 'server' => {
    if (options.value.conversionMode === 'browser' || options.value.conversionMode === 'server') {
      return options.value.conversionMode
    }

    const totalSizeMB = totalOriginalSize.value / (1024 * 1024)
    return tasks.value.length <= 10 && totalSizeMB <= 100 ? 'browser' : 'server'
  }

  const markTaskFailed = (task: FileTask, error: string) => {
    task.status = 'failed'
    task.progress = 0
    task.uploadProgress = 0
    task.error = error
    task.copyableUrl = undefined
    task.completedAt = new Date()
    setTaskThumbnailState(task.id, 'error')
  }

  const resetTaskForRetry = (task: FileTask) => {
    revokeObjectUrl(task.result?.url)
    task.status = 'pending'
    task.progress = 0
    task.uploadProgress = 0
    task.error = undefined
    task.result = undefined
    task.copyableUrl = undefined
    task.startedAt = undefined
    task.completedAt = undefined
    restoreTaskThumbnail(task)
  }

  const processWithBrowser = async (batchId: string) => {
    const initialized = await browserConverter.initialize()
    if (!initialized) {
      throw new Error('浏览器转换器初始化失败，请检查浏览器支持')
    }

    const pendingTasks = tasks.value.filter((task) => task.status === 'pending')

    for (const task of pendingTasks) {
      task.status = 'processing'
      task.startedAt = new Date()
      task.progress = Math.max(task.progress, 5)
      task.uploadProgress = 0
      task.error = undefined

      try {
        const result = await browserConverter.convert(task.file, options.value, (progress) => {
          task.progress = Math.max(task.progress, Math.min(progress, 99))
        })

        task.status = 'completed'
        task.progress = 100
        task.completedAt = new Date()
        task.result = {
          blob: result.blob,
          url: URL.createObjectURL(result.blob),
          filename: getConvertedFilename(task.originalName, options.value.outputFormat),
          size: result.blob.size,
          width: result.width,
          height: result.height,
          format: options.value.outputFormat
        }
        task.copyableUrl = undefined
      } catch (error) {
        markTaskFailed(task, error instanceof Error ? error.message : '浏览器转换失败')
      } finally {
        syncBatchSummary(batchId)
      }
    }
  }

  const processWithServer = async (batchId: string) => {
    const pendingTasks = tasks.value.filter((task) => task.status === 'pending')
    if (pendingTasks.length === 0) {
      return
    }

    if (!serverConverter.isConnected.value) {
      serverConverter.initialize(getApiBaseUrl())
      const connected = await serverConverter.checkConnection()
      if (!connected) {
        throw new Error('无法连接到转换服务器，请确保后端服务正在运行')
      }
    }

    try {
      const serverInfo = await serverConverter.getServerInfo()
      const heicInputSupported =
        serverInfo.sharp.capabilities?.heicInput || serverInfo.sharp.capabilities?.heifInput || false

      if (!heicInputSupported) {
        const canFallbackToBrowser = pendingTasks.every((task) => task.file.size <= MAX_UPLOAD_FILE_SIZE)

        if (canFallbackToBrowser) {
          console.warn('服务器端未启用HEIC解码支持，已自动回退到浏览器端处理')
          await processWithBrowser(batchId)
          return
        }

        throw new Error('当前服务器环境未启用HEIC/HEIF解码支持，请切换到浏览器端处理')
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('未启用HEIC/HEIF解码支持')) {
        throw error
      }
    }

    pendingTasks.forEach((task) => {
      task.status = 'uploading'
      task.startedAt = new Date()
      task.progress = 0
      task.uploadProgress = 0
      task.error = undefined
    })

    const response = await serverConverter.convertBatch(
      pendingTasks.map((task) => task.file),
      options.value,
      (progress) => {
        pendingTasks.forEach((task) => {
          if (task.status === 'uploading') {
            task.uploadProgress = progress
            task.progress = Math.min(progress, 95)
          }
        })
      }
    )

    pendingTasks.forEach((task) => {
      task.status = 'processing'
      task.uploadProgress = 100
      task.progress = Math.max(task.progress, 1)
    })

    let completed = false
    while (!completed && isProcessing.value) {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const progress = await serverConverter.getBatchProgress(response.batchId)
      const processedCount = Math.min(progress.processed, pendingTasks.length)

      pendingTasks.forEach((task, index) => {
        if (task.status !== 'processing') {
          return
        }

        if (index < processedCount) {
          task.progress = 100
        } else if (progress.status === 'processing') {
          task.progress = Math.max(task.progress, progress.progress)
        }
      })

      syncBatchSummary(batchId)
      completed = progress.status === 'completed' || progress.status === 'failed'
    }

    const results = await serverConverter.getBatchResults(response.batchId)
    const resultsByName = new Map(results.results.map((result) => [result.originalName, result]))

    pendingTasks.forEach((task) => {
      const result = resultsByName.get(task.originalName)
      if (result?.status === 'success') {
        task.status = 'completed'
        task.progress = 100
        task.uploadProgress = 100
        task.completedAt = new Date()
        task.result = {
          url: result.url,
          filename: getConvertedFilename(task.originalName, options.value.outputFormat),
          size: result.size,
          width: result.width,
          height: result.height,
          format: options.value.outputFormat
        }
        task.copyableUrl = toApiUrl(result.url)
      } else {
        markTaskFailed(task, result?.error || '服务器转换失败')
      }
    })

    syncBatchSummary(batchId)
  }

  const saveToHistory = (batchId: string) => {
    const batch = batches.value.find((item) => item.id === batchId)
    if (!batch) {
      return
    }

    const batchTaskIds = new Set(batch.tasks.map((task) => task.id))
    const scopedTasks = tasks.value.filter((task) => batchTaskIds.has(task.id))

    const historyItem: HistoryItem = {
      id: batchId,
      timestamp: new Date(),
      totalFiles: batch.totalFiles,
      successful: scopedTasks.filter((task) => task.status === 'completed').length,
      failed: scopedTasks.filter((task) => task.status === 'failed').length,
      totalSize: scopedTasks.reduce((sum, task) => sum + task.originalSize, 0),
      conversionTime: batch.completedAt ? batch.completedAt.getTime() - batch.startedAt.getTime() : 0,
      options: { ...batch.options },
      files: scopedTasks.map((task) => ({
        originalName: task.originalName,
        convertedName: task.result?.filename || '',
        status: task.status === 'completed' ? 'success' : 'failed',
        size: task.result?.size || 0
      }))
    }

    history.value.unshift(historyItem)
    history.value = history.value.slice(0, HISTORY_LIMIT)
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history.value))
  }

  const startConversion = async () => {
    if (isProcessing.value || pendingFiles.value === 0) {
      return
    }

    const batchId = uuidv4()
    const batchTasks = tasks.value.filter((task) => task.status === 'pending')
    const batch: BatchConversion = {
      id: batchId,
      tasks: batchTasks,
      totalFiles: batchTasks.length,
      processedFiles: 0,
      successfulFiles: 0,
      failedFiles: 0,
      isProcessing: true,
      isCompleted: false,
      startedAt: new Date(),
      options: { ...options.value }
    }

    activeBatchId.value = batchId
    batches.value.push(batch)
    isProcessing.value = true

    try {
      const mode = determineConversionMode()
      if (mode === 'browser') {
        await processWithBrowser(batchId)
      } else {
        await processWithServer(batchId)
      }
    } catch (error) {
      batchTasks.forEach((task) => {
        if (task.status === 'processing' || task.status === 'uploading') {
          markTaskFailed(task, error instanceof Error ? error.message : '批量转换过程中发生错误')
        }
      })
    } finally {
      batch.isProcessing = false
      batch.isCompleted = true
      batch.completedAt = new Date()
      syncBatchSummary(batchId)
      isProcessing.value = false
      saveToHistory(batchId)
    }
  }

  const cancelConversion = () => {
    tasks.value.forEach((task) => {
      if (task.status === 'processing' || task.status === 'pending' || task.status === 'uploading') {
        task.status = 'cancelled'
        task.progress = 0
        task.uploadProgress = 0
      }
    })

    browserConverter.cancelAll()
    isProcessing.value = false
  }

  const cancelTask = (taskId: string) => {
    const task = getTask(taskId)
    if (!task || (task.status !== 'processing' && task.status !== 'pending' && task.status !== 'uploading')) {
      return
    }

    task.status = 'cancelled'
    task.progress = 0
    task.uploadProgress = 0
  }

  const retryTask = (taskId: string) => {
    const task = getTask(taskId)
    if (!task || (task.status !== 'failed' && task.status !== 'cancelled')) {
      return
    }

    resetTaskForRetry(task)

    if (!isProcessing.value) {
      void startConversion()
    }
  }

  const retryFailedTasks = () => {
    tasks.value.forEach((task) => {
      if (task.status === 'failed' || task.status === 'cancelled') {
        resetTaskForRetry(task)
      }
    })

    if (!isProcessing.value) {
      void startConversion()
    }
  }

  const loadFromStorage = () => {
    try {
      const savedOptions = localStorage.getItem(OPTIONS_STORAGE_KEY)
      if (savedOptions) {
        options.value = sanitizeOptions(JSON.parse(savedOptions) as Partial<ConversionOptions>)
      }

      const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY)
      if (savedHistory) {
        history.value = JSON.parse(savedHistory)
      }
    } catch (error) {
      console.error('加载存储数据失败:', error)
    }
  }

  const downloadTask = async (taskId: string) => {
    const task = getTask(taskId)
    if (!task?.result?.url) {
      return
    }

    if (task.result.blob) {
      const anchor = document.createElement('a')
      anchor.href = task.result.url
      anchor.download = task.result.filename
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      return
    }

    await serverConverter.downloadFile(task.result.url, task.result.filename)
  }

  const downloadAllCompleted = async () => {
    const completedTasks = tasks.value.filter((task) => task.status === 'completed' && task.result)
    if (completedTasks.length === 0) {
      return
    }

    const localFiles = completedTasks
      .filter((task) => task.result?.blob)
      .map((task) => ({
        blob: task.result!.blob as Blob,
        filename: task.result!.filename
      }))

    if (localFiles.length > 0) {
      await downloadFiles(localFiles)
    }

    for (const task of completedTasks.filter((item) => !item.result?.blob && item.result?.url)) {
      await serverConverter.downloadFile(task.result!.url!, task.result!.filename)
    }
  }

  loadFromStorage()

  return {
    tasks,
    batches,
    options,
    isProcessing,
    history,
    activeBatchId,
    totalFiles,
    pendingFiles,
    processingFiles,
    completedFiles,
    failedFiles,
    totalProgress,
    totalOriginalSize,
    totalConvertedSize,
    currentBatch,
    canStartProcessing,
    canCancelProcessing,
    addFiles,
    removeFile,
    clearAllFiles,
    clearCompletedFiles,
    updateOptions,
    startConversion,
    cancelConversion,
    cancelTask,
    retryTask,
    retryFailedTasks,
    loadFromStorage,
    downloadTask,
    downloadAllCompleted,
    setTaskThumbnailState
  }
})
