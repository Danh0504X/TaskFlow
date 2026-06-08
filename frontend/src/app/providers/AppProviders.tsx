import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { queryClient } from '@/lib/queryClient'
import Toaster from '@/components/ui/toast/Toaster'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''


const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </GoogleOAuthProvider>
  )
}

export default AppProviders
