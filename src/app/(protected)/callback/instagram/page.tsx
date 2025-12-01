import { onIntegrate } from '@/actions/integrations'
import { redirect } from 'next/navigation'
import React from 'react'

type Props = {
  searchParams: {
    code: string
  }
}

const Page = async ({ searchParams: { code } }: Props) => {
  if (code) {
    console.log('🔵 [Instagram Callback] Received code:', code)
    try {
      const cleanCode = code.split('#_')[0]
      console.log('🔵 [Instagram Callback] Clean code:', cleanCode)
      
      const result = await onIntegrate(cleanCode)
      console.log('🔵 [Instagram Callback] Integration result:', {
        status: result.status,
        message: result.message,
        hasData: !!result.data,
      })
      
      if (result.status === 200 && result.data) {
        const redirectUrl = `/dashboard/${result.data.firstname}${result.data.lastname}/integrations`
        console.log('✅ [Instagram Callback] Redirecting to:', redirectUrl)
        return redirect(redirectUrl)
      } else {
        console.error('❌ [Instagram Callback] Integration failed:', {
          status: result.status,
          message: result.message,
        })
        // ✅ Redirect to integrations page instead of sign-up
        // User is already logged in, just integration failed
        return redirect('/dashboard/integrations')
      }
    } catch (error: any) {
      console.error('❌ [Instagram Callback] Error:', error)
      console.error('❌ [Instagram Callback] Error details:', {
        message: error?.message,
        stack: error?.stack,
      })
      // ✅ Redirect to integrations page instead of sign-up
      return redirect('/dashboard/integrations')
    }
  }
  
  console.warn('⚠️ [Instagram Callback] No code provided')
  // ✅ Redirect to integrations page instead of sign-up
  return redirect('/dashboard/integrations')
}

export default Page
