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
    refetchOnMount: true, // ✅ CRITICAL: Fetch on mount if no cache exists
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1, // ✅ Retry once on failure
    // 🔥 Show cached data instantly while fetching in background
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
    staleTime: 30 * 60 * 1000, // 🔥 Keep fresh for 30 minutes
    gcTime: Infinity, // 🔥 KEEP FOREVER
    enabled: !!id,
    refetchOnMount: true, // ✅ CRITICAL: Fetch on mount if no cache exists
    refetchOnWindowFocus: false,
    retry: 1, // ✅ Retry once on failure
    // 🔥 Show cached data instantly while fetching in background
    placeholderData: (previousData) => previousData,
  })
}

// 🚀 INSTANT LOAD: User profile cached forever
export const useQueryUser = () => {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      console.log('🔍 [useQueryUser] Calling onUserInfo...')
      try {
        const result = await onUserInfo()
        console.log('🔍 [useQueryUser] Result received:', {
          status: result?.status,
          hasData: !!result?.data,
          hasIntegrations: !!result?.data?.integrations,
  })
        
        // ✅ Handle 404 as valid response (user not found in DB yet)
        if (result?.status === 404 || result?.status === 200) {
          return result
        }
        
        // ✅ For other errors, return error response
        if (result?.status && result.status >= 400) {
          console.warn('⚠️ [useQueryUser] Error status:', result.status)
          return result
        }
        
        return result
      } catch (error: any) {
        console.error('❌ [useQueryUser] Error:', error)
        console.error('❌ [useQueryUser] Error details:', {
          message: error?.message,
          stack: error?.stack,
        })
        // ✅ Return error response instead of throwing
        return { status: 500, data: null, error: error?.message }
      }
    },
    staleTime: 30 * 60 * 1000, // 🔥 Keep fresh for 30 minutes
    gcTime: Infinity,
    refetchOnMount: true, // ✅ CRITICAL: Fetch on mount if no cache exists
    refetchOnWindowFocus: false,
    retry: 1, // ✅ Retry once on failure
    // 🔥 Show cached data instantly while fetching in background
    placeholderData: (previousData) => previousData,
  })
}

// 🚀 INSTANT LOAD: Instagram posts cached aggressively
export const useQueryAutomationPosts = () => {
  return useQuery({
    queryKey: ['instagram-media'],
    queryFn: async () => {
      console.log('🔍 [useQueryAutomationPosts] Calling getProfilePosts...')
      try {
        const result = await getProfilePosts()
        console.log('🔍 [useQueryAutomationPosts] Result received:', {
          status: result?.status,
          hasData: !!result?.data,
          dataLength: result?.data?.data?.length || 0,
        })
        return result
      } catch (error) {
        console.error('❌ [useQueryAutomationPosts] Error:', error)
        throw error
      }
    },
    staleTime: 30 * 60 * 1000, // 🔥 Keep fresh for 30 minutes (not Infinity - posts can change)
    gcTime: Infinity, // 🔥 KEEP FOREVER
    refetchOnMount: true, // ✅ Fetch on mount if no cache (was false - this was the bug!)
    refetchOnWindowFocus: false,
    retry: 1, // ✅ Retry once on failure
    // 🔥 Show cached data instantly while fetching in background
    placeholderData: (previousData) => previousData,
  })
}


