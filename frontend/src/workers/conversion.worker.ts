/**
 * Web Worker工厂函数
 * 创建并返回一个配置好的转换Worker实例
 */

export function createConversionWorker(): Worker {
  // Vite支持使用new URL()语法导入Worker
  // 这会由Vite的构建系统正确处理
  return new Worker(
    new URL('./conversion-worker.ts', import.meta.url),
    {
      type: 'module',
      name: 'heic-conversion-worker'
    }
  )
}