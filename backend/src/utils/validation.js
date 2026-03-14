/**
 * 验证上传的文件
 * @param {Object} file - Multer文件对象
 * @throws {Error} 如果验证失败
 */
export function validateFile(file) {
  if (!file) {
    throw new Error('文件不能为空')
  }

  // 检查文件大小（最大30MB）
  const maxSize = 30 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error(`文件大小不能超过 ${formatFileSize(maxSize)}`)
  }

  // 检查文件类型
  const allowedTypes = [
    'image/heic',
    'image/heif',
    'image/heic-sequence',
    'image/heif-sequence',
    'application/octet-stream' // 有些HEIC文件可能没有正确的MIME类型
  ]

  const allowedExtensions = ['.heic', '.heif', '.HEIC', '.HEIF']
  const fileExtension = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase()

  if (!allowedExtensions.includes(fileExtension) && 
      !allowedTypes.includes(file.mimetype?.toLowerCase())) {
    throw new Error(`不支持的文件类型。支持: ${allowedExtensions.join(', ')}`)
  }

  // 检查文件名长度
  if (file.originalname.length > 255) {
    throw new Error('文件名过长（最大255字符）')
  }

  // 检查文件名是否包含危险字符
  const dangerousChars = /[<>:"/\\|?*\x00-\x1F]/g
  if (dangerousChars.test(file.originalname)) {
    throw new Error('文件名包含非法字符')
  }
}

/**
 * 验证转换选项
 * @param {Object} options - 转换选项
 * @throws {Error} 如果验证失败
 */
export function validateConversionOptions(options) {
  // 验证质量
  if (options.quality !== undefined) {
    const quality = parseInt(options.quality)
    if (isNaN(quality) || quality < 1 || quality > 100) {
      throw new Error('图片质量必须在1-100之间')
    }
  }

  // 验证输出格式
  const allowedFormats = ['jpeg', 'jpg', 'png', 'webp']
  if (options.outputFormat && !allowedFormats.includes(options.outputFormat.toLowerCase())) {
    throw new Error(`不支持的输出格式。支持: ${allowedFormats.join(', ')}`)
  }

  // 验证最大尺寸
  if (!isOptionalValueUnset(options.maxWidth)) {
    const maxWidth = parseInt(String(options.maxWidth).trim(), 10)
    if (isNaN(maxWidth) || maxWidth < 1 || maxWidth > 10000) {
      throw new Error('最大宽度必须在1-10000之间')
    }
  }

  if (!isOptionalValueUnset(options.maxHeight)) {
    const maxHeight = parseInt(String(options.maxHeight).trim(), 10)
    if (isNaN(maxHeight) || maxHeight < 1 || maxHeight > 10000) {
      throw new Error('最大高度必须在1-10000之间')
    }
  }

  // 验证元数据选项
  if (options.keepMetadata !== undefined && typeof options.keepMetadata !== 'boolean') {
    throw new Error('keepMetadata必须是布尔值')
  }
}

/**
 * 验证批量转换请求
 * @param {Array} files - 文件数组
 * @param {Object} options - 转换选项
 * @throws {Error} 如果验证失败
 */
export function validateBatchRequest(files, options) {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('请选择要转换的文件')
  }

  // 检查文件数量
  const maxFiles = 80
  if (files.length > maxFiles) {
    throw new Error(`一次最多转换 ${maxFiles} 个文件`)
  }

  // 检查总文件大小
  const maxTotalSize = 500 * 1024 * 1024 // 500MB
  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  if (totalSize > maxTotalSize) {
    throw new Error(`总文件大小不能超过 ${formatFileSize(maxTotalSize)}`)
  }

  // 验证每个文件
  files.forEach(validateFile)

  // 验证选项
  validateConversionOptions(options)
}

/**
 * 验证批量转换ID
 * @param {string} batchId - 批量转换ID
 * @throws {Error} 如果验证失败
 */
export function validateBatchId(batchId) {
  if (!batchId) {
    throw new Error('批量转换ID不能为空')
  }

  // UUID格式验证（简化版本）
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(batchId)) {
    throw new Error('无效的批量转换ID格式')
  }
}

/**
 * 验证文件名（防止目录遍历攻击）
 * @param {string} filename - 文件名
 * @throws {Error} 如果验证失败
 */
export function validateFilename(filename) {
  if (!filename) {
    throw new Error('文件名不能为空')
  }

  // 只允许字母、数字、连字符、下划线和点
  const safeRegex = /^[a-zA-Z0-9_.-]+$/
  if (!safeRegex.test(filename)) {
    throw new Error('文件名包含非法字符')
  }

  // 防止目录遍历
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw new Error('文件名不能包含路径字符')
  }

  // 检查文件扩展名
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp']
  const extension = filename.substring(filename.lastIndexOf('.')).toLowerCase()
  if (!allowedExtensions.includes(extension)) {
    throw new Error(`不支持的文件扩展名。支持: ${allowedExtensions.join(', ')}`)
  }
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的文件大小
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function isOptionalValueUnset(value) {
  if (value === undefined || value === null) {
    return true
  }

  const normalizedValue = String(value).trim().toLowerCase()
  return normalizedValue === '' || normalizedValue === 'null' || normalizedValue === 'undefined' || normalizedValue === 'nan'
}

/**
 * 验证API密钥（如果需要）
 * @param {string} apiKey - API密钥
 * @throws {Error} 如果验证失败
 */
export function validateApiKey(apiKey) {
  // 在实际生产环境中，这里应该验证API密钥
  // 例如：检查数据库、Redis等
  if (process.env.REQUIRE_API_KEY === 'true' && !apiKey) {
    throw new Error('API密钥不能为空')
  }
  
  // 简单的密钥格式检查
  if (apiKey && apiKey.length < 16) {
    throw new Error('API密钥长度不足')
  }
}

/**
 * 验证请求限制
 * @param {string} clientId - 客户端ID
 * @param {number} requestCount - 请求计数
 * @throws {Error} 如果超过限制
 */
export function validateRateLimit(clientId, requestCount) {
  const maxRequestsPerHour = 100 // 每小时最大请求数
  
  if (requestCount > maxRequestsPerHour) {
    throw new Error(`请求频率过高。每小时最多 ${maxRequestsPerHour} 次请求`)
  }
}
