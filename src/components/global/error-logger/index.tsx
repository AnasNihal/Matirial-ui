// 🔍 ERROR LOGGER: Catch and log all errors for debugging
'use client'

import { useEffect } from 'react'

export default function ErrorLogger() {
  useEffect(() => {
    // Log all unhandled errors
    const handleError = (event: ErrorEvent) => {
      const error = event.error
      const errorMessage = error?.message || String(error) || event.message
      const errorStack = error?.stack || 'No stack trace'
      
      console.error('🔴 [ErrorLogger] Unhandled Error:', errorMessage)
      console.error('🔴 [ErrorLogger] Error Stack:', errorStack)
      console.error('🔴 [ErrorLogger] Full Error Object:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      })
      
      // ✅ Log to terminal via console (will show in server terminal)
      if (errorMessage.includes('QueryClient') || errorMessage.includes('QueryClientProvider')) {
        console.error('❌ [ErrorLogger] QueryClient Error Detected!')
        console.error('❌ [ErrorLogger] This usually means QueryClientProvider is not wrapping the component')
        console.error('❌ [ErrorLogger] Check that ReactQueryProvider is in the root layout')
        console.error('❌ [ErrorLogger] Error location:', event.filename, 'Line:', event.lineno)
      }
    }

    // Log unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      const reasonMessage = reason?.message || String(reason) || 'Unknown rejection'
      const reasonStack = reason?.stack || 'No stack trace'
      
      console.error('🔴 [ErrorLogger] Unhandled Promise Rejection:', reasonMessage)
      console.error('🔴 [ErrorLogger] Rejection Stack:', reasonStack)
      console.error('🔴 [ErrorLogger] Full Rejection Object:', {
        reason: event.reason,
        promise: event.promise,
      })
      
      // ✅ Log to terminal via console (will show in server terminal)
      if (reasonMessage.includes('QueryClient') || reasonMessage.includes('QueryClientProvider')) {
        console.error('❌ [ErrorLogger] QueryClient Promise Rejection Detected!')
        console.error('❌ [ErrorLogger] This usually means QueryClientProvider is not wrapping the component')
        console.error('❌ [ErrorLogger] Check that ReactQueryProvider is in the root layout')
      }
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  return null
}

