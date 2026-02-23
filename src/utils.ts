export const formatBytes = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  if (!bytes || bytes < 0) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, i)
  return `${i === 0 ? Math.round(value) : value.toFixed(2)} ${units[i]}`
}

export const getScreenshotByteSize = (payload: unknown, encoding?: string): number | null => {
  try {
    if (payload == null) return null
    const enc = (encoding || '').toLowerCase()

    if (Array.isArray(payload)) {
      let total = 0
      for (const item of payload) {
        const size = getScreenshotByteSize(item, enc)
        if (typeof size === 'number') total += size
      }
      return total
    }

    if (typeof payload === 'string') {
      return enc === 'base64' ? Buffer.from(payload, 'base64').length : Buffer.byteLength(payload)
    }
    if (Buffer.isBuffer(payload)) return payload.length
    if (payload instanceof Uint8Array) return payload.byteLength
    if (payload instanceof ArrayBuffer) return payload.byteLength

    const anyPayload = payload as any
    if (typeof anyPayload.data === 'string') {
      return enc === 'base64' ? Buffer.from(anyPayload.data, 'base64').length : Buffer.byteLength(anyPayload.data)
    }
    if (Buffer.isBuffer(anyPayload.buffer)) return anyPayload.buffer.length
    if (anyPayload.buffer instanceof ArrayBuffer) return anyPayload.buffer.byteLength
    if (typeof anyPayload.byteLength === 'number') return anyPayload.byteLength
    if (typeof anyPayload.length === 'number') return anyPayload.length

    return null
  } catch {
    return null
  }
}
