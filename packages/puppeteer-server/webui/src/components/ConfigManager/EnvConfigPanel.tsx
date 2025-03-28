import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Card, CardBody } from '@heroui/card'
import { Input } from '@heroui/input'
import { Button } from '@heroui/button'
import { XCircleIcon } from '@heroicons/react/24/outline'
import type { Config, EnvVariable } from '../../types/config'

/**
 * 环境变量配置面板组件
 *
 * @returns 环境变量配置面板组件
 */
export const EnvConfigPanel = () => {
  const { register, watch, setValue } = useFormContext<Config>()
  const envVars = watch('env')
  const [newEnvKey, setNewEnvKey] = useState('')

  /**
   * 添加环境变量
   */
  const handleAddEnv = () => {
    if (!newEnvKey.trim()) return

    // 为env字段添加新的环境变量
    const newEnvVar: EnvVariable = {
      key: newEnvKey,
      value: null
    }

    setValue('env', [...envVars, newEnvVar])
    setNewEnvKey('')
  }

  /**
   * 删除环境变量
   *
   * @param index 环境变量索引
   */
  const handleRemoveEnv = (index: number) => {
    const newEnv = [...envVars]
    newEnv.splice(index, 1)
    setValue('env', newEnv)
  }

  return (
    <Card className='mt-4'>
      <CardBody>
        <div className='mb-4'>
          <h3 className='font-medium mb-2'>环境变量</h3>
          <p className='text-sm text-gray-500 dark:text-gray-400'>设置系统环境变量，无值请输入null</p>
        </div>

        <div className='grid grid-cols-1 gap-3 mb-2'>
          <div className='flex gap-4 mb-2 font-medium'>
            <div className='flex-grow'>变量名</div>
            <div className='flex-grow'>变量值</div>
            <div className='w-12' />
          </div>

          <div className='space-y-2'>
            {envVars.map((envVar, index) => (
              <div key={index} className='flex gap-4 items-center'>
                <div className='flex-grow'>
                  <Input
                    value={envVar.key}
                    readOnly
                    variant='bordered'
                  />
                </div>
                <div className='flex-grow'>
                  <Input
                    {...register(`env.${index}.value`)}
                    placeholder='无值请输入null'
                    variant='bordered'
                  />
                </div>
                <Button
                  onClick={() => handleRemoveEnv(index)}
                  color='danger'
                  isIconOnly
                  size='sm'
                  aria-label='删除环境变量'
                >
                  <XCircleIcon className='h-5 w-5' />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className='mt-4 flex items-center gap-4'>
          <div className='flex-grow'>
            <Input
              value={newEnvKey}
              onChange={(e) => setNewEnvKey(e.target.value)}
              placeholder='变量名'
              variant='bordered'
            />
          </div>
          <Button
            onClick={handleAddEnv}
            color='primary'
          >
            添加环境变量
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}
