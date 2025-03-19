/**
 * 任务执行结果类型
 */
export type TaskResult<T> = {
  status: true
  data: T
} | {
  status: false
  data: Error
}
