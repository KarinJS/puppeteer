import { describe, it, expect } from 'vitest'
import { formatBytes, getScreenshotByteSize } from './utils'

describe('formatBytes', () => {
  it('应该返回 "0 B" 当输入为 0', () => {
    expect(formatBytes(0)).toBe('0 B')
  })

  it('应该返回 "0 B" 当输入为负数', () => {
    expect(formatBytes(-100)).toBe('0 B')
  })

  it('应该正确格式化字节', () => {
    expect(formatBytes(500)).toBe('500 B')
    expect(formatBytes(1)).toBe('1 B')
    expect(formatBytes(1023)).toBe('1023 B')
  })

  it('应该正确格式化 KB', () => {
    expect(formatBytes(1024)).toBe('1.00 KB')
    expect(formatBytes(1536)).toBe('1.50 KB')
    expect(formatBytes(10240)).toBe('10.00 KB')
  })

  it('应该正确格式化 MB', () => {
    expect(formatBytes(1048576)).toBe('1.00 MB')
    expect(formatBytes(5242880)).toBe('5.00 MB')
  })

  it('应该正确格式化 GB', () => {
    expect(formatBytes(1073741824)).toBe('1.00 GB')
  })

  it('应该正确格式化 TB', () => {
    expect(formatBytes(1099511627776)).toBe('1.00 TB')
  })
})

describe('getScreenshotByteSize', () => {
  it('应该返回 null 当 payload 为 null', () => {
    expect(getScreenshotByteSize(null)).toBeNull()
  })

  it('应该返回 null 当 payload 为 undefined', () => {
    expect(getScreenshotByteSize(undefined)).toBeNull()
  })

  it('应该计算普通字符串的字节大小', () => {
    expect(getScreenshotByteSize('hello')).toBe(5)
    expect(getScreenshotByteSize('你好')).toBe(6) // UTF-8: 每个中文3字节
  })

  it('应该计算 base64 编码字符串的原始大小', () => {
    const original = 'hello world'
    const base64 = Buffer.from(original).toString('base64')
    expect(getScreenshotByteSize(base64, 'base64')).toBe(original.length)
  })

  it('应该计算 Buffer 的大小', () => {
    const buf = Buffer.from('test data')
    expect(getScreenshotByteSize(buf)).toBe(9)
  })

  it('应该计算 Uint8Array 的大小', () => {
    const arr = new Uint8Array([1, 2, 3, 4, 5])
    expect(getScreenshotByteSize(arr)).toBe(5)
  })

  it('应该计算 ArrayBuffer 的大小', () => {
    const ab = new ArrayBuffer(10)
    expect(getScreenshotByteSize(ab)).toBe(10)
  })

  it('应该计算数组中所有元素的总大小', () => {
    const items = ['abc', 'def']
    expect(getScreenshotByteSize(items)).toBe(6)
  })

  it('应该处理嵌套数组', () => {
    const items = [['ab', 'cd'], 'ef']
    expect(getScreenshotByteSize(items)).toBe(6)
  })

  it('应该处理包含 data 属性的对象', () => {
    expect(getScreenshotByteSize({ data: 'hello' })).toBe(5)
  })

  it('应该处理包含 data 属性的对象 (base64)', () => {
    const original = 'test'
    const base64 = Buffer.from(original).toString('base64')
    expect(getScreenshotByteSize({ data: base64 }, 'base64')).toBe(original.length)
  })

  it('应该处理包含 buffer 属性的对象', () => {
    const buf = Buffer.from('hello')
    expect(getScreenshotByteSize({ buffer: buf })).toBe(5)
  })

  it('应该处理包含 byteLength 属性的对象', () => {
    expect(getScreenshotByteSize({ byteLength: 42 })).toBe(42)
  })

  it('应该处理包含 length 属性的对象', () => {
    expect(getScreenshotByteSize({ length: 10 })).toBe(10)
  })

  it('应该返回 null 当对象无法识别', () => {
    expect(getScreenshotByteSize({})).toBeNull()
    expect(getScreenshotByteSize({ foo: 'bar' })).toBeNull()
  })

  it('应该处理空数组', () => {
    expect(getScreenshotByteSize([])).toBe(0)
  })
})
