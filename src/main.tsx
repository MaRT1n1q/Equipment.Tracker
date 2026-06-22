import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppBootstrap } from './components/AppBootstrap'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Данные считаются свежими 30 сек — в это время refetch не выполняется
      // при монтировании/переключении вкладок. Снижает нагрузку на backend.
      staleTime: 30_000,
      // Кешировать на 5 минут — данные остаются в памяти для мгновенного возврата
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppBootstrap />
    </QueryClientProvider>
  </StrictMode>
)
