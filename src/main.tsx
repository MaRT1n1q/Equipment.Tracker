import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppBootstrap } from './components/AppBootstrap'
import { ensureElectronApiBridge } from './lib/webElectronApi'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

ensureElectronApiBridge()

// Keep QueryClientProvider here to preserve existing bootstrap structure.
// AppBootstrap handles fatal error UI and error boundaries.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppBootstrap />
    </QueryClientProvider>
  </StrictMode>
)
