'use client'
import { usePathname } from 'next/navigation'

export const usePaths = () => {
  console.log('🔍 [usePaths] Hook called')
  const pathname = usePathname()
  console.log('🔍 [usePaths] Pathname received:', pathname)
  
  // ✅ SAFE: Handle null/undefined pathname
  if (!pathname) {
    console.warn('⚠️ [usePaths] Pathname is null/undefined, using fallback')
    return { page: '', pathname: '' }
  }
  
  const path = pathname.split('/')
  let page = path[path.length - 1] || ''
  
  console.log('🔍 [usePaths] Returning - Page:', page, 'Pathname:', pathname)
  
  return { page, pathname }
}
