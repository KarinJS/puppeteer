import { Toaster as HotToaster } from 'react-hot-toast'

import { useTheme } from '@/hooks/use-theme'

/**
 * 提供全局Toast通知组件
 *
 * @returns Toast通知组件
 */
export const Toaster = () => {
  const { isDark } = useTheme()

  return (
    <HotToaster
      position='top-right'
      toastOptions={{
        style: {
          borderRadius: '20px',
          background: isDark ? '#333' : '#fff',
          color: isDark ? '#fff' : '#333',
        },
      }}
    />
  )
}

export default Toaster
