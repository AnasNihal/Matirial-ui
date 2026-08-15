'use client'
import { usePathname } from 'next/navigation'

export const usePaths = () => {
  // ✅ Call usePathname unconditionally (required by React hooks rules)
  // Next.js usePathname should handle context availability internally
  const pathname = usePathname()
  
  // ✅ Always return safe defaults if pathname is not available
  if (!pathname || typeof pathname !== 'string') {
    return { page: '', pathname: '' }
  }
  
  // ✅ Safely parse path with error handling
  try {
    const path = pathname.split('/').filter(Boolean) // Remove empty strings
    const page = path[path.length - 1] || ''
    return { page, pathname }
  } catch {
    // If parsing fails, return safe defaults
    return { page: '', pathname: '' }
  }
}
