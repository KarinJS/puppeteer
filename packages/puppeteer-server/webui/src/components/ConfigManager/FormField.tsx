import React from 'react'

/**
 * 表单字段组件属性
 */
interface FormFieldProps {
  /** 字段标签 */
  label: string
  /** 字段描述 */
  description: string
  /** 子组件 */
  children: React.ReactNode
}

/**
 * 表单字段组件
 *
 * @param props 组件属性
 * @returns 表单字段组件
 */
export const FormField = ({
  label,
  description,
  children
}: FormFieldProps) => (
  <div className='form-control w-full'>
    <label className='text-sm font-medium mb-1.5'>{label}</label>
    {children}
    <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>{description}</p>
  </div>
)
