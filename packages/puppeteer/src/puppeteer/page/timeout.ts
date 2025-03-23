/**
 * 标准化超时时间
 * @param ms 超时时间
 */
export const getTimeout = (ms?: number) => {
  return typeof ms === 'number' ? ms : 20000
}
