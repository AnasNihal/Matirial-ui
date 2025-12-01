'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { useState } from 'react'

type Props = { children: React.ReactNode }

// 🚀 ULTRA-FAST CONFIGURATION: Make it feel INSTANT like Zorcha
const queryClientConfig = {
  defaultOptions: {
    queries: {
      // 🔥 AGGRESSIVE: Keep data fresh for 30 minutes (like Zorcha)
      staleTime: 30 * 60 * 1000,
      
      // 🔥 KEEP CACHE FOREVER (or until browser closes)
      gcTime: Infinity,
      
      // 🔥 RETRY once for resilience
      retry: 1,
      retryDelay: 1000,
      
      // 🔥 NEVER refetch automatically on window focus/reconnect
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      // ✅ CRITICAL: Fetch on mount if no cache (allows initial load)
      // Individual hooks can override this if needed
      refetchOnMount: true,
      
      // 🔥 Show stale data while refetching in background
      refetchInterval: false as const,
    },
    mutations: {
      retry: 1,
    },
  },
}

// ✅ SINGLETON: Reuse same client across renders (persists cache)
let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    // SSR: Create temporary client (will be replaced on client)
    return new QueryClient(queryClientConfig)
  }
  
  // Client: Reuse singleton
  if (!browserQueryClient) {
    browserQueryClient = new QueryClient(queryClientConfig)
  }
  return browserQueryClient
}

const ReactQueryProvider = ({ children }: Props) => {
  // ✅ CRITICAL FIX: Always create client, ensure it's never null
  const [queryClient] = useState<QueryClient>(() => {
    const client = getQueryClient()
    if (!client) {
      // Fallback: create a new one
      return new QueryClient(queryClientConfig)
    }
    return client
  })
  
  // ✅ Ensure client is always available
  if (!queryClient) {
    return <>{children}</>
  }
  
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

export default ReactQueryProvider
