import { ref } from 'vue'
import axios, { type AxiosInstance } from 'axios'
import type {
  ApiEnvelope,
  BatchConversionResponse,
  BatchProgress,
  BatchResults,
  ConversionOptions,
  ServerInfoResponse,
  SingleConversionResponse
} from '../types'
import { getApiBaseUrl, toApiUrl } from '../utils/api'

function normalizeOptionalDimension(value: unknown): string | null {
  if (value === undefined || value === null || value === '') {
    return null
  }

  const parsed = Number.parseInt(String(value).trim(), 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }

  return parsed.toString()
}

export function useServerConverter() {
  const api = ref<AxiosInstance | null>(null)
  const isConnected = ref(false)
  const serverUrl = ref<string>('')

  // 初始化API客户端
  const initialize = (baseURL: string = getApiBaseUrl()) => {
    serverUrl.value = baseURL
    
    api.value = axios.create({
      baseURL,
      timeout: 300000, // 5分钟超时（用于大文件）
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      withCredentials: true
    })

    // 请求拦截器
    api.value.interceptors.request.use(
      (config) => {
        // 可以在这里添加认证token等
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    api.value.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API请求失败:', error)
        
        // 统一错误处理
        if (error.response) {
          // 服务器返回了错误状态码
          const { status, data } = error.response
          
          switch (status) {
            case 400:
              throw new Error(data.message || '请求参数错误')
            case 413:
              throw new Error('文件大小超过服务器限制')
            case 415:
              throw new Error('不支持的文件类型')
            case 500:
              throw new Error('服务器内部错误，请稍后重试')
            case 507:
              throw new Error('服务器存储空间不足')
            default:
              throw new Error(data.message || `服务器错误 (${status})`)
          }
        } else if (error.request) {
          // 请求已发出但没有收到响应
          throw new Error('服务器连接失败，请检查网络连接')
        } else {
          // 请求配置错误
          throw new Error(error.message || '请求配置错误')
        }
      }
    )

    isConnected.value = true
  }

  // 检查服务器连接
  const checkConnection = async (): Promise<boolean> => {
    if (!api.value) {
      initialize()
    }

    try {
      const response = await api.value!.get('/api/health')
      return response.data.status === 'healthy'
    } catch (error) {
      console.error('服务器连接检查失败:', error)
      isConnected.value = false
      return false
    }
  }

  // 单文件转换
  const convertSingle = async (
    file: File, 
    options: ConversionOptions
  ): Promise<SingleConversionResponse> => {
    if (!api.value) {
      throw new Error('API客户端未初始化')
    }

    // 创建FormData
    const formData = new FormData()
    formData.append('file', file)
    formData.append('quality', options.quality.toString())
    formData.append('keepMetadata', options.keepMetadata.toString())
    formData.append('outputFormat', options.outputFormat)
    
    const maxWidth = normalizeOptionalDimension(options.maxWidth)
    const maxHeight = normalizeOptionalDimension(options.maxHeight)

    if (maxWidth) {
      formData.append('maxWidth', maxWidth)
    }
    
    if (maxHeight) {
      formData.append('maxHeight', maxHeight)
    }

    try {
      const response = await api.value.post<ApiEnvelope<SingleConversionResponse>>(
        '/api/convert/single',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = progressEvent.total 
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0
            // 可以在这里触发进度事件
            console.log(`上传进度: ${progress}%`)
          }
        }
      )

      return response.data.data
    } catch (error) {
      console.error('单文件转换失败:', error)
      throw error
    }
  }

  // 批量文件转换
  const convertBatch = async (
    files: File[], 
    options: ConversionOptions
  ): Promise<BatchConversionResponse> => {
    if (!api.value) {
      throw new Error('API客户端未初始化')
    }

    // 验证文件数量
    if (files.length > 50) {
      throw new Error('一次最多转换50个文件')
    }

    // 验证总文件大小
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    const maxTotalSize = 500 * 1024 * 1024 // 500MB
    if (totalSize > maxTotalSize) {
      throw new Error(`总文件大小不能超过 ${formatFileSize(maxTotalSize)}`)
    }

    // 创建FormData
    const formData = new FormData()
    
    files.forEach((file, index) => {
      formData.append('files', file)
    })
    
    formData.append('quality', options.quality.toString())
    formData.append('keepMetadata', options.keepMetadata.toString())
    formData.append('outputFormat', options.outputFormat)
    
    const maxWidth = normalizeOptionalDimension(options.maxWidth)
    const maxHeight = normalizeOptionalDimension(options.maxHeight)

    if (maxWidth) {
      formData.append('maxWidth', maxWidth)
    }
    
    if (maxHeight) {
      formData.append('maxHeight', maxHeight)
    }

    try {
      const response = await api.value.post<ApiEnvelope<BatchConversionResponse>>(
        '/api/convert/batch',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = progressEvent.total 
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0
            console.log(`批量上传进度: ${progress}%`)
          }
        }
      )

      return response.data.data
    } catch (error) {
      console.error('批量转换失败:', error)
      throw error
    }
  }

  // 查询批量转换进度
  const getBatchProgress = async (batchId: string): Promise<BatchProgress> => {
    if (!api.value) {
      throw new Error('API客户端未初始化')
    }

    try {
      const response = await api.value.get<ApiEnvelope<BatchProgress>>(
        `/api/convert/batch/${batchId}/progress`
      )
      return response.data.data
    } catch (error) {
      console.error('查询转换进度失败:', error)
      throw error
    }
  }

  // 查询批量转换结果
  const getBatchResults = async (batchId: string): Promise<BatchResults> => {
    if (!api.value) {
      throw new Error('API客户端未初始化')
    }

    try {
      const response = await api.value.get<ApiEnvelope<BatchResults>>(
        `/api/convert/batch/${batchId}/results`
      )
      return response.data.data
    } catch (error) {
      console.error('查询转换结果失败:', error)
      throw error
    }
  }

  // 下载文件
  const downloadFile = async (url: string, filename: string): Promise<void> => {
    try {
      const absoluteUrl = toApiUrl(url)
      const response = await fetch(absoluteUrl)

      if (!response.ok) {
        throw new Error(`下载失败: ${response.status} ${response.statusText}`)
      }

      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      // 清理URL
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
    } catch (error) {
      console.error('文件下载失败:', error)
      throw error
    }
  }

  // 下载所有文件（打包）
  const downloadAll = async (batchId: string, filename: string = 'converted-images.zip'): Promise<void> => {
    if (!api.value) {
      throw new Error('API客户端未初始化')
    }

    try {
      const results = await getBatchResults(batchId)
      
      if (results.successful === 0) {
        throw new Error('没有可下载的文件')
      }

      // 如果服务器提供了打包下载链接，直接使用
      if (results.downloadAllUrl) {
        await downloadFile(results.downloadAllUrl, filename)
      } else {
        // 否则逐个下载
        console.warn('服务器未提供打包下载，将逐个下载文件')
        
        const successfulFiles = results.results.filter(r => r.status === 'success')
        
        for (const file of successfulFiles) {
          await downloadFile(file.url, file.convertedName)
          // 添加延迟，避免同时下载太多文件
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
    } catch (error) {
      console.error('批量下载失败:', error)
      throw error
    }
  }

  // 获取服务器信息
  const getServerInfo = async (): Promise<ServerInfoResponse> => {
    if (!api.value) {
      throw new Error('API客户端未初始化')
    }

    try {
      const response = await api.value.get('/api/health/detailed')
      return response.data
    } catch (error) {
      console.error('获取服务器信息失败:', error)
      throw error
    }
  }

  // 取消请求（使用AbortController）
  const createCancelToken = () => {
    return axios.CancelToken.source()
  }

  // 清理资源
  const cleanup = () => {
    // 可以在这里清理请求等资源
    isConnected.value = false
  }

  return {
    initialize,
    checkConnection,
    convertSingle,
    convertBatch,
    getBatchProgress,
    getBatchResults,
    downloadFile,
    downloadAll,
    getServerInfo,
    createCancelToken,
    cleanup,
    isConnected,
    serverUrl
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
