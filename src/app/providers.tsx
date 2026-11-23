import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'
import { Toaster } from 'sonner'
import { I18nProvider } from '@/lib/i18n'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>{children}</I18nProvider>
      <Toaster position="top-right" richColors={false} toastOptions={{
        style: { border: '1px solid #E5E9E8', borderRadius: '8px', fontSize: '13px' },
      }} />
    </QueryClientProvider>
  )
}

export { queryClient }
