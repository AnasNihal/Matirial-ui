// ⚡ PREFETCHING HOOKS for instant page loads
import { useQueryClient } from '@tanstack/react-query'
import { getAutomationInfo } from '@/actions/automations'

// Prefetch automation data on hover for instant loading
export const usePrefetchAutomation = () => {
  const queryClient = useQueryClient()

  const prefetch = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ['automation-info', id],
      queryFn: () => getAutomationInfo(id),
      staleTime: 5 * 60 * 1000, // Keep prefetched data for 5 minutes
    })
  }

  return { prefetch }
}

