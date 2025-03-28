import { useState, useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { getConfig, updateConfig } from '../api/config'
import ThemeToggle from '../components/ThemeToggle'
import {
  ArrowRightOnRectangleIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
  SignalIcon,
  CommandLineIcon,
  AdjustmentsVerticalIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import type { Config } from '../types/config'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Button } from '@heroui/button'
import { Tabs, Tab } from '@heroui/tabs'
import { Spinner } from '@heroui/spinner'
import toast from 'react-hot-toast'
import {
  BrowserConfigPanel,
  HttpConfigPanel,
  WsConfigPanel,
  LoggerConfigPanel,
  EnvConfigPanel
} from '../components/ConfigManager'

/**
 * 配置管理页面组件
 *
 * @returns 配置管理页面
 */
const ConfigManager = () => {
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedTab, setSelectedTab] = useState('browser')
  const methods = useForm<Config>()

  /**
   * 加载配置
   */
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await getConfig()
        setConfig(data)
        methods.reset(data)
      } catch (error) {
        toast.error('配置加载失败')
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [methods])

  /**
   * 登出处理
   */
  const handleLogout = () => {
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    window.location.href = '/login'
  }

  /**
   * 保存配置
   */
  const handleSave = async (formData: Config) => {
    setSaving(true)
    try {
      await updateConfig(formData)
      setConfig(formData)
      toast.success('配置保存成功')
    } catch (error) {
      toast.error('配置保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900'>
        <div className='text-center'>
          <Spinner size='lg' color='primary' />
          <p className='mt-4 text-gray-600 dark:text-gray-400'>正在加载配置...</p>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900'>
        <Card className='max-w-md text-center'>
          <CardBody>
            <XCircleIcon className='mx-auto h-12 w-12 mb-4 text-danger' />
            <p className='text-xl font-medium mb-4'>配置加载失败</p>
            <Button
              onClick={() => window.location.reload()}
              color='primary'
            >
              重试
            </Button>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      <header className='bg-white dark:bg-gray-800 shadow'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center'>
          <h1 className='text-xl font-bold text-gray-900 dark:text-white'>Puppeteer Server 配置管理</h1>

          <div className='flex items-center space-x-3'>
            <ThemeToggle />
            <Button
              onClick={handleLogout}
              variant='light'
              startContent={<ArrowRightOnRectangleIcon className='h-5 w-5' />}
            >
              登出
            </Button>
          </div>
        </div>
      </header>

      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
        <Card className='shadow-md'>
          <CardHeader className='flex justify-between items-center'>
            <h2 className='text-lg font-semibold'>配置项</h2>
            <Button
              onClick={methods.handleSubmit(handleSave)}
              isDisabled={saving}
              isLoading={saving}
              color='primary'
            >
              保存配置
            </Button>
          </CardHeader>
          <CardBody>
            <FormProvider {...methods}>
              <Tabs
                selectedKey={selectedTab}
                onSelectionChange={(key) => setSelectedTab(key as string)}
                variant='underlined'
                classNames={{
                  tabList: 'gap-6 w-full relative border-b border-divider'
                }}
              >
                <Tab
                  key='browser'
                  title={
                    <div className='flex items-center space-x-2'>
                      <ComputerDesktopIcon className='h-5 w-5' />
                      <span>浏览器</span>
                    </div>
                  }
                >
                  <BrowserConfigPanel />
                </Tab>

                <Tab
                  key='http'
                  title={
                    <div className='flex items-center space-x-2'>
                      <GlobeAltIcon className='h-5 w-5' />
                      <span>HTTP服务</span>
                    </div>
                  }
                >
                  <HttpConfigPanel />
                </Tab>

                <Tab
                  key='websocket'
                  title={
                    <div className='flex items-center space-x-2'>
                      <SignalIcon className='h-5 w-5' />
                      <span>WebSocket</span>
                    </div>
                  }
                >
                  <WsConfigPanel />
                </Tab>

                <Tab
                  key='logger'
                  title={
                    <div className='flex items-center space-x-2'>
                      <CommandLineIcon className='h-5 w-5' />
                      <span>日志</span>
                    </div>
                  }
                >
                  <LoggerConfigPanel />
                </Tab>

                <Tab
                  key='env'
                  title={
                    <div className='flex items-center space-x-2'>
                      <AdjustmentsVerticalIcon className='h-5 w-5' />
                      <span>环境变量</span>
                    </div>
                  }
                >
                  <EnvConfigPanel />
                </Tab>
              </Tabs>
            </FormProvider>
          </CardBody>
        </Card>
      </main>
    </div>
  )
}

export default ConfigManager
