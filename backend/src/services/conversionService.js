import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { cleanupTempFiles, hasEnoughSpace, setupUploadDir } from '../utils/fileUtils.js'
import { createBatch, updateBatch } from './batchStore.js'

// 增强sharp以支持HEIC（如果系统安装了libheif）
sharp.concurrency(2) // 限制并发数，避免内存溢出

const DEFAULT_QUALITY = 82
const MIN_OUTPUT_BYTES = 64 * 1024

function normalizeOutputFormat(format = 'jpeg') {
  const normalized = String(format).toLowerCase()

  if (normalized === 'jpg' || normalized === 'jpeg') {
    return 'jpeg'
  }

  if (normalized === 'png' || normalized === 'webp') {
    return normalized
  }

  return 'jpeg'
}

function getOutputExtension(format) {
  return normalizeOutputFormat(format) === 'jpeg' ? 'jpg' : normalizeOutputFormat(format)
}

function getDownloadFilename(originalName, format) {
  const baseName = originalName.replace(/\.[^.]+$/, '')
  const extension = getOutputExtension(format).toUpperCase()
  return `${baseName}.${extension}`
}

function clampQuality(quality) {
  const numericQuality = Number.parseInt(quality, 10)
  if (Number.isNaN(numericQuality)) {
    return DEFAULT_QUALITY
  }

  return Math.min(Math.max(numericQuality, 1), 100)
}

function getTargetDimensions(metadata, options, scale = 1) {
  const originalWidth = metadata.width
  const originalHeight = metadata.height

  if (!originalWidth || !originalHeight) {
    return {
      width: options.maxWidth,
      height: options.maxHeight
    }
  }

  let width = originalWidth
  let height = originalHeight
  const hasUserBounds = Boolean(options.maxWidth || options.maxHeight)

  if (hasUserBounds) {
    const widthRatio = options.maxWidth ? options.maxWidth / width : Number.POSITIVE_INFINITY
    const heightRatio = options.maxHeight ? options.maxHeight / height : Number.POSITIVE_INFINITY
    const resizeRatio = Math.min(widthRatio, heightRatio, 1)
    width = Math.max(1, Math.round(width * resizeRatio))
    height = Math.max(1, Math.round(height * resizeRatio))
  }

  if (scale < 1) {
    width = Math.max(1, Math.round(width * scale))
    height = Math.max(1, Math.round(height * scale))
  }

  return { width, height }
}

function createPipeline(inputPath, options, metadata, scale = 1) {
  let pipeline = sharp(inputPath).rotate()

  if (options.keepMetadata) {
    pipeline = pipeline.withMetadata()
  }

  const dimensions = getTargetDimensions(metadata, options, scale)

  if (dimensions.width || dimensions.height) {
    pipeline = pipeline.resize({
      width: dimensions.width,
      height: dimensions.height,
      fit: 'inside',
      withoutEnlargement: true
    })
  }

  return pipeline
}

async function renderBuffer(inputPath, options, metadata, format, quality, scale = 1) {
  const pipeline = createPipeline(inputPath, options, metadata, scale)

  if (format === 'png') {
    return pipeline
      .png({
        compressionLevel: 9,
        palette: true,
        effort: 10
      })
      .toBuffer()
  }

  if (format === 'webp') {
    return pipeline
      .webp({
        quality,
        effort: 6
      })
      .toBuffer()
  }

  return pipeline
    .jpeg({
      quality,
      mozjpeg: true,
      progressive: true,
      chromaSubsampling: '4:2:0'
    })
    .toBuffer()
}

async function convertWithinSizeBudget(file, options) {
  const outputFormat = normalizeOutputFormat(options.outputFormat)
  const quality = clampQuality(options.quality)
  const originalMetadata = await sharp(file.path).metadata()
  const maxOutputSize = Math.max(file.size * 2, MIN_OUTPUT_BYTES)
  const qualityStops =
    outputFormat === 'png'
      ? [quality]
      : Array.from(new Set([quality, Math.min(quality, 76), 68, 60, 52, 44].filter(Boolean)))
  const scaleStops = [1, 0.94, 0.88, 0.82, 0.76, 0.7, 0.62, 0.54, 0.46]

  let bestBuffer = null
  let bestMetadata = null

  for (const scale of scaleStops) {
    for (const qualityStop of qualityStops) {
      const buffer = await renderBuffer(file.path, options, originalMetadata, outputFormat, qualityStop, scale)

      if (!bestBuffer || buffer.byteLength < bestBuffer.byteLength) {
        bestBuffer = buffer
        bestMetadata = await sharp(buffer).metadata()
      }

      if (buffer.byteLength <= maxOutputSize) {
        return {
          buffer,
          metadata: await sharp(buffer).metadata(),
          format: outputFormat
        }
      }
    }
  }

  return {
    buffer: bestBuffer,
    metadata: bestMetadata,
    format: outputFormat
  }
}

/**
 * 转换单个HEIC/HEIF文件为JPEG
 * @param {Object} file - Multer文件对象
 * @param {Object} options - 转换选项
 * @returns {Promise<Object>} 转换结果
 */
