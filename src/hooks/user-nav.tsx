'use client'
import { usePathname } from 'next/navigation'

export const usePaths = () => {
  const pathname = usePathname()
  
  if (!pathname) {
    return { page: '', pathname: '' }
  }
  
  const path = pathname.split('/')
  let page = path[path.length - 1] || ''
  
  return { page, pathname }
}
