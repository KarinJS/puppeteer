import { useFormContext } from 'react-hook-form'
import { Input } from '@heroui/input'
import { Switch } from '@heroui/switch'
import type { Config } from '../../types/config'
import { FormField } from './FormField'

/**
 * HTTP配置面板组件
 *
 * @returns HTTP配置面板组件
 */
export const HttpConfigPanel = () => {
  const { register, watch } = useFormContext<Config>()
  const httpConfig = watch('http')

  /**
   * 处理Switch组件值变化
   *
   * @param name 字段名
   * @param value 新值
   */
  const handleSwitchChange = (name: string, value: boolean) => {
    const element = document.getElementsByName(`http.${name}`)[0] as HTMLInputElement
    if (element) {
      element.checked = value
      element.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
      <FormField
        label='主机'
        description='HTTP服务监听地址，默认0.0.0.0表示所有地址'
      >
        <Input
          {...register('http.host')}
          placeholder='如: 0.0.0.0, 127.0.0.1'
          variant='bordered'
        />
      </FormField>

      <FormField
        label='端口'
        description='HTTP服务监听端口，修改端口后需重启服务'
      >
        <Input
          type='number'
          {...register('http.port', { valueAsNumber: true })}
          variant='bordered'
        />
      </FormField>

      <FormField
        label='令牌'
        description='API访问令牌，用于权限验证'
      >
        <Input
          {...register('http.token')}
          placeholder='API访问令牌'
          variant='bordered'
        />
      </FormField>

      <FormField
        label='JSON限制'
        description='JSON请求体大小限制，例如: 50mb'
      >
        <Input
          {...register('http.limit')}
          placeholder='如: 50mb'
          variant='bordered'
        />
      </FormField>

      <FormField
        label='上传限制 (MB)'
        description='文件上传大小限制，单位MB (后端将自动转换为字节)'
      >
        <Input
          type='number'
          step='0.1'
          {...register('http.upload', {
            valueAsNumber: true,
            setValueAs: (value) => {
              return Math.round(parseFloat(value) * 1024 * 1024)
            }
          })}
          defaultValue={(httpConfig.upload / (1024 * 1024)).toFixed(1)}
          variant='bordered'
        />
      </FormField>

      <FormField
        label='启用截图API'
        description='是否启用截图API功能'
      >
        <input
          type='checkbox'
          {...register('http.screenshot')}
          className='hidden'
        />
        <Switch
          isSelected={httpConfig.screenshot}
          onValueChange={(value) => handleSwitchChange('screenshot', value)}
          color='primary'
        >
          {httpConfig.screenshot ? '开启' : '关闭'}
        </Switch>
      </FormField>
    </div>
  )
}