export async function convertSingleFile(file, options) {
  const startTime = Date.now()
  
  try {
    console.log(`开始转换文件: ${file.originalname}`)
    
    // 生成输出文件名
    const outputFormat = normalizeOutputFormat(options.outputFormat)
    const outputFilename = `${uuidv4()}.${getOutputExtension(outputFormat)}`
    const outputPath = path.join(setupUploadDir(), outputFilename)
    const enoughSpace = await hasEnoughSpace(path.dirname(outputPath), file.size)
    if (!enoughSpace) {
      throw new Error('磁盘空间不足')
    }
    const resultBuffer = await convertWithinSizeBudget(file, options)
    await fs.writeFile(outputPath, resultBuffer.buffer)
    
    // 获取转换后的文件信息
    const outputStats = await fs.stat(outputPath)
    const metadata = resultBuffer.metadata || (await sharp(outputPath).metadata())
    
    const conversionTime = Date.now() - startTime
    
    console.log(`转换完成: ${file.originalname} -> ${outputFilename} (${conversionTime}ms)`)
    
    return {
      filename: outputFilename,
      downloadName: getDownloadFilename(file.originalname, outputFormat),
      path: outputPath,
      size: outputStats.size,
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      conversionTime
    }
    
  } catch (error) {
    console.error(`转换失败: ${file.originalname}`, error)
    throw new Error(`文件转换失败: ${error.message}`)
  }
}

/**
 * 批量转换多个HEIC/HEIF文件
 * @param {string} batchId - 批量转换ID
 * @param {Array} files - Multer文件对象数组
 * @param {Object} options - 转换选项
 * @returns {Promise<Object>} 批量转换结果
 */
export async function convertBatchFiles(batchId, files, options) {
  console.log(`开始批量转换 (${batchId}): ${files.length} 个文件`)
  createBatch(batchId, files.length)

  const results = []
  const failedFiles = []
  
  // 限制并发数，避免内存溢出
  const concurrencyLimit = 3
  const processingQueue = []
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    
    // 如果达到并发限制，等待一个任务完成
    if (processingQueue.length >= concurrencyLimit) {
      await Promise.race(processingQueue)
    }
    
    // 开始转换任务
    const task = convertSingleFile(file, options)
      .then(result => {
        const successResult = {
          originalName: file.originalname,
          convertedName: path.basename(result.filename),
          downloadName: result.downloadName,
          status: 'success',
          size: result.size,
          url: `/api/convert/download/${result.filename}`,
          width: result.width,
          height: result.height,
          conversionTime: result.conversionTime
        }
        results.push(successResult)
        updateBatch(batchId, batch => {
          batch.results.push(successResult)
          batch.processed += 1
          batch.successful += 1
          batch.progress = Math.round((batch.processed / batch.total) * 100)
          batch.estimatedTimeRemaining = `${Math.max(batch.total - batch.processed, 0) * 2}秒`
        })
        console.log(`批量转换进度 (${batchId}): ${results.length + failedFiles.length}/${files.length}`)
      })
      .catch(error => {
        const failedResult = {
          originalName: file.originalname,
          error: error.message,
          status: 'failed'
        }
        failedFiles.push(failedResult)
        updateBatch(batchId, batch => {
          batch.results.push(failedResult)
          batch.processed += 1
          batch.failed += 1
          batch.progress = Math.round((batch.processed / batch.total) * 100)
          batch.estimatedTimeRemaining = `${Math.max(batch.total - batch.processed, 0) * 2}秒`
        })
        console.error(`批量转换失败 (${batchId}): ${file.originalname}`, error.message)
      })
      .finally(() => {
        // 从处理队列中移除
        const index = processingQueue.indexOf(task)
        if (index > -1) {
          processingQueue.splice(index, 1)
        }
      })
    
    processingQueue.push(task)
  }
  
  // 等待所有任务完成
  await Promise.allSettled(processingQueue)
  
  // 准备输出ZIP文件（如果需要）
  let zipUrl = null
  if (results.length > 0) {
    try {
      zipUrl = await createZipFile(batchId, results)
    } catch (error) {
      console.error(`创建ZIP文件失败 (${batchId}):`, error)
    }
  }
  
  // 清理临时文件
  const tempPaths = files.map(file => file.path)
  setTimeout(() => {
    cleanupTempFiles(tempPaths)
  }, 60000) // 1分钟后清理
  
  console.log(`批量转换完成 (${batchId}): ${results.length} 成功, ${failedFiles.length} 失败`)
  const finalResult = {
    batchId,
    totalFiles: files.length,
    successful: results.length,
    failed: failedFiles.length,
    results,
    failedFiles,
    zipUrl,
    completedAt: new Date().toISOString()
  }

  updateBatch(batchId, batch => {
    batch.status = failedFiles.length === files.length ? 'failed' : 'completed'
    batch.progress = 100
    batch.downloadAllUrl = zipUrl
  })

  return finalResult
}

/**
 * 创建ZIP文件包含所有转换结果
 * @param {string} batchId - 批量转换ID
 * @param {Array} results - 转换结果数组
 * @returns {Promise<string|null>} ZIP文件URL
 */
async function createZipFile(batchId, results) {
  // 注意：在实际生产环境中，应该使用像archiver或jszip这样的库
  // 这里返回null表示此功能暂未实现
  console.log(`ZIP功能暂未实现，批量ID: ${batchId}`)
  return null
}

/**
 * 验证HEIC文件是否可以转换
 * @param {string} filePath - 文件路径
 * @returns {Promise<boolean>} 是否可转换
 */
export async function validateHeicFile(filePath) {
  try {
    const metadata = await sharp(filePath).metadata()
    return metadata.format === 'heif' || metadata.format === 'heic'
  } catch (error) {
    // 如果sharp无法读取，可能是无效的HEIC文件
    return false
  }
}

/**
 * 获取HEIC文件信息
 * @param {string} filePath - 文件路径
 * @returns {Promise<Object>} 文件信息
 */
export async function getHeicMetadata(filePath) {
  try {
    const metadata = await sharp(filePath).metadata()
    return {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      size: (await fs.stat(filePath)).size,
      hasAlpha: metadata.hasAlpha,
      hasProfile: metadata.hasProfile,
      orientation: metadata.orientation,
      exif: metadata.exif ? '包含' : '无'
    }
  } catch (error) {
    throw new Error(`无法读取文件元数据: ${error.message}`)
  }
}
