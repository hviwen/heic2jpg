import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import authRoutes from './routes/auth.js'
import conversionRoutes from './routes/conversion.js'
import healthRoutes from './routes/health.js'
import errorHandler from './middleware/errorHandler.js'
import { sessionMiddleware } from './middleware/session.js'
import { cleanupOldFiles, setupUploadDir } from './utils/fileUtils.js'
import { getDatabasePath } from './services/database.js'

// ES模块的 __dirname 替代方案
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001
const HOST = process.env.HOST || '0.0.0.0'
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)
const allowCredentials = process.env.CORS_CREDENTIALS !== 'false'
const uploadsDir = join(__dirname, '../uploads')
const tempDir = join(__dirname, '../temp')
const shouldCleanupOldFiles = process.env.CLEANUP_OLD_FILES !== 'false'
const fileRetentionHours = Number.parseInt(process.env.FILE_RETENTION_HOURS || '24', 10)
const cleanupIntervalHours = Number.parseInt(process.env.CLEANUP_INTERVAL_HOURS || '1', 10)

// 确保上传目录存在
setupUploadDir()
app.set('trust proxy', 1)

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true)
      return
    }

    if (corsOrigins.includes(origin)) {
      callback(null, origin)
      return
    }

    callback(new Error(`CORS origin not allowed: ${origin}`))
  },
  credentials: allowCredentials,
  optionsSuccessStatus: 200
}

// 中间件
app.use(cors(corsOptions))
app.options(/.*/, cors(corsOptions))
app.use((req, res, next) => {
  const requestOrigin = req.headers.origin

  if (requestOrigin && corsOrigins.includes(requestOrigin)) {
    res.header('Access-Control-Allow-Origin', requestOrigin)
    res.header('Vary', 'Origin')
  }

  if (allowCredentials) {
    res.header('Access-Control-Allow-Credentials', 'true')
  }

  next()
})

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(sessionMiddleware)
app.use((req, res, next) => {
  const startedAt = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - startedAt
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`)
  })
  next()
})

// 路由
app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/convert', conversionRoutes)

// 根路由
app.get('/', (req, res) => {
  res.json({
    service: 'HEIC2JPG Conversion API',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      health: '/api/health',
      auth: {
        session: 'GET /api/auth/session',
        googleStart: 'GET /api/auth/google/start',
        logout: 'POST /api/auth/logout'
      },
      convert: {
        single: 'POST /api/convert/single',
        batch: 'POST /api/convert/batch',
        status: 'GET /api/convert/status/:id'
      }
    }
  })
})

// 404处理
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`
  })
})

// 错误处理中间件
app.use(errorHandler)

export function startServer({ port = PORT, host = HOST } = {}) {
  const server = app.listen(port, host, () => {
    console.log(`🚀 HEIC2JPG API 服务已启动`)
    console.log(`📡 本地地址: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`)
    console.log(`📁 上传目录: ${uploadsDir}`)
    console.log(`🗄️ 数据库文件: ${getDatabasePath()}`)
    console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`)
  })

  let cleanupTimer = null
  if (shouldCleanupOldFiles) {
    cleanupTimer = setInterval(() => {
      void cleanupOldFiles(uploadsDir, fileRetentionHours)
      void cleanupOldFiles(tempDir, fileRetentionHours)
    }, cleanupIntervalHours * 60 * 60 * 1000)
  }

  const stop = () =>
    new Promise((resolve) => {
      if (cleanupTimer) {
        clearInterval(cleanupTimer)
      }
      server.close(() => resolve())
    })

  return { server, stop }
}

const isDirectExecution = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]

if (isDirectExecution) {
  const { stop } = startServer()

  process.on('SIGTERM', () => {
    console.log('SIGTERM received: 正在优雅关闭...')
    void stop().then(() => process.exit(0))
  })

  process.on('SIGINT', () => {
    console.log('SIGINT received: 正在关闭...')
    void stop().then(() => process.exit(0))
  })
}

export default app
