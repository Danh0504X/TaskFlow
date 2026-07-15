import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { queryClient } from '@/lib/queryClient'
import Toaster from '@/components/ui/toast/Toaster'
import SessionGate from './SessionGate'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1234567890-mockclientid.apps.googleusercontent.com'


const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryClientProvider client={queryClient}>
        <SessionGate>{children}</SessionGate>
        <Toaster />
      </QueryClientProvider>
    </GoogleOAuthProvider>
  )
}

export default AppProviders
