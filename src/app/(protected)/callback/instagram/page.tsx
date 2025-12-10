import { onIntegrate } from '@/actions/integrations'
import { onCurrentUser } from '@/actions/user'
import { findUser } from '@/actions/user/queries'
import { redirect } from 'next/navigation'
import React from 'react'

type Props = {
  searchParams: {
    code: string
  }
}

const Page = async ({ searchParams: { code } }: Props) => {
  console.log('🔵 [Instagram Callback] Page loaded')
  console.log('🔵 [Instagram Callback] Search params:', { code: code ? 'EXISTS' : 'MISSING' })
  
  if (code) {
    console.log('🔵 [Instagram Callback] Received code:', code.substring(0, 20) + '...')
    console.log('🔵 [Instagram Callback] Full code length:', code.length)
    try {
      // ✅ Clean the code: remove fragments, query params, and decode if needed
      let cleanCode = code
      
      // Remove any URL fragments (after #)
      cleanCode = cleanCode.split('#')[0]
      
      // Remove any query parameters (after ?)
      cleanCode = cleanCode.split('?')[0]
      
      // Trim whitespace
      cleanCode = cleanCode.trim()
      
      // Try to decode if it looks URL encoded (contains %)
      if (cleanCode.includes('%')) {
        try {
          cleanCode = decodeURIComponent(cleanCode)
        } catch (e) {
          console.warn('⚠️ [Instagram Callback] Failed to decode code, using as-is')
        }
      }
      
      console.log('🔵 [Instagram Callback] Clean code length:', cleanCode.length)
      console.log('🔵 [Instagram Callback] Clean code preview:', cleanCode.substring(0, 30) + '...')
      
      if (!cleanCode || cleanCode.length === 0) {
        console.error('❌ [Instagram Callback] Code is empty after cleaning')
        return redirect('/dashboard/integrations?error=invalid_code')
      }
      
      console.log('🔵 [Instagram Callback] Calling onIntegrate...')
      const result = await onIntegrate(cleanCode)
      
      console.log('🔵 [Instagram Callback] Integration result:', {
        status: result.status,
        message: result.message,
        hasData: !!result.data,
        dataKeys: result.data ? Object.keys(result.data) : [],
      })
      
      if (result.status === 200 && result.data) {
    console.log('🔵 [Instagram Callback] Result data:', {
    firstname: (result.data as any)?.firstname ?? "",
    lastname: (result.data as any)?.lastname ?? "",

        })
        
                  // Build redirect URL using result data
          let redirectUrl = '/dashboard/integrations'

          // Cast to any to avoid TypeScript union error
          const data: any = result.data;

          if (data.firstname && data.lastname) {
            redirectUrl = `/dashboard/${data.firstname}${data.lastname}/integrations`
            console.log('✅ [Instagram Callback] Using result data for redirect:', redirectUrl)
          } else {

          console.warn('⚠️ [Instagram Callback] Missing firstname/lastname, fetching user data...')
          // Fallback: Get user data to build redirect URL
          try {
            const user = await onCurrentUser()
            const userData = await findUser(user.id)
            if (userData?.firstname && userData?.lastname) {
              redirectUrl = `/dashboard/${userData.firstname}${userData.lastname}/integrations`
              console.log('✅ [Instagram Callback] Using fetched user data for redirect:', redirectUrl)
            } else {
              console.error('❌ [Instagram Callback] User data also missing firstname/lastname')
            }
          } catch (err) {
            console.error('❌ [Instagram Callback] Error fetching user data:', err)
          }
        }
        
        console.log('✅ [Instagram Callback] Redirecting to:', redirectUrl)
        return redirect(redirectUrl)
      } else {
        console.error('❌ [Instagram Callback] Integration failed:', {
          status: result.status,
          message: result.message,
          hasData: !!result.data,
        })
        // Fallback redirect with error message
        const errorMessage = encodeURIComponent(result.message || 'Integration failed')
        console.log('⚠️ [Instagram Callback] Using fallback redirect to /dashboard/integrations with error')
        return redirect(`/dashboard/integrations?error=${errorMessage}`)
      }
      
    } catch (error: any) {
      console.error('❌ [Instagram Callback] Error caught:', error)
      console.error('❌ [Instagram Callback] Error message:', error?.message)
      console.error('❌ [Instagram Callback] Error stack:', error?.stack)
      if (error?.response) {
        console.error('❌ [Instagram Callback] Error response:', error.response.data)
      }
      
      // Extract error message for user feedback
      const errorMessage = error?.message || error?.response?.data?.error?.message || 'Unknown error occurred'
      const encodedError = encodeURIComponent(errorMessage)
      return redirect(`/dashboard/integrations?error=${encodedError}`)
    }
  }
  
  console.warn('⚠️ [Instagram Callback] No code provided in searchParams')
  return redirect('/dashboard/integrations')
}

export default Page
