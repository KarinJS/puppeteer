import lodash from 'lodash'

/**
 * 比较两个对象数组，找出它们之间的差异
 * @description 使用深度比较方式，返回在旧数组中被移除的对象和在新数组中新增的对象
 * @param old 旧数组 - 作为比较基准的原始数组
 * @param data 新数组 - 需要与基准数组进行比较的目标数组
 * @returns 包含差异的对象
 *          - removed: 在旧数组中存在但在新数组中不存在的对象集合
 *          - added: 在新数组中存在但在旧数组中不存在的对象集合
 *          - common: 在两个数组中都存在的对象集合
 * @example
 * const diff = diffArray(
 *   [{ self_id: 123, token: '123' }, { self_id: 222, token: '123' }],
 *   [{ self_id: 123, token: '123' }, { self_id: 333, token: '123' }]
 * )
 * // 结果: {
 * //   removed: [{ self_id: 222, token: '123' }],
 * //   added: [{ self_id: 333, token: '123' }],
 * //   common: [{ self_id: 123, token: '123' }]
 * // }
 */
export const diffArray = <T extends Record<string, any>, K extends Record<string, any>> (
  old: T[],
  data: K[]
) => {
  const removed = lodash.differenceWith(old, data, lodash.isEqual)
  const added = lodash.differenceWith(data, old, lodash.isEqual)
  const common = lodash.intersectionWith(old, data, lodash.isEqual)

  return { removed, added, common }
}
