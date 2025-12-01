// 🚀 AGGRESSIVE PREFETCHING: Load ALL data on app start (like Zorcha)
'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getAllAutomations, getProfilePosts } from '@/actions/automations'
import { onUserInfo } from '@/actions/user'

export function useAggressivePrefetch() {
  const queryClient = useQueryClient()

  useEffect(() => {
    // ✅ Safety check: Only run if QueryClient is available
    if (!queryClient) {
      console.warn('QueryClient not available yet, skipping prefetch')
      return
    }

    // 🔥 Prefetch EVERYTHING on app load in parallel
    const prefetchAll = async () => {
      try {
        await Promise.all([
          // Prefetch user profile
          queryClient.prefetchQuery({
            queryKey: ['user-profile'],
            queryFn: onUserInfo,
            staleTime: Infinity,
          }),
          
          // Prefetch automations list
          queryClient.prefetchQuery({
            queryKey: ['user-automations'],
            queryFn: getAllAutomations,
            staleTime: Infinity,
          }),
          
          // Prefetch Instagram posts
          queryClient.prefetchQuery({
            queryKey: ['instagram-media'],
            queryFn: getProfilePosts,
            staleTime: Infinity,
          }),
        ])
        
        console.log('🚀 All data prefetched successfully!')
      } catch (error) {
        console.log('Prefetch error (non-critical):', error)
      }
    }

    // Start prefetching immediately
    prefetchAll()
  }, [queryClient])
}

// 🚀 Prefetch ALL automations on list load
export function usePrefetchAllAutomations(automationIds: string[]) {
  const queryClient = useQueryClient()

  useEffect(() => {
    // ✅ Safety check: Only run if QueryClient is available
    if (!queryClient) return
    if (!automationIds || automationIds.length === 0) return

    // Prefetch all automation details in parallel
    const prefetchAutomations = async () => {
      const { getAutomationInfo } = await import('@/actions/automations')
      
      await Promise.all(
        automationIds.slice(0, 10).map((id) => // Prefetch first 10
          queryClient.prefetchQuery({
            queryKey: ['automation-info', id],
            queryFn: () => getAutomationInfo(id),
            staleTime: Infinity,
          })
        )
      )
      
      console.log(`🚀 Prefetched ${Math.min(automationIds.length, 10)} automations`)
    }

    // Small delay to not block UI
    const timer = setTimeout(prefetchAutomations, 100)
    return () => clearTimeout(timer)
  }, [automationIds, queryClient])
}

