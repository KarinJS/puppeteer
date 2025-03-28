import { HeroUIProvider } from '@heroui/system'
import { useHref, useNavigate } from 'react-router-dom'
import Toaster from '@/components/toaster.tsx'

export function Provider ({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()

  return (
    <HeroUIProvider navigate={navigate} useHref={useHref}>
      <Toaster />
      {children}
    </HeroUIProvider>
  )
}
