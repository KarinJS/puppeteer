import { useFormContext } from 'react-hook-form'
import { Input, Textarea } from '@heroui/input'
import { Select, SelectItem } from '@heroui/select'
import { Switch } from '@heroui/switch'
import type { Config } from '../../types/config'
import { FormField } from './FormField'

/**
 * 浏览器配置面板组件
 *
 * @returns 浏览器配置面板组件
 */
export const BrowserConfigPanel = () => {
  const { register, watch } = useFormContext<Config>()
  const browserConfig = watch('browser')

  /**
   * 处理Switch组件值变化
   *
   * @param name 字段名
   * @param value 新值
   */
  const handleSwitchChange = (name: keyof Config['browser'], value: boolean) => {
    const element = document.getElementsByName(`browser.${name}`)[0] as HTMLInputElement
    if (element) {
      element.checked = value
      element.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
      <FormField
        label='下载浏览器'
        description='没有浏览器时下载的浏览器类型'
      >
        <Select
          {...register('browser.downloadBrowser')}
          value={browserConfig.downloadBrowser}
          selectedKeys={[browserConfig.downloadBrowser]}
          variant='bordered'
        >
          <SelectItem key='chrome'>Chrome 内核浏览器</SelectItem>
          <SelectItem key='chrome-headless-shell'>Chrome Headless Shell (纯无头浏览器)</SelectItem>
        </Select>
      </FormField>

      <FormField
        label='调试模式'
        description='在该模式下，浏览器将前台运行，并打开页面后不会关闭 (仅Windows有效)'
      >
        <input
          type='checkbox'
          {...register('browser.debug')}
          className='hidden'
        />
        <Switch
          isSelected={browserConfig.debug}
          onValueChange={(value) => handleSwitchChange('debug', value)}
          color='primary'
        >
          {browserConfig.debug ? '开启' : '关闭'}
        </Switch>
      </FormField>

      <FormField
        label='最大页面数'
        description='最大并发处理页面数量'
      >
        <Input
          type='number'
          {...register('browser.maxPages', { valueAsNumber: true })}
          variant='bordered'
        />
      </FormField>

      <FormField
        label='空闲时间（秒）'
        description='网络请求空闲时间'
      >
        <Input
          type='number'
          {...register('browser.idleTime', { valueAsNumber: true })}
          variant='bordered'
        />
      </FormField>

      <FormField
        label='HMR'
        description='配置热更新时重载浏览器（会强制关闭所有正在进行中的任务）'
      >
        <input
          type='checkbox'
          {...register('browser.hmr')}
          className='hidden'
        />
        <Switch
          isSelected={browserConfig.hmr}
          onValueChange={(value) => handleSwitchChange('hmr', value)}
          color='primary'
        >
          {browserConfig.hmr ? '开启' : '关闭'}
        </Switch>
      </FormField>

      <FormField
        label='无头模式'
        description='在无头模式下浏览器不会显示界面，运行更加高效'
      >
        <input
          type='checkbox'
          {...register('browser.headless')}
          className='hidden'
        />
        <Switch
          isSelected={browserConfig.headless}
          onValueChange={(value) => handleSwitchChange('headless', value)}
          color='primary'
        >
          {browserConfig.headless ? '开启' : '关闭'}
        </Switch>
      </FormField>

      <FormField
        label='可执行路径'
        description='浏览器可执行文件路径，留空则自动下载'
      >
        <Input
          {...register('browser.executablePath')}
          placeholder='浏览器可执行文件路径'
          variant='bordered'
        />
      </FormField>

      <FormField
        label='用户数据目录'
        description='浏览器用户数据保存目录，留空则使用临时目录'
      >
        <Input
          {...register('browser.userDataDir')}
          placeholder='浏览器用户数据保存目录'
          variant='bordered'
        />
      </FormField>

      <FormField
        label='协议'
        description='浏览器通信协议，建议使用默认CDP协议'
      >
        <Select
          {...register('browser.protocol')}
          value={browserConfig.protocol}
          selectedKeys={[browserConfig.protocol]}
          variant='bordered'
        >
          <SelectItem key='cdp'>CDP</SelectItem>
          <SelectItem key='webDriverBiDi'>WebDriver BiDi</SelectItem>
        </Select>
      </FormField>

      <div className='md:col-span-2'>
        <FormField
          label='启动参数'
          description='每行一个参数，例如: --no-sandbox'
        >
          <Textarea
            {...register('browser.args', {
              setValueAs: (value) => {
                if (typeof value === 'string') {
                  return value.split('\n').filter(line => line.trim() !== '')
                }
                return value
              }
            })}
            defaultValue={browserConfig.args.join('\n')}
            rows={5}
            variant='bordered'
          />
        </FormField>
      </div>
    </div>
  )
}
