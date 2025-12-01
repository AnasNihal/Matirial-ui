import {
  getAllAutomations,
  getAutomationInfo,
  getProfilePosts,
} from '@/actions/automations'
import { onUserInfo } from '@/actions/user'
import { useQuery } from '@tanstack/react-query'

// 🚀 INSTANT LOAD: Show cached data immediately, refetch in background
export const useQueryAutomations = () => {
  return useQuery({
    queryKey: ['user-automations'],
    queryFn: async () => {
      console.log('🔍 [useQueryAutomations] Calling getAllAutomations...')
      try {
        const result = await getAllAutomations()
        console.log('🔍 [useQueryAutomations] Result received:', {
          status: result?.status,
          dataLength: result?.data?.length,
          hasResult: !!result,
          resultType: typeof result,
          resultKeys: result ? Object.keys(result) : [],
        })
        
        // ✅ Ensure we return the result properly
        if (!result) {
          console.error('❌ [useQueryAutomations] No result returned')
          return { status: 500, data: [] }
        }
        
        // ✅ Validate the result structure
        if (result && typeof result === 'object' && 'status' in result && 'data' in result) {
          if (result.status === 200 && Array.isArray(result.data)) {
            console.log('✅ [useQueryAutomations] Valid result structure, returning:', {
              status: result.status,
              dataLength: result.data.length,
              firstItem: result.data[0] ? { id: result.data[0].id, name: result.data[0].name } : null,
            })
            // ✅ CRITICAL: Return the result as-is (React Query will handle it)
            return result
          } else {
            console.warn('⚠️ [useQueryAutomations] Unexpected status or data type:', {
              status: result.status,
              dataType: Array.isArray(result.data) ? 'array' : typeof result.data,
              dataLength: Array.isArray(result.data) ? result.data.length : 'N/A',
            })
          }
        } else {
          console.error('❌ [useQueryAutomations] Invalid result structure:', {
            hasResult: !!result,
            resultType: typeof result,
            resultKeys: result ? Object.keys(result) : [],
            resultValue: result,
          })
        }
        
        // ✅ Always return something, even if invalid
        return result || { status: 500, data: [] }
      } catch (error: any) {
        console.error('❌ [useQueryAutomations] Error calling getAllAutomations:', error)
        console.error('❌ [useQueryAutomations] Error details:', {
          message: error?.message,
          stack: error?.stack,
          name: error?.name,
        })
        // Return error response instead of throwing
        return { status: 500, data: [], error: error?.message || 'Unknown error' }
      }
    },
    staleTime: 30 * 60 * 1000, // 🔥 Keep fresh for 30 minutes
    gcTime: Infinity, // 🔥 NEVER garbage collect
    refetchOnMount: true, // ✅ Fetch on mount if no cache, use cache if exists
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1, // ✅ Retry once on failure
    // 🔥 KEY: Use cached data instantly, no loading state
    placeholderData: (previousData) => previousData,
  })
}

// 🚀 INSTANT LOAD: Automation details appear instantly
export const useQueryAutomation = (id: string) => {
  return useQuery({
    queryKey: ['automation-info', id],
    queryFn: async () => {
      console.log('🔍 [useQueryAutomation] Calling getAutomationInfo for id:', id)
      try {
        const result = await getAutomationInfo(id)
        console.log('🔍 [useQueryAutomation] Result received:', {
          status: result?.status,
          hasData: !!result?.data,
        })
        return result
      } catch (error) {
        console.error('❌ [useQueryAutomation] Error:', error)
        throw error
      }
    },
    staleTime: 30 * 60 * 1000, // 🔥 Keep fresh for 30 minutes (was Infinity)
    gcTime: Infinity, // 🔥 KEEP FOREVER
    enabled: !!id,
    refetchOnMount: true, // ✅ Fetch on mount if no cache (was false)
    refetchOnWindowFocus: false,
    retry: 1, // ✅ Retry once on failure
    // 🔥 Show old data while fetching new (instant feel)
    placeholderData: (previousData) => previousData,
  })
}

// 🚀 INSTANT LOAD: User profile cached forever
export const useQueryUser = () => {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: onUserInfo,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  })
}

// 🚀 INSTANT LOAD: Instagram posts cached aggressively
export const useQueryAutomationPosts = () => {
  return useQuery({
    queryKey: ['instagram-media'],
    queryFn: getProfilePosts,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  })
}


