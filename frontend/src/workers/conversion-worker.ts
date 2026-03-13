/**
 * HEIC/HEIF转换Web Worker
 * 在后台线程中进行图像解码和编码，避免阻塞主线程
 */

// 导入libheif-js的WASM版本（Vite会自动处理WASM加载）
// @ts-ignore - libheif-js没有完整的TypeScript类型定义
import libheif from 'libheif-js/wasm-bundle'

// 定义Worker消息类型
interface WorkerMessage {
  type: 'convert' | 'cancel' | 'init'
  data?: ConvertMessageData
  id?: string
}

interface ConvertMessageData {
  file?: File
  buffer?: ArrayBuffer
  options: {
    quality: number
    outputFormat: 'jpeg' | 'png' | 'webp'
    maxWidth?: number
    maxHeight?: number
    keepMetadata?: boolean
  }
  conversionId: string
}

// Worker状态
let currentConversionId: string | null = null
let isConverting = false

// 发送进度更新
function sendProgress(progress: number, conversionId: string) {
  self.postMessage({
    type: 'progress',
    data: { progress, conversionId }
  })
}

// 发送转换完成消息
function sendComplete(blob: Blob, width: number, height: number, conversionTime: number, conversionId: string) {
  self.postMessage({
    type: 'complete',
    data: {
      blob,
      width,
      height,
      conversionTime,
      conversionId
    }
  })
}

// 发送错误消息
function sendError(error: string, conversionId: string) {
  self.postMessage({
    type: 'error',
    data: { error, conversionId }
  })
}

// 验证输入缓冲区是否是有效的HEIC文件
function isValidHeicBuffer(buffer: ArrayBuffer): boolean {
  // HEIC文件以ftyp盒子开头
  if (buffer.byteLength < 12) return false
  
  const view = new DataView(buffer)
  
  // 检查文件大小
  const fileSize = view.getUint32(0, false)
  if (fileSize !== 0 && fileSize !== buffer.byteLength) {
    // 文件大小可能不是第一个字段，但如果是有效文件，它应该匹配或为0
  }
  
  // 检查ftyp盒子
  const ftypBox = view.getUint32(4, false)
  if (ftypBox !== 0x66747970) return false // 'ftyp'的ASCII值
  
  // 检查HEIC品牌
  const majorBrand = view.getUint32(8, false)
  
  // HEIC/HEIF品牌
  const validBrands = [
    0x68656963, // 'heic'
    0x68656966, // 'heif'
    0x6d696631, // 'mif1' (HEIF)
    0x6d736631, // 'msf1' (HEIF sequence)
    0x61766963, // 'avic'
    0x61766966  // 'avif'
  ]
  
  return validBrands.includes(majorBrand)
}

