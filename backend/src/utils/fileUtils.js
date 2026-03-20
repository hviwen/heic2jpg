import fs from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const BACKEND_ROOT = path.resolve(__dirname, '../..')

// 上传目录路径
const UPLOAD_DIR = path.resolve(BACKEND_ROOT, process.env.UPLOAD_DIR || './uploads')
const TEMP_DIR = path.resolve(BACKEND_ROOT, process.env.TEMP_DIR || './temp')

export function getUploadDir() {
  return UPLOAD_DIR
}

export function getTempDir() {
  return TEMP_DIR
}

/**
 * 设置上传目录，确保目录存在
 * @returns {string} 上传目录路径
 */
export function setupUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true })
  }

  if (!existsSync(TEMP_DIR)) {
    mkdirSync(TEMP_DIR, { recursive: true })
  }

  return UPLOAD_DIR
}

/**
 * 清理临时文件
 * @param {Array<string>} filePaths - 要清理的文件路径数组
 */
export async function cleanupTempFiles(filePaths) {
  try {
    const cleanupPromises = filePaths.map(async (filePath) => {
      try {
        await fs.unlink(filePath)
        console.log(`已清理临时文件: ${path.basename(filePath)}`)
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.warn(`清理文件失败 ${filePath}:`, error.message)
        }
      }
    })
    
    await Promise.allSettled(cleanupPromises)
  } catch (error) {
    console.error('清理临时文件时出错:', error)
  }
}

/**
 * 清理旧文件（基于创建时间）
 * @param {string} directory - 要清理的目录
 * @param {number} maxAgeHours - 最大年龄（小时）
 */
export async function cleanupOldFiles(directory, maxAgeHours = 24) {
  try {
    const files = await fs.readdir(directory)
    const now = Date.now()
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000
    
    const cleanupPromises = files.map(async (filename) => {
      try {
        const filePath = path.join(directory, filename)
        const stats = await fs.stat(filePath)
        const fileAge = now - stats.birthtimeMs
        
        if (fileAge > maxAgeMs) {
          await fs.unlink(filePath)
          console.log(`已清理旧文件: ${filename} (${Math.round(fileAge / (1000 * 60 * 60))}小时前)`)
        }
      } catch (error) {
        // 忽略文件不存在等错误
        if (error.code !== 'ENOENT') {
          console.warn(`清理旧文件失败 ${filename}:`, error.message)
        }
      }
    })
    
    await Promise.allSettled(cleanupPromises)
    console.log(`完成清理 ${directory} 目录中的旧文件`)
  } catch (error) {
    console.error(`清理目录 ${directory} 时出错:`, error)
  }
}

/**
 * 获取文件信息
 * @param {string} filePath - 文件路径
 * @returns {Promise<Object>} 文件信息
 */
export async function getFileInfo(filePath) {
  try {
    const stats = await fs.stat(filePath)
    const extension = path.extname(filePath).toLowerCase()
    
    return {
      filename: path.basename(filePath),
      extension,
      size: stats.size,
      sizeFormatted: formatFileSize(stats.size),
      created: stats.birthtime,
      modified: stats.mtime,
      isDirectory: stats.isDirectory()
    }
  } catch (error) {
    throw new Error(`无法获取文件信息: ${error.message}`)
  }
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的文件大小
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 检查文件类型是否支持
 * @param {string} filename - 文件名
 * @returns {boolean} 是否支持
 */
export function isSupportedFileType(filename) {
  const supportedExtensions = ['.heic', '.heif', '.HEIC', '.HEIF']
  const extension = path.extname(filename)
  return supportedExtensions.includes(extension)
}

/**
 * 生成安全的文件名
 * @param {string} originalName - 原始文件名
 * @returns {string} 安全文件名
 */
export function generateSafeFilename(originalName) {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = path.extname(originalName)
  const nameWithoutExt = path.basename(originalName, extension)
  
  // 移除不安全字符，保留中文、字母、数字、下划线、连字符
  const safeName = nameWithoutExt
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_')
    .substring(0, 50) // 限制长度
    
  return `${safeName}_${timestamp}_${random}${extension}`
}

/**
 * 检查磁盘空间
 * @param {string} directory - 目录路径
 * @param {number} requiredBytes - 所需字节数
 * @returns {Promise<boolean>} 是否有足够空间
 */
export async function hasEnoughSpace(directory, requiredBytes) {
  try {
    const stats = await fs.statfs?.(directory) || await getDiskUsageFallback(directory)
    const freeBytes = stats.bavail * stats.bsize
    return freeBytes > requiredBytes * 2 // 保留2倍空间作为缓冲
  } catch (error) {
    console.warn('无法检查磁盘空间:', error)
    return true // 如果无法检查，假设有足够空间
  }
}

/**
 * 磁盘使用情况回退方案（如果statfs不可用）
 */
async function getDiskUsageFallback(directory) {
  // 简化的回退方案
  return {
    bavail: 1000000, // 假设有1GB可用
    bsize: 4096
  }
}
