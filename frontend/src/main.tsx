import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { bootstrapCsrf } from './api/auth'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Optimistic mutations already patch the cache, and every mutation
      // invalidates on settle — refetch-on-focus adds no correctness value
      // here and is disabled to avoid refetch storms in environments that
      // fire spurious visibilitychange events (e.g. headless/CDP preview).
      refetchOnWindowFocus: false,
    },
  },
})

// Guarantees the csrftoken cookie exists before any component can fire a
// mutating request.
bootstrapCsrf().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>,
  )
})