// 解码HEIC文件
async function decodeHeic(buffer: ArrayBuffer): Promise<{
  width: number
  height: number
  data: Uint8ClampedArray
  metadata?: any
}> {
  try {
    // 创建解码器实例
    const decoder = new libheif.HeifDecoder()
    
    // 解码HEIC文件
    const decodedData = decoder.decode(buffer)
    
    if (!decodedData || decodedData.length === 0) {
      throw new Error('无法解码HEIC文件：没有找到图像数据')
    }
    
    // 获取第一个图像（主图像）
    const image = decodedData[0]
    const width = image.get_width()
    const height = image.get_height()
    
    if (width <= 0 || height <= 0) {
      throw new Error(`无效的图像尺寸：${width}x${height}`)
    }
    
    // 分配像素数据缓冲区
    const pixelData = new Uint8ClampedArray(width * height * 4)
    
    // 显示图像（解码为RGBA）
    const result = await new Promise<{ data: Uint8ClampedArray; width: number; height: number }>(
      (resolve, reject) => {
        image.display(
          { data: pixelData, width, height },
          (displayData: { data: Uint8ClampedArray; width: number; height: number } | undefined) => {
            if (!displayData) {
              reject(new Error('HEIC显示失败'))
            } else {
              resolve(displayData)
            }
          }
        )
      }
    )
    
    // 尝试获取元数据
    let metadata = {}
    try {
      // 这里可以添加元数据提取逻辑
      // libheif-js目前对元数据的支持有限
    } catch (metadataError) {
      console.warn('无法提取元数据:', metadataError)
    }
    
    return {
      width: result.width,
      height: result.height,
      data: result.data,
      metadata
    }
  } catch (error) {
    console.error('HEIC解码错误:', error)
    throw new Error(`HEIC解码失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// 调整图像尺寸
function resizeImage(
  imageData: ImageData,
  maxWidth?: number,
  maxHeight?: number
): ImageData {
  if (!maxWidth && !maxHeight) {
    return imageData
  }
  
  let { width, height } = imageData
  
  // 计算新的尺寸，保持宽高比
  if (maxWidth && width > maxWidth) {
    height = Math.round((height * maxWidth) / width)
    width = maxWidth
  }
  
  if (maxHeight && height > maxHeight) {
    width = Math.round((width * maxHeight) / height)
    height = maxHeight
  }
  
  // 如果尺寸没有变化，直接返回
  if (width === imageData.width && height === imageData.height) {
    return imageData
  }
  
  // 创建OffscreenCanvas进行缩放
  const sourceCanvas = new OffscreenCanvas(imageData.width, imageData.height)
  const sourceCtx = sourceCanvas.getContext('2d')
  if (!sourceCtx) throw new Error('无法创建Canvas上下文')
  
  sourceCtx.putImageData(imageData, 0, 0)
  
  const destCanvas = new OffscreenCanvas(width, height)
  const destCtx = destCanvas.getContext('2d')
  if (!destCtx) throw new Error('无法创建Canvas上下文')
  
  // 使用高质量缩放
  destCtx.imageSmoothingEnabled = true
  destCtx.imageSmoothingQuality = 'high'
  destCtx.drawImage(sourceCanvas, 0, 0, width, height)
  
  return destCtx.getImageData(0, 0, width, height)
}

// 编码图像为指定格式
async function encodeImage(
  imageData: ImageData,
  format: 'jpeg' | 'png' | 'webp',
  quality: number
): Promise<Blob> {
  const canvas = new OffscreenCanvas(imageData.width, imageData.height)
  const ctx = canvas.getContext('2d')
  
  if (!ctx) {
    throw new Error('无法创建Canvas上下文进行编码')
  }
  
  // 设置图像数据
  ctx.putImageData(imageData, 0, 0)
  
  // 根据格式确定MIME类型和质量参数
  let mimeType: string
  let options: any
  
  switch (format) {
    case 'jpeg':
      mimeType = 'image/jpeg'
      options = { quality: quality / 100 }
      break
    case 'png':
      mimeType = 'image/png'
      options = {} // PNG不支持质量参数
      break
    case 'webp':
      mimeType = 'image/webp'
      options = { quality: quality / 100 }
      break
    default:
      mimeType = 'image/jpeg'
      options = { quality: quality / 100 }
  }
  
  // 转换为Blob
  const blob = await canvas.convertToBlob(options)
  
  // 验证Blob
  if (!blob || blob.size === 0) {
    throw new Error('图像编码失败：生成的Blob为空')
  }
  
  return blob
}

// 处理转换请求
async function handleConvert(data: ConvertMessageData) {
  const startTime = performance.now()
  const { buffer, options, conversionId } = data
  
  if (!buffer) {
    throw new Error('没有提供有效的图像数据')
  }
  
  try {
    // 验证HEIC文件
    if (!isValidHeicBuffer(buffer)) {
      console.warn('文件验证失败，尝试解码...')
    }
    
    // 发送初始进度
    sendProgress(10, conversionId)
    
    // 解码HEIC
    const decoded = await decodeHeic(buffer)
    sendProgress(40, conversionId)
    
    // 创建ImageData对象
    const pixelArray = new Uint8ClampedArray(decoded.width * decoded.height * 4)
    pixelArray.set(decoded.data)
    const imageData = new ImageData(pixelArray, decoded.width, decoded.height)
    sendProgress(50, conversionId)
    
    // 调整尺寸（如果需要）
    const resizedImageData = resizeImage(imageData, options.maxWidth, options.maxHeight)
    sendProgress(70, conversionId)
    
    // 编码为指定格式
    const blob = await encodeImage(resizedImageData, options.outputFormat, options.quality)
    sendProgress(90, conversionId)
    
    // 计算转换时间
    const conversionTime = performance.now() - startTime
    
    // 发送完成消息
    sendComplete(blob, resizedImageData.width, resizedImageData.height, conversionTime, conversionId)
    
  } catch (error) {
    console.error('转换失败:', error)
    sendError(error instanceof Error ? error.message : '转换失败', conversionId)
  }
}

// 监听消息
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, data, id } = event.data
  
  switch (type) {
    case 'init':
      // 初始化Worker
      self.postMessage({ type: 'ready' })
      break
      
    case 'convert':
      if (isConverting) {
        sendError('已有转换任务在进行中', data?.conversionId || 'unknown')
        return
      }
      
      isConverting = true
      currentConversionId = data?.conversionId || null
      
      try {
        // 从文件获取ArrayBuffer
        let buffer: ArrayBuffer
        if (data?.file) {
          buffer = await data.file.arrayBuffer()
        } else if (data?.buffer) {
          buffer = data.buffer
        } else {
          throw new Error('没有提供有效的文件数据')
        }
        
        await handleConvert({
          buffer,
          options: data.options,
          conversionId: data.conversionId
        })
      } catch (error) {
        console.error('转换处理失败:', error)
        sendError(error instanceof Error ? error.message : '转换处理失败', data?.conversionId || 'unknown')
      } finally {
        isConverting = false
        currentConversionId = null
      }
      break
      
    case 'cancel':
      // 取消当前转换（目前简单实现，将来可以添加更复杂的取消逻辑）
      if (currentConversionId && currentConversionId === id) {
        isConverting = false
        currentConversionId = null
        sendError('转换已取消', currentConversionId || 'unknown')
      }
      break
      
    default:
      console.warn('未知的Worker消息类型:', type)
  }
}

// Worker初始化完成
console.log('HEIC转换Worker已初始化，等待消息...')
