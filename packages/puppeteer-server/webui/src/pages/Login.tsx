import { sha256 } from 'js-sha256'
import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import { Card, CardBody } from '@heroui/card'
import { Input } from '@heroui/input'
import { Button } from '@heroui/button'
import { Spinner } from '@heroui/spinner'
import toast from 'react-hot-toast'

interface LoginProps {
  onLoginSuccess: () => void
}

const Login = ({ onLoginSuccess }: LoginProps) => {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const location = useLocation()
  const navigate = useNavigate()

  // 解析URL参数，获取redirect_url
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const redirectUrl = searchParams.get('redirect_url')
    if (redirectUrl) {
      // 保存重定向URL到会话存储
      sessionStorage.setItem('redirectUrl', redirectUrl)
    }
  }, [location])

  // 处理登录逻辑
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    // 简单的表单验证
    if (!password) {
      setError('请输入管理密码')
      setTimeout(() => setError(''), 3000)
      return
    }

    setLoading(true)
    setError('')

    try {
      // 使用js-sha256库进行SHA-256加密
      const hashHex = sha256(password)

      // 生成认证令牌
      const token = 'Bearer ' + hashHex

      // 发送登录请求
      const response = await fetch('/api/login', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        }
      })

      if (response.ok) {
        // 保存令牌到本地存储
        localStorage.setItem('token', token)

        // 显示成功消息
        toast.success('登录成功，正在跳转...')

        // 获取重定向URL或默认到首页
        const redirectUrl = sessionStorage.getItem('redirectUrl') || '/'
        sessionStorage.removeItem('redirectUrl') // 清除重定向URL

        // 延迟跳转
        setTimeout(() => {
          onLoginSuccess()
          navigate(redirectUrl)
        }, 1000)
      } else {
        const data = await response.json()
        setError(data.message || '密码错误，请重试')
        setTimeout(() => setError(''), 3000)
      }
    } catch (error) {
      setError('连接服务器失败，请稍后再试')
      setTimeout(() => setError(''), 3000)
      console.error('登录请求错误:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center'>
      {/* 波浪和粒子背景可以通过CSS实现，这里简化 */}
      <div className='z-10 w-full px-4 sm:px-6 md:max-w-5xl'>
        <div className='flex flex-col lg:flex-row overflow-hidden rounded-xl shadow-2xl'>
          {/* 左侧品牌区域 */}
          <BrandPanel />

          {/* 右侧登录区域 */}
          <Card className='lg:w-[55%] bg-white dark:bg-gray-800 p-6 lg:p-8 flex items-center rounded-none'>
            <CardBody className='w-full'>
              <div className='flex justify-between items-center mb-8'>
                <h2 className='text-2xl font-bold text-gray-800 dark:text-white'>管理员登录</h2>
                <ThemeToggle />
              </div>

              <p className='text-gray-600 dark:text-gray-400 mb-5'>请输入管理密码继续访问系统</p>

              <form onSubmit={handleLogin}>
                <div className='mb-2'>
                  <Input
                    type='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='请输入管理密码'
                    required
                    // startContent={<LockClosedIcon className='h-5 w-5 text-gray-400' />}
                    isInvalid={!!error}
                    errorMessage={error}
                    className='w-full'
                  // variant='bordered'
                  />
                </div>

                <Button
                  type='submit'
                  isDisabled={loading}
                  isLoading={loading}
                  color='primary'
                  className='w-full'
                  spinner={<Spinner color='current' size='sm' />}
                >
                  登录系统
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

// 品牌面板组件
const BrandPanel = () => (
  <div className='left-panel lg:w-[45%] p-8 lg:p-10 text-white flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800'>
    <div className='relative z-10'>
      <div className='mb-8'>
        <div className='h-14 w-14 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6'>
          <svg
            xmlns='http://www.w3.org/2000/svg' className='h-8 w-8 text-white' fill='none' viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round' strokeLinejoin='round' strokeWidth='2'
              d='M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z'
            />
          </svg>
        </div>
        <h1 className='text-3xl md:text-4xl font-bold mb-2'>Puppeteer Server</h1>
        <p className='text-white/80'>自动化浏览器控制系统</p>
      </div>

      <FeatureList />
    </div>

    <div className='text-sm text-white/60'>
      <p className='mb-1'>© {new Date().getFullYear()} Puppeteer Server</p>
      <p>基于 Chrome DevTools Protocol 技术</p>
    </div>

    {/* 装饰圆形 */}
    <div className='absolute -bottom-20 -right-20 w-48 h-48 rounded-full bg-white/10' />
    <div className='absolute -top-20 -left-20 w-32 h-32 rounded-full bg-white/10' />
  </div>
)

// 特性列表组件
const FeatureList = () => {
  const features = [
    '高效的浏览器自动化',
    '强大的API控制能力',
    '简单易用的配置界面'
  ]

  return (
    <div className='space-y-6'>
      {features.map((feature, index) => (
        <div key={index} className='flex items-center space-x-3'>
          <div className='rounded-full bg-white/20 p-2'>
            <svg
              xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M5 13l4 4L19 7' />
            </svg>
          </div>
          <span>{feature}</span>
        </div>
      ))}
    </div>
  )
}

export default Login
