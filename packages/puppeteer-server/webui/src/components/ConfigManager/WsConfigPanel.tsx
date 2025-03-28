import { useFormContext } from 'react-hook-form'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Input } from '@heroui/input'
import { Button } from '@heroui/button'
import { Switch } from '@heroui/switch'
import { XCircleIcon, PlusIcon } from '@heroicons/react/24/outline'
import type { Config, WsClientConfig } from '../../types/config'
import { FormField } from './FormField'

/**
 * WebSocket客户端配置项组件
 *
 * @param props 组件属性
 * @returns 配置项组件
 */
const WsClientItem = ({
  index,
  onRemove
}: {
  index: number,
  onRemove: (index: number) => void
}) => {
  const { register, watch } = useFormContext<Config>()
  const clientConfig = watch(`ws_client.${index}`)

  /**
   * 处理Switch组件值变化
   *
   * @param name 字段名
   * @param value 新值
   */
  const handleSwitchChange = (name: string, value: boolean) => {
    const element = document.getElementsByName(`ws_client.${index}.${name}`)[0] as HTMLInputElement
    if (element) {
      element.checked = value
      element.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }

  return (
    <Card>
      <CardHeader className='flex justify-between items-center'>
        <h3 className='font-medium'>客户端 #{index + 1}</h3>
        <Button
          onClick={() => onRemove(index)}
          color='danger'
          size='sm'
          isIconOnly
          aria-label='删除客户端'
        >
          <XCircleIcon className='h-5 w-5' />
        </Button>
      </CardHeader>
      <CardBody>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <FormField
            label='启用'
            description='是否启用此WebSocket客户端连接'
          >
            <input
              type='checkbox'
              {...register(`ws_client.${index}.enable`)}
              className='hidden'
            />
            <Switch
              isSelected={clientConfig.enable}
              onValueChange={(value) => handleSwitchChange('enable', value)}
              color='primary'
            >
              {clientConfig.enable ? '开启' : '关闭'}
            </Switch>
          </FormField>

          <FormField
            label='URL'
            description='WebSocket服务器地址，例如: ws://服务器地址:端口/路径'
          >
            <Input
              {...register(`ws_client.${index}.url`)}
              placeholder='如: ws://127.0.0.1:7777/puppeteer'
              variant='bordered'
            />
          </FormField>

          <FormField
            label='心跳时间 (毫秒)'
            description='心跳包发送间隔，保持连接活跃，默认30000'
          >
            <Input
              type='number'
              {...register(`ws_client.${index}.heartbeatTime`, { valueAsNumber: true })}
              placeholder='如: 30000'
              variant='bordered'
            />
          </FormField>

          <FormField
            label='重连时间 (毫秒)'
            description='连接断开后的重连间隔，默认5000'
          >
            <Input
              type='number'
              {...register(`ws_client.${index}.reconnectionTime`, { valueAsNumber: true })}
              placeholder='如: 5000'
              variant='bordered'
            />
          </FormField>

          <FormField
            label='鉴权密钥'
            description='WebSocket连接认证令牌（明文）'
          >
            <Input
              {...register(`ws_client.${index}.authorization`)}
              placeholder='鉴权密钥'
              variant='bordered'
            />
          </FormField>
        </div>
      </CardBody>
    </Card>
  )
}

/**
 * WebSocket配置面板
 *
 * @returns WebSocket配置面板组件
 */
export const WsConfigPanel = () => {
  const { register, watch, setValue } = useFormContext<Config>()
  const serverConfig = watch('ws_server')
  const clientConfigs = watch('ws_client')

  /**
   * 处理Switch组件值变化
   *
   * @param name 字段名
   * @param value 新值
   */
  const handleServerSwitchChange = (name: string, value: boolean) => {
    const element = document.getElementsByName(`ws_server.${name}`)[0] as HTMLInputElement
    if (element) {
      element.checked = value
      element.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }

  /**
   * 添加WebSocket客户端
   */
  const handleAddClient = () => {
    const newClient: WsClientConfig = {
      enable: false,
      url: 'ws://127.0.0.1:7777/puppeteer',
      heartbeatTime: 30000,
      reconnectionTime: 5000,
      authorization: null
    }
    setValue('ws_client', [...clientConfigs, newClient])
  }

  /**
   * 删除WebSocket客户端
   *
   * @param index 客户端索引
   */
  const handleRemoveClient = (index: number) => {
    const newClients = [...clientConfigs]
    newClients.splice(index, 1)
    setValue('ws_client', newClients)
  }

  return (
    <div className='space-y-6 mt-4'>
      <Card>
        <CardHeader>
          <h3 className='text-lg font-medium'>WebSocket 服务端</h3>
        </CardHeader>
        <CardBody>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormField
              label='启用 WebSocket 服务'
              description='是否开启WebSocket服务端 需重启生效'
            >
              <input
                type='checkbox'
                {...register('ws_server.enable')}
                className='hidden'
              />
              <Switch
                isSelected={serverConfig.enable}
                onValueChange={(value) => handleServerSwitchChange('enable', value)}
                color='primary'
              >
                {serverConfig.enable ? '开启' : '关闭'}
              </Switch>
            </FormField>

            <FormField
              label='路径'
              description='WebSocket服务路径，例如: /ws'
            >
              <Input
                {...register('ws_server.path')}
                placeholder='如: /ws, /puppeteer'
                variant='bordered'
              />
            </FormField>

            <FormField
              label='令牌'
              description='WebSocket连接验证令牌'
            >
              <Input
                {...register('ws_server.token')}
                placeholder='WebSocket连接验证令牌'
                variant='bordered'
              />
            </FormField>

            <FormField
              label='超时时间 (毫秒)'
              description='WebSocket连接超时时间，单位毫秒'
            >
              <Input
                type='number'
                {...register('ws_server.timeout', { valueAsNumber: true })}
                placeholder='如: 30000'
                variant='bordered'
              />
            </FormField>
          </div>
        </CardBody>
      </Card>

      <div>
        <div className='flex justify-between items-center mb-3'>
          <h3 className='text-lg font-medium'>WebSocket 客户端</h3>
          <Button
            onClick={handleAddClient}
            color='primary'
            size='sm'
            startContent={<PlusIcon className='h-4 w-4' />}
          >
            添加客户端
          </Button>
        </div>

        {clientConfigs.length === 0
          ? (
            <Card>
              <CardBody>
                <div className='text-center py-4 text-gray-500 dark:text-gray-400'>
                  暂无WebSocket客户端配置
                </div>
              </CardBody>
            </Card>
          )
          : (
            <div className='space-y-4'>
              {clientConfigs.map((_, index) => (
                <WsClientItem key={index} index={index} onRemove={handleRemoveClient} />
              ))}
            </div>
          )}
      </div>
    </div>
  )
}
