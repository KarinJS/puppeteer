import { getCountConfig, updateCountConfig } from '../utils/config'
import type { CountConfig } from '../types/config'

let count: CountConfig

/**
 * 调用次数统计
 */
export const getCount = {
  get count () {
    if (!count) {
      count = getCountConfig()
    }
    return count
  },
  save: async () => await updateCountConfig(count)
}
