// 🚀 DATA PREFETCHER: Load ALL data on app start (like Zorcha)
// ✅ SAFE VERSION: Only runs when QueryClient is available
'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export default function DataPrefetcher() {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    // ✅ Safety check: Only run if QueryClient is available
    if (!queryClient) {
      return
    }
    
    // 🔥 Aggressively prefetch all data on mount
    const prefetchAll = async () => {
      try {
        const { getAllAutomations, getProfilePosts } = await import('@/actions/automations')
        const { onUserInfo } = await import('@/actions/user')
        
        await Promise.all([
          queryClient.prefetchQuery({
            queryKey: ['user-profile'],
            queryFn: onUserInfo,
            staleTime: Infinity,
          }).catch(() => {}), // Silent fail - prefetching is non-critical
          queryClient.prefetchQuery({
            queryKey: ['user-automations'],
            queryFn: getAllAutomations,
            staleTime: Infinity,
          }).catch(() => {}), // Silent fail - prefetching is non-critical
          queryClient.prefetchQuery({
            queryKey: ['instagram-media'],
            queryFn: getProfilePosts,
            staleTime: Infinity,
          }).catch(() => {}), // Silent fail - prefetching is non-critical
        ])
      } catch (error) {
        // Silent fail - prefetching is non-critical
      }
    }
    
    // Small delay to ensure everything is ready
    const timer = setTimeout(prefetchAll, 100)
    return () => clearTimeout(timer)
  }, [queryClient])
  
  // This component renders nothing, it just prefetches
  return null
}
