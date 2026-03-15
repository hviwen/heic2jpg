/**
 * 文件处理工具函数
 */

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的文件大小字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 获取文件扩展名
 * @param filename 文件名
 * @returns 文件扩展名（小写）
 */
export function getFileExtension(filename: string): string {
  return filename.substring(filename.lastIndexOf('.')).toLowerCase()
}

export function getOutputExtension(format: 'jpeg' | 'png' | 'webp'): string {
  if (format === 'jpeg') {
    return 'JPG'
  }

  return format.toUpperCase()
}

export function getConvertedFilename(originalName: string, format: 'jpeg' | 'png' | 'webp'): string {
  const extension = getOutputExtension(format)
  const nameWithoutExt = originalName.replace(/\.[^.]+$/, '')
  return `${nameWithoutExt}.${extension}`
}

/**
 * 检查文件是否是HEIC/HEIF格式
 * @param file 文件对象
 * @returns 是否是HEIC/HEIF文件
 */
export function isHeicFile(file: File): boolean {
  const allowedTypes = [
    'image/heic',
    'image/heif',
    'image/heic-sequence',
    'image/heif-sequence'
  ]

  const allowedExtensions = ['.heic', '.heif', '.HEIC', '.HEIF']
  const extension = getFileExtension(file.name)

  return allowedExtensions.includes(extension) || allowedTypes.includes(file.type)
}

/**
 * 生成安全的文件名
 * @param originalName 原始文件名
 * @param extension 新扩展名（可选）
 * @returns 安全文件名
 */
export function generateSafeFilename(originalName: string, extension?: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const originalExt = getFileExtension(originalName)
  const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'))
  
  // 移除不安全字符，保留中文、字母、数字、下划线、连字符
  const safeName = nameWithoutExt
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_')
    .substring(0, 100) // 限制长度
  
  const finalExtension = extension || originalExt
  
  return `${safeName}_${timestamp}_${random}${finalExtension}`
}

/**
 * 创建文件下载
 * @param blob 文件Blob对象
 * @param filename 文件名
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  
  // 清理URL
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * 批量下载文件
 * @param files 文件数组，每个元素包含blob和filename
 */
export async function downloadFiles(files: Array<{ blob: Blob, filename: string }>): Promise<void> {
  if (files.length === 0) return
  
  // 如果只有一个文件，直接下载
  if (files.length === 1) {
    const [singleFile] = files
    if (singleFile) {
      downloadFile(singleFile.blob, singleFile.filename)
    }
    return
  }
  
  // 多个文件，使用JSZip打包下载
  try {
    const JSZip = await import('jszip')
    const zip = new JSZip.default()
    
    // 添加所有文件到zip
    files.forEach((file, index) => {
      zip.file(file.filename, file.blob)
    })
    
    // 生成zip文件
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    })
    
    // 下载zip文件
    downloadFile(zipBlob, `heic-converted-${Date.now()}.zip`)
  } catch (error) {
    console.error('创建ZIP文件失败，将逐个下载:', error)
    
    // 如果JSZip失败，逐个下载
    for (const file of files) {
      downloadFile(file.blob, file.filename)
      // 添加延迟，避免同时下载太多文件
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
}

/**
 * 读取文件为DataURL
 * @param file 文件对象
 * @returns DataURL字符串
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      resolve(reader.result as string)
    }
    
    reader.onerror = () => {
      reject(new Error('读取文件失败'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * 读取文件为ArrayBuffer
 * @param file 文件对象
 * @returns ArrayBuffer
 */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      resolve(reader.result as ArrayBuffer)
    }
    
    reader.onerror = () => {
      reject(new Error('读取文件失败'))
    }
    
    reader.readAsArrayBuffer(file)
  })
}

/**
 * 创建图片缩略图
 * @param file 图片文件
 * @param maxWidth 最大宽度
 * @param maxHeight 最大高度
 * @returns 缩略图DataURL
 */
export async function createThumbnail(
  file: File, 
  maxWidth: number = 200, 
  maxHeight: number = 200
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      reject(new Error('无法创建画布上下文'))
      return
    }
    
    img.onload = () => {
      // 计算缩略图尺寸
      let width = img.width
      let height = img.height
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }
      
      // 设置画布尺寸
      canvas.width = width
      canvas.height = height
      
      // 绘制缩略图
      ctx.drawImage(img, 0, 0, width, height)
      
      // 转换为DataURL
      const dataURL = canvas.toDataURL('image/jpeg', 0.7)
      resolve(dataURL)
    }
    
    img.onerror = () => {
      reject(new Error('加载图片失败'))
    }
    
    // 创建图片URL
    const url = URL.createObjectURL(file)
    img.src = url
    
    // 清理URL
    img.onload = () => URL.revokeObjectURL(url)
  })
}

/**
 * 验证文件大小
 * @param file 文件对象
 * @param maxSizeMB 最大大小（MB）
 * @returns 是否有效
 */
export function validateFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

/**
 * 验证文件类型
 * @param file 文件对象
 * @param allowedTypes 允许的MIME类型数组
 * @param allowedExtensions 允许的文件扩展名数组
 * @returns 是否有效
 */
export function validateFileType(
  file: File, 
  allowedTypes: string[] = [], 
  allowedExtensions: string[] = []
): boolean {
  // 检查MIME类型
  if (allowedTypes.length > 0 && file.type) {
    const fileType = file.type.toLowerCase()
    if (allowedTypes.some(type => fileType.includes(type))) {
      return true
    }
  }
  
  // 检查文件扩展名
  if (allowedExtensions.length > 0) {
    const extension = getFileExtension(file.name)
    if (allowedExtensions.includes(extension.toLowerCase())) {
      return true
    }
  }
  
  return false
}

/**
 * 获取文件图标
 * @param filename 文件名
 * @returns 图标名称
 */
export function getFileIcon(filename: string): string {
  const extension = getFileExtension(filename)
  
  switch (extension) {
    case '.heic':
    case '.heif':
      return 'PhotoIcon'
    case '.jpg':
    case '.jpeg':
    case '.png':
    case '.webp':
      return 'PhotoIcon'
    case '.zip':
      return 'ArchiveBoxIcon'
    default:
      return 'DocumentIcon'
  }
}

/**
 * 延迟函数
 * @param ms 延迟毫秒数
 * @returns Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 防抖函数
 * @param fn 原函数
 * @param delay 延迟时间
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T, 
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

/**
 * 节流函数
 * @param fn 原函数
 * @param limit 限制时间
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T, 
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}
