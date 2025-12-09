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

    // 🔥 Prefetch with timeout - don't block more than 2s
    const prefetchAll = async () => {
      try {
        // Priority 1 & 2: Critical data with timeout
        await Promise.race([
          Promise.all([
            // Priority 1: User profile (critical)
            queryClient.prefetchQuery({
              queryKey: ['user-profile'],
              queryFn: onUserInfo,
              staleTime: 30 * 60 * 1000,
            }).catch(() => {}),
            
            // Priority 2: Automations (important)
            queryClient.prefetchQuery({
              queryKey: ['user-automations'],
              queryFn: getAllAutomations,
              staleTime: 30 * 60 * 1000,
            }).catch(() => {}),
          ]),
          new Promise(resolve => setTimeout(resolve, 2000)) // 2s timeout
        ])
        
        // Defer non-critical prefetches (Instagram posts)
        setTimeout(() => {
          queryClient.prefetchQuery({
            queryKey: ['instagram-media'],
            queryFn: getProfilePosts,
            staleTime: 30 * 60 * 1000,
          }).catch(() => {})
        }, 100)
        
        console.log('🚀 Critical data prefetched successfully!')
      } catch (error) {
        // Silent fail - prefetching is non-critical
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
          }).catch(() => {}) // Silent fail - prefetching is non-critical
        )
      )
      
      console.log(`🚀 Prefetched ${Math.min(automationIds.length, 10)} automations`)
    }

    // Small delay to not block UI
    const timer = setTimeout(prefetchAutomations, 100)
    return () => clearTimeout(timer)
  }, [automationIds, queryClient])
}

