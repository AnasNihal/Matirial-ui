import {
  getAllAutomations,
  getAutomationInfo,
  getProfilePosts,
} from '@/actions/automations'
import { onUserInfo } from '@/actions/user'
import { useQuery } from '@tanstack/react-query'

// ✅ FIXED: Proper caching with real-time updates
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
          rawData: result?.data,
          firstAutomation: result?.data?.[0] ? {
            name: result.data[0].name,
            hasListener: !!result.data[0].listener,
            listener: result.data[0].listener,
            dmCount: result.data[0].listener?.dmCount,
            commentCount: result.data[0].listener?.commentCount,
          } : null,
        })
        
        console.log('🔍 [useQueryAutomations] Full result object:', JSON.stringify(result, null, 2))
        
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
              firstItem: result.data[0] ? { 
                id: result.data[0].id, 
                name: result.data[0].name,
                listener: result.data[0].listener,
              } : null,
            })
            // ✅ CRITICAL: Return the result as-is
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
        
        // ✅ Always return something
        return result || { status: 500, data: [] }
      } catch (error: any) {
        console.error('❌ [useQueryAutomations] Error calling getAllAutomations:', error)
        console.error('❌ [useQueryAutomations] Error details:', {
          message: error?.message,
          stack: error?.stack,
          name: error?.name,
        })
        return { status: 500, data: [], error: error?.message || 'Unknown error' }
      }
    },
    // ✅ FIXED: Allow refetch but keep data fresh
    staleTime: 5000, // Consider data stale after 5 seconds (allows polling to work)
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnMount: true, // ✅ CRITICAL: Always fetch on mount to get latest data
    refetchOnWindowFocus: true, // ✅ Refetch when user returns to tab
    refetchOnReconnect: true, // ✅ Refetch when internet reconnects
    retry: 1,
    // ✅ REMOVED placeholderData - it was showing stale empty data
  })
}

// Automation details
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
    staleTime: 10000, // 10 seconds
    gcTime: 30 * 60 * 1000,
    enabled: !!id,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 1,
  })
}

// User profile
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
        
        // ✅ Handle 404 as valid response
        if (result?.status === 404 || result?.status === 200) {
          return result
        }
        
        if (result?.status && result.status >= 400) {
          console.warn('⚠️ [useQueryUser] Error status:', result.status)
          return result
        }
        
        return result
      } catch (error: any) {
        console.error('❌ [useQueryUser] Error:', error)
        return { status: 500, data: null, error: error?.message }
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 1,
  })
}

// Instagram posts
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
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false, // Posts don't change often
    refetchOnWindowFocus: false,
    retry: 1,
  })
}