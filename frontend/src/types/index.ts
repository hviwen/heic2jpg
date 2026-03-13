/**
 * 文件转换相关类型定义
 */

// 文件状态
export type FileStatus = 
  | 'pending'     // 等待处理
  | 'uploading'   // 上传中
  | 'processing'  // 转换中
  | 'completed'   // 转换完成
  | 'failed'      // 转换失败
  | 'cancelled'   // 已取消

// 转换模式
export type ConversionMode = 'browser' | 'server' | 'auto'

// 输出格式
export type OutputFormat = 'jpeg' | 'png' | 'webp'

// 文件任务
export interface FileTask {
  id: string
  file: File
  originalName: string
  originalSize: number
  originalType: string
  status: FileStatus
  progress: number
  error?: string
  result?: {
    blob?: Blob
    url?: string
    filename: string
    size: number
    width?: number
    height?: number
    format: OutputFormat
  }
  startedAt?: Date
  completedAt?: Date
}

// 转换选项
export interface ConversionOptions {
  quality: number // 1-100
  keepMetadata: boolean
  outputFormat: OutputFormat
  maxWidth?: number
  maxHeight?: number
  conversionMode: ConversionMode
}

// 批量转换状态
export interface BatchConversion {
  id: string
  tasks: FileTask[]
  totalFiles: number
  processedFiles: number
  successfulFiles: number
  failedFiles: number
  isProcessing: boolean
  isCompleted: boolean
  startedAt: Date
  completedAt?: Date
  options: ConversionOptions
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
}

export interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
  timestamp?: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  avatarUrl?: string | null
}

export interface AuthSessionResponse {
  authenticated: boolean
  oauthEnabled: boolean
  user: AuthUser | null
}

export interface ServerSharpCapabilities {
  heicInput: boolean
  heifInput: boolean
  avifInput: boolean
  supportedSuffixes: string[]
}

export interface ServerInfoResponse {
  status: string
  timestamp: string
  sharp: {
    working?: boolean
    version: string
    libvips: string
    available?: boolean
    capabilities?: ServerSharpCapabilities
    test?: {
      format?: string
      width?: number
      height?: number
      success: boolean
    }
  }
}

// 单文件转换API响应
export interface SingleConversionResponse {
  original: {
    filename: string
    size: number
    mimetype: string
  }
  converted: {
    filename: string
    size: number
    url: string
    downloadUrl: string
    format: string
    width?: number
    height?: number
  }
  options: ConversionOptions
  conversionTime: number
}

// 批量转换API响应
export interface BatchConversionResponse {
  batchId: string
  totalFiles: number
  status: 'processing' | 'completed' | 'failed'
  progressUrl: string
  resultsUrl: string
  estimatedTime: string
}

// 批量转换进度
export interface BatchProgress {
  batchId: string
  status: 'processing' | 'completed' | 'failed'
  progress: number
  processed: number
  total: number
  estimatedTimeRemaining: string
}

// 批量转换结果
export interface BatchResults {
  batchId: string
  status: 'processing' | 'completed' | 'failed'
  totalFiles: number
  successful: number
  failed: number
  results: Array<{
    originalName: string
    convertedName: string
    status: 'success' | 'failed'
    size: number
    url: string
    width?: number
    height?: number
    error?: string
  }>
  downloadAllUrl: string | null
}

// 上传组件属性
export interface UploadComponentProps {
  accept?: string[]
  maxSize?: number
  maxFiles?: number
  allowMultiple?: boolean
  allowFolder?: boolean
  disabled?: boolean
  onFilesSelected: (files: File[]) => void
}

// 进度组件属性
export interface ProgressComponentProps {
  task: FileTask
  showDetails?: boolean
  showActions?: boolean
  onCancel?: (taskId: string) => void
  onRetry?: (taskId: string) => void
}

// 设置表单数据
export interface SettingsFormData {
  quality: number
  keepMetadata: boolean
  outputFormat: OutputFormat
  maxWidth?: number
  maxHeight?: number
  conversionMode: ConversionMode
  autoStart: boolean
  autoDownload: boolean
  cleanupAfterDownload: boolean
}

// 用户偏好设置
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: string
  defaultQuality: number
  defaultFormat: OutputFormat
  defaultConversionMode: ConversionMode
  showAdvancedOptions: boolean
  enableNotifications: boolean
  enableSoundEffects: boolean
  saveHistory: boolean
  historyLimit: number
}

// 历史记录项
export interface HistoryItem {
  id: string
  timestamp: Date
  totalFiles: number
  successful: number
  failed: number
  totalSize: number
  conversionTime: number
  options: ConversionOptions
  files: Array<{
    originalName: string
    convertedName: string
    status: 'success' | 'failed'
    size: number
  }>
}

// Worker消息类型
export type WorkerMessageType = 
  | 'init'
  | 'convert'
  | 'progress'
  | 'complete'
  | 'error'
  | 'cancel'

// Worker消息
export interface WorkerMessage {
  type: WorkerMessageType
  data?: any
  id?: string
  error?: string
}

// 浏览器转换结果
export interface BrowserConversionResult {
  blob: Blob
  width: number
  height: number
  format: OutputFormat
  conversionTime: number
  file?: File // 可选的文件对象，便于下载
}

// 应用状态
export interface AppState {
  isInitialized: boolean
  isProcessing: boolean
  activeBatchId?: string
  totalConversions: number
  totalFilesConverted: number
  totalSizeConverted: number
  lastConversion?: Date
}

// 错误类型
export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: Date
  stack?: string
}

// 拖放事件数据
export interface DropEventData {
  files: File[]
  items: DataTransferItemList
  types: string[]
}
