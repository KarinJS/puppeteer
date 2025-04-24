import lodash from 'lodash'
import { getCountConfig, updateCountConfig } from '../utils/config'
import type { CountConfig } from '../types/config'

let count: CountConfig
/** 5秒前的count */
let oldCount: CountConfig

/**
 * 调用次数统计
 */
export const getCount = {
  get count () {
    if (!count) {
      count = getCountConfig()
      oldCount = count

      /**
       * 每5秒保存一次 如果与上次的值相同则不保存
       */
      setInterval(async () => {
        if (!lodash.isEqual(count, oldCount)) {
          this.save()
          oldCount = count
        }
      }, 5000)
    }
    return count
  },
  save: async () => await updateCountConfig(count)
}
