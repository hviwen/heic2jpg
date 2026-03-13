/**
 * 全局错误处理中间件
 * @param {Error} err - 错误对象
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
export default function errorHandler(err, req, res, next) {
  console.error('错误详情:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  })

  // 默认错误响应
  let statusCode = 500
  let errorMessage = '服务器内部错误'
  let errorDetails = null

  // 根据错误类型设置状态码和消息
  if (err.name === 'ValidationError') {
    statusCode = 400
    errorMessage = '请求验证失败'
    errorDetails = err.message
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413
    errorMessage = '文件大小超过限制'
    errorDetails = err.message
  } else if (err.code === 'LIMIT_FILE_COUNT') {
    statusCode = 400
    errorMessage = '文件数量超过限制'
    errorDetails = err.message
  } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400
    errorMessage = '不支持的文件类型'
    errorDetails = err.message
  } else if (err.message.includes('不支持的文件类型')) {
    statusCode = 400
    errorMessage = '不支持的文件类型'
    errorDetails = err.message
  } else if (err.message.includes('文件大小不能超过')) {
    statusCode = 413
    errorMessage = '文件大小超过限制'
    errorDetails = err.message
  } else if (err.message.includes('未启用HEIC/HEIF解码支持')) {
    statusCode = 503
    errorMessage = '服务器暂不支持HEIC解码'
    errorDetails = err.message
  } else if (
    err.message.includes('图片质量必须在1-100之间') ||
    err.message.includes('最大宽度必须在1-10000之间') ||
    err.message.includes('最大高度必须在1-10000之间') ||
    err.message.includes('keepMetadata必须是布尔值') ||
    err.message.includes('不支持的输出格式')
  ) {
    statusCode = 400
    errorMessage = '请求参数错误'
    errorDetails = err.message
  } else if (err.message.includes('sharp') || err.message.includes('libheif')) {
    statusCode = 500
    errorMessage = '图片处理失败'
    errorDetails = 'HEIC转换库错误，请检查文件格式是否正确'
  } else if (err.message.includes('ENOENT') || err.message.includes('文件不存在')) {
    statusCode = 404
    errorMessage = '文件不存在'
    errorDetails = err.message
  } else if (err.message.includes('EACCES') || err.message.includes('权限拒绝')) {
    statusCode = 403
    errorMessage = '文件访问权限不足'
    errorDetails = err.message
  } else if (err.message.includes('ENOSPC') || err.message.includes('磁盘空间不足')) {
    statusCode = 507
    errorMessage = '磁盘空间不足'
    errorDetails = '服务器存储空间不足，请稍后重试'
  } else if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
    statusCode = err.statusCode
    errorMessage = err.message || '客户端错误'
    errorDetails = err.details
  }

  // 生产环境隐藏详细错误信息
  const isProduction = process.env.NODE_ENV === 'production'
  
  const errorResponse = {
    error: errorMessage,
    message: errorDetails || (isProduction ? null : err.message),
    path: req.url,
    timestamp: new Date().toISOString(),
    requestId: req.id || generateRequestId()
  }

  // 如果是开发环境，包含堆栈跟踪
  if (!isProduction && err.stack) {
    errorResponse.stack = err.stack.split('\n').slice(0, 5) // 只显示前5行
  }

  // 发送错误响应
  res.status(statusCode).json(errorResponse)

  // 记录错误到监控系统（如果存在）
  logErrorToMonitoring(err, req, statusCode)
}

/**
 * 生成请求ID
 * @returns {string} 请求ID
 */
function generateRequestId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

/**
 * 记录错误到监控系统
 * @param {Error} err - 错误对象
 * @param {Object} req - 请求对象
 * @param {number} statusCode - 状态码
 */
function logErrorToMonitoring(err, req, statusCode) {
  // 这里可以集成错误监控服务，如Sentry、LogRocket等
  const errorLog = {
    level: statusCode >= 500 ? 'error' : 'warn',
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer')
    },
    response: {
      statusCode
    },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  }

  // 在实际生产环境中，这里应该发送到错误监控服务
  // 例如：Sentry.captureException(err, { extra: errorLog })
  
  // 当前只是控制台记录
  if (statusCode >= 500) {
    console.error('服务器错误已记录:', errorLog)
  } else if (statusCode >= 400) {
    console.warn('客户端错误已记录:', errorLog)
  }
}

/**
 * 异步错误处理包装器
 * @param {Function} fn - 异步函数
 * @returns {Function} 包装后的函数
 */
export function asyncHandler(fn) {
  return function(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * 创建自定义错误类
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.details = details
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, details)
  }
}

export class NotFoundError extends AppError {
  constructor(message = '资源未找到', details = null) {
    super(message, 404, details)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = '未授权访问', details = null) {
    super(message, 401, details)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = '访问被禁止', details = null) {
    super(message, 403, details)
  }
}

export class RateLimitError extends AppError {
  constructor(message = '请求频率过高', details = null) {
    super(message, 429, details)
  }
}
