import express from 'express'
import sharp from 'sharp'
import { getSharpSupport } from '../utils/sharpSupport.js'

const router = express.Router()

// 健康检查端点
router.get('/', (req, res) => {
  const support = getSharpSupport()

  res.json({
    status: 'healthy',
    service: 'HEIC2JPG Conversion API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    sharp: {
      version: sharp.versions.sharp,
      libvips: sharp.versions.vips,
      available: true,
      capabilities: support
    },
    system: {
      platform: process.platform,
      arch: process.arch,
      node: process.version,
      memory: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
      },
      uptime: `${Math.round(process.uptime())}s`
    }
  })
})

// 详细健康检查（包含sharp功能测试）
router.get('/detailed', async (req, res) => {
  try {
    const support = getSharpSupport()

    // 测试sharp是否正常工作
    const testBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
      0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ])

    const metadata = await sharp(testBuffer).metadata()
    
    res.json({
      status: 'healthy',
      sharp: {
        working: true,
        version: sharp.versions.sharp,
        libvips: sharp.versions.vips,
        capabilities: support,
        test: {
          format: metadata.format,
          width: metadata.width,
          height: metadata.height,
          success: true
        }
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'Sharp library test failed',
      message: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

// 就绪检查（用于负载均衡器）
router.get('/ready', (req, res) => {
  // 这里可以添加数据库连接检查等
  res.json({
    status: 'ready',
    timestamp: new Date().toISOString()
  })
})

// 存活检查（用于Kubernetes）
router.get('/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString()
  })
})

export default router
