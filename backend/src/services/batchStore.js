const batches = new Map()

export function createBatch(batchId, totalFiles) {
  const batch = {
    batchId,
    status: 'processing',
    progress: 0,
    processed: 0,
    total: totalFiles,
    estimatedTimeRemaining: `${Math.max(totalFiles, 1) * 2}秒`,
    successful: 0,
    failed: 0,
    results: [],
    downloadAllUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  batches.set(batchId, batch)
  return batch
}

export function updateBatch(batchId, updater) {
  const batch = batches.get(batchId)
  if (!batch) {
    return null
  }

  updater(batch)
  batch.updatedAt = new Date().toISOString()
  batches.set(batchId, batch)
  return batch
}

export function getBatch(batchId) {
  return batches.get(batchId) || null
}
