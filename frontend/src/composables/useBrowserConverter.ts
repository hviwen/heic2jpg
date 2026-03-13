import { ref } from 'vue'
import type { ConversionOptions, BrowserConversionResult, OutputFormat } from '../types'
import { createConversionWorker } from '../workers/conversion.worker'

type WorkerConversionOptions = {
  quality: number
  keepMetadata: boolean
  outputFormat: OutputFormat
  maxWidth?: number
  maxHeight?: number
}

export function useBrowserConverter() {
  const isInitialized = ref(false)
  const isConverting = ref(false)
  const currentWorker = ref<Worker | null>(null)
  const activeConversions = ref(new Map<string, AbortController>())

  // 初始化转换器
  // 初始化转换器
  const initialize = async (): Promise<boolean> => {
    if (isInitialized.value) return true

    try {
      // 检查浏览器是否支持Web Workers和WASM
      if (!window.Worker || !window.WebAssembly) {
        throw new Error('浏览器不支持Web Workers或WebAssembly')
      }

      isInitialized.value = true
      return true
    } catch (error) {
      console.error('浏览器转换器初始化失败:', error)
      return false
    }
  }

  // 转换单个文件
  const convert = async (
    file: File, 
    options: ConversionOptions
  ): Promise<BrowserConversionResult> => {
    if (!isInitialized.value) {
      const initialized = await initialize()
      if (!initialized) {
        throw new Error('浏览器转换器初始化失败')
      }
    }

    if (isConverting.value) {
      throw new Error('已有转换任务在进行中')
    }

    isConverting.value = true
    
    try {
      // 验证文件类型
      if (!isValidHeicFile(file)) {
        throw new Error(`不支持的文件类型: ${file.type || '未知'}`)
      }

      // 验证文件大小（浏览器端限制为50MB）
      const maxSize = 50 * 1024 * 1024 // 50MB
      if (file.size > maxSize) {
        throw new Error(`文件大小超过限制 (最大 ${formatFileSize(maxSize)})`)
      }

      // 使用Worker进行转换
      return await convertWithWorker(file, options)
    } finally {
      isConverting.value = false
    }
  }

  // 使用Worker转换
  const convertWithWorker = (
    file: File, 
    options: ConversionOptions
  ): Promise<BrowserConversionResult> => {
    return new Promise((resolve, reject) => {
      const conversionId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
      const abortController = new AbortController()
      
      activeConversions.value.set(conversionId, abortController)

      // 创建Worker
      const worker = createConversionWorker()
      currentWorker.value = worker

      const workerOptions: WorkerConversionOptions = {
        quality: options.quality,
        keepMetadata: options.keepMetadata,
        outputFormat: options.outputFormat,
        maxWidth: options.maxWidth,
        maxHeight: options.maxHeight
      }

      // 设置超时
      const timeoutId = setTimeout(() => {
        abortController.abort()
        worker.terminate()
        currentWorker.value = null
        activeConversions.value.delete(conversionId)
        reject(new Error('转换超时（60秒）'))
      }, 60000)

      // 处理Worker消息
      worker.onmessage = (event) => {
        const { type, data } = event.data

        switch (type) {
          case 'progress':
            // 进度更新
            console.log(`转换进度: ${data.progress}% (${file.name})`)
            break

          case 'complete':
            clearTimeout(timeoutId)
            worker.terminate()
            currentWorker.value = null
            activeConversions.value.delete(conversionId)

            // 将Blob转换为File对象
            const resultFile = new File([data.blob], 
              getOutputFilename(file.name, options.outputFormat), 
              { type: `image/${options.outputFormat}` }
            )

            resolve({
              blob: data.blob,
              width: data.width,
              height: data.height,
              format: options.outputFormat,
              conversionTime: data.conversionTime,
              file: resultFile
            })
            break

          case 'error':
            clearTimeout(timeoutId)
            worker.terminate()
            currentWorker.value = null
            activeConversions.value.delete(conversionId)
            reject(new Error(data?.error || '转换失败'))
            break
        }
      }

      // 处理Worker错误
      worker.onerror = (error) => {
        clearTimeout(timeoutId)
        worker.terminate()
        currentWorker.value = null
        activeConversions.value.delete(conversionId)
        reject(new Error(`Worker错误: ${error.message}`))
      }

      void file.arrayBuffer().then((buffer) => {
        worker.postMessage(
          {
            type: 'convert',
            data: {
              buffer,
              options: workerOptions,
              conversionId
            }
          },
          [buffer]
        )
      }).catch((error) => {
        clearTimeout(timeoutId)
        worker.terminate()
        currentWorker.value = null
        activeConversions.value.delete(conversionId)
        reject(new Error(error instanceof Error ? error.message : '读取文件失败'))
      })

      // 监听取消信号
      abortController.signal.addEventListener('abort', () => {
        clearTimeout(timeoutId)
        worker.terminate()
        currentWorker.value = null
        activeConversions.value.delete(conversionId)
        reject(new Error('转换已取消'))
      })
    })
  }

  // 验证HEIC文件
  const isValidHeicFile = (file: File): boolean => {
    const allowedTypes = [
      'image/heic',
      'image/heif',
      'image/heic-sequence',
      'image/heif-sequence',
      'application/octet-stream' // 某些HEIC文件可能没有正确的MIME类型
    ]

    const allowedExtensions = ['.heic', '.heif', '.HEIC', '.HEIF']
    const fileName = file.name.toLowerCase()

    // 检查文件扩展名
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext))
    
    // 检查MIME类型
    const hasValidType = allowedTypes.includes(file.type?.toLowerCase())

    return hasValidExtension || hasValidType
  }

  // 批量转换
  const convertBatch = async (
    files: File[], 
    options: ConversionOptions,
    onProgress?: (progress: number) => void
  ): Promise<BrowserConversionResult[]> => {
    const results: BrowserConversionResult[] = []
    const totalFiles = files.length
    
    // 并发限制：最多同时处理3个文件
    const concurrencyLimit = 3
    const processingQueue: Promise<void>[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file) continue

      const conversionPromise = convert(file, options)
        .then(result => {
          results.push(result)
          
          // 更新进度
          if (onProgress) {
            const progress = Math.round((results.length / totalFiles) * 100)
            onProgress(progress)
          }
        })
        .catch(error => {
          console.error(`文件转换失败 ${file.name}:`, error)
          // 继续处理其他文件
        })
        .finally(() => {
          // 从处理队列中移除
          const index = processingQueue.indexOf(conversionPromise)
          if (index > -1) {
            processingQueue.splice(index, 1)
          }
        })

      processingQueue.push(conversionPromise)

      // 如果达到并发限制，等待一个任务完成
      if (processingQueue.length >= concurrencyLimit) {
        await Promise.race(processingQueue)
      }
    }

    // 等待所有任务完成
    await Promise.allSettled(processingQueue)

    return results
  }

  // 取消所有转换
  const cancelAll = () => {
    activeConversions.value.forEach(controller => {
      controller.abort()
    })
    activeConversions.value.clear()

    if (currentWorker.value) {
      currentWorker.value.terminate()
      currentWorker.value = null
    }

    isConverting.value = false
  }

  // 检查是否支持浏览器转换
  const checkSupport = async (): Promise<{
    supported: boolean
    reasons: string[]
  }> => {
    const reasons: string[] = []

    // 检查Web Workers
    if (!window.Worker) {
      reasons.push('浏览器不支持Web Workers')
    }

    // 检查WebAssembly
    if (!window.WebAssembly) {
      reasons.push('浏览器不支持WebAssembly')
    }

    return {
      supported: reasons.length === 0,
      reasons
    }
  }

  // 获取转换器状态
  const getStatus = () => ({
    isInitialized: isInitialized.value,
    isConverting: isConverting.value,
    activeConversions: activeConversions.value.size,
    workerActive: !!currentWorker.value
  })

  // 清理资源
  const cleanup = () => {
    cancelAll()
    activeConversions.value.clear()
    isInitialized.value = false
  }

  return {
    initialize,
    convert,
    convertBatch,
    cancelAll,
    checkSupport,
    getStatus,
    cleanup,
    isValidHeicFile
  }
}

// 辅助函数：格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 生成输出文件名
function getOutputFilename(originalName: string, format: OutputFormat): string {
  const nameWithoutExt = originalName.replace(/\.[^.]+$/, '')
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return `${nameWithoutExt}_converted_${timestamp}.${format}`
}
