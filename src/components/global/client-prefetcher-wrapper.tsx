// ✅ SAFE WRAPPER: Only renders DataPrefetcher when QueryClient is available
'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import DataPrefetcher from './data-prefetcher'

export default function ClientPrefetcherWrapper() {
  const queryClient = useQueryClient()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // ✅ Only render DataPrefetcher when QueryClient is definitely available
    if (queryClient) {
      setIsReady(true)
    }
  }, [queryClient])

  // Only render prefetcher when QueryClient is ready
  if (!isReady) return null

  return <DataPrefetcher />
}

