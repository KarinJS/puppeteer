import { useFormContext } from 'react-hook-form'
import { Select, SelectItem } from '@heroui/select'
import type { Config } from '../../types/config'
import { FormField } from './FormField'

/**
 * 日志配置面板组件
 *
 * @returns 日志配置面板组件
 */
export const LoggerConfigPanel = () => {
  const { register, watch } = useFormContext<Config>()
  const loggerConfig = watch('logger')

  return (
    <div className='grid grid-cols-1 gap-4 mt-4'>
      <FormField
        label='日志级别'
        description='日志输出级别，级别越低记录越详细'
      >
        <Select
          {...register('logger.level')}
          value={loggerConfig.level}
          selectedKeys={[loggerConfig.level]}
          variant='bordered'
        >
          <SelectItem key='trace'>trace</SelectItem>
          <SelectItem key='debug'>debug</SelectItem>
          <SelectItem key='info'>info</SelectItem>
          <SelectItem key='warn'>warn</SelectItem>
          <SelectItem key='error'>error</SelectItem>
          <SelectItem key='fatal'>fatal</SelectItem>
          <SelectItem key='mark'>mark</SelectItem>
        </Select>
      </FormField>
    </div>
  )
}
