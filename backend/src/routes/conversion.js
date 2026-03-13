import express from 'express'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import { convertSingleFile, convertBatchFiles } from '../services/conversionService.js'
import { getBatch } from '../services/batchStore.js'
import { validateBatchId, validateFile, validateConversionOptions, validateFilename } from '../utils/validation.js'
import { ensureHeicInputSupport } from '../utils/sharpSupport.js'
import { setupUploadDir, cleanupTempFiles } from '../utils/fileUtils.js'
import path from 'path'

const router = express.Router()

function parseOptionalInteger(value) {
  if (value === undefined || value === null) {
    return undefined
  }

  const normalizedValue = String(value).trim()
  if (
    normalizedValue === '' ||
    normalizedValue.toLowerCase() === 'null' ||
    normalizedValue.toLowerCase() === 'undefined' ||
    normalizedValue.toLowerCase() === 'nan'
  ) {
    return undefined
  }

  const parsed = Number.parseInt(normalizedValue, 10)
  return Number.isNaN(parsed) ? value : parsed
}

// 配置multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = setupUploadDir()
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4()
    const extension = path.extname(file.originalname)
    const filename = `${uniqueId}${extension}`
    cb(null, filename)
  }
})

// 文件过滤
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.heic', '.heif', '.HEIC', '.HEIF']
  const ext = path.extname(file.originalname).toLowerCase()
  
  if (allowedTypes.includes(ext)) {
    cb(null, true)
  } else {
    cb(new Error(`不支持的文件类型: ${ext}。仅支持: ${allowedTypes.join(', ')}`), false)
  }
}

// 创建上传中间件
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 50 // 最多50个文件
  }
})

// 单文件转换
router.post('/single', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: '请选择一个HEIC/HEIF文件进行转换'
      })
    }

    // 验证文件
    validateFile(req.file)

    // 获取转换选项
    const options = {
      quality: parseInt(req.body.quality, 10) || 90,
      keepMetadata: req.body.keepMetadata !== 'false',
      outputFormat: req.body.outputFormat || 'jpeg',
      maxWidth: parseOptionalInteger(req.body.maxWidth),
      maxHeight: parseOptionalInteger(req.body.maxHeight)
    }

    validateConversionOptions(options)
    ensureHeicInputSupport()

    // 执行转换
    const result = await convertSingleFile(req.file, options)

    // 响应
    res.json({
      success: true,
      message: '文件转换成功',
      data: {
        original: {
          filename: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        },
        converted: {
          filename: result.filename,
          size: result.size,
          url: `/api/convert/download/${result.filename}`,
          downloadUrl: `/api/convert/download/${result.filename}`,
          format: result.format,
          width: result.width,
          height: result.height
        },
        options: options,
        conversionTime: result.conversionTime,
        timestamp: new Date().toISOString()
      }
    })

    // 清理临时文件（延迟执行）
    setTimeout(() => {
      cleanupTempFiles([req.file.path])
    }, 30000) // 30秒后清理

  } catch (error) {
    next(error)
  }
})

// 批量文件转换
router.post('/batch', upload.array('files', 50), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded',
        message: '请选择HEIC/HEIF文件进行批量转换'
      })
    }

    // 验证所有文件
    req.files.forEach(validateFile)

    // 获取转换选项
    const options = {
      quality: parseInt(req.body.quality, 10) || 90,
      keepMetadata: req.body.keepMetadata !== 'false',
      outputFormat: req.body.outputFormat || 'jpeg',
      maxWidth: parseOptionalInteger(req.body.maxWidth),
      maxHeight: parseOptionalInteger(req.body.maxHeight)
    }

    validateConversionOptions(options)
    ensureHeicInputSupport()

    // 生成批量转换ID
    const batchId = uuidv4()

    // 立即响应（异步处理）
    res.status(202).json({
      success: true,
      message: '批量转换任务已开始',
      data: {
        batchId,
        totalFiles: req.files.length,
        status: 'processing',
        progressUrl: `/api/convert/batch/${batchId}/progress`,
        resultsUrl: `/api/convert/batch/${batchId}/results`,
        estimatedTime: `${Math.ceil(req.files.length * 2)}秒`, // 粗略估计
        timestamp: new Date().toISOString()
      }
    })

    // 异步处理批量转换
    setTimeout(async () => {
      try {
        await convertBatchFiles(batchId, req.files, options)
      } catch (error) {
        console.error(`批量转换失败 (${batchId}):`, error)
      }
    }, 0)

  } catch (error) {
    next(error)
  }
})

// 批量转换进度查询
router.get('/batch/:batchId/progress', async (req, res, next) => {
  try {
    const { batchId } = req.params
    validateBatchId(batchId)

    const batch = getBatch(batchId)
    if (!batch) {
      return res.status(404).json({
        error: 'Batch not found',
        message: '批量任务不存在'
      })
    }

    res.json({
      success: true,
      message: '批量任务进度获取成功',
      data: {
        batchId,
        status: batch.status,
        progress: batch.progress,
        processed: batch.processed,
        total: batch.total,
        estimatedTimeRemaining: batch.estimatedTimeRemaining
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    next(error)
  }
})

// 批量转换结果查询
router.get('/batch/:batchId/results', async (req, res, next) => {
  try {
    const { batchId } = req.params
    validateBatchId(batchId)

    const batch = getBatch(batchId)
    if (!batch) {
      return res.status(404).json({
        error: 'Batch not found',
        message: '批量任务不存在'
      })
    }

    res.json({
      success: true,
      message: '批量任务结果获取成功',
      data: {
        batchId,
        status: batch.status === 'processing' ? 'completed' : batch.status,
        totalFiles: batch.total,
        successful: batch.successful,
        failed: batch.failed,
        results: batch.results,
        downloadAllUrl: batch.downloadAllUrl
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    next(error)
  }
})

// 文件下载
router.get('/download/:filename', (req, res, next) => {
  try {
    const { filename } = req.params
    validateFilename(filename)
    const filePath = path.join(setupUploadDir(), filename)

    // 设置下载头
    res.download(filePath, `converted-${filename}`, (err) => {
      if (err) {
        if (!res.headersSent) {
          next(err)
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

export default router
