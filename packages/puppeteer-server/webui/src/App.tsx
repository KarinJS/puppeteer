import { useEffect, useState } from 'react'

import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import ConfigManager from './pages/ConfigManager'
import { Toaster } from 'react-hot-toast'

/**
 * 主应用组件
 */
function App () {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // 检查认证状态
  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    setIsAuthenticated(!!token)
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900'>
        <div className='text-center'>
          <div className='inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]' />
          <p className='mt-4 text-gray-600 dark:text-gray-400'>正在加载...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Toaster
        position='top-right'
        toastOptions={{
          className: 'dark:bg-gray-800 dark:text-white',
          duration: 3000
        }}
      />
      <Routes>
        <Route path='/login' element={<Login onLoginSuccess={() => setIsAuthenticated(true)} />} />
        <Route
          path='/*'
          element={isAuthenticated ? <ConfigManager /> : <Navigate to='/login' replace />}
        />
      </Routes>
    </>
  )
}

export default App
