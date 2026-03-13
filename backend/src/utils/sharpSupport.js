import sharp from 'sharp'

function getSupportedSuffixes() {
  return sharp.format.heif?.input?.fileSuffix ?? []
}

export function getSharpSupport() {
  const supportedSuffixes = getSupportedSuffixes()
  const heicInput = supportedSuffixes.includes('.heic')
  const heifInput = supportedSuffixes.includes('.heif')

  return {
    heicInput,
    heifInput,
    avifInput: supportedSuffixes.includes('.avif'),
    supportedSuffixes
  }
}

export function ensureHeicInputSupport() {
  const support = getSharpSupport()

  if (!support.heicInput && !support.heifInput) {
    const error = new Error('当前服务器环境未启用HEIC/HEIF解码支持，请切换到浏览器端处理')
    // @ts-expect-error plain JS custom field
    error.statusCode = 503
    throw error
  }

  return support
}
