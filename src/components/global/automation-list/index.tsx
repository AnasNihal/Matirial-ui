'use client'
import { usePaths } from '@/hooks/user-nav'
import { cn, getMonth } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useMemo } from 'react'
import GradientButton from '../gradient-button'
import { Button } from '@/components/ui/button'
import { useQueryAutomations } from '@/hooks/user-queries'
import CreateAutomation from '../create-automation'
import { useMutationDataState } from '@/hooks/use-mutation-data'
import { useCreateAutomation } from '@/hooks/use-automations'
import { v4 } from 'uuid'
import AutomationListSkeleton from '../loader/automation-list-skeleton'
import { useQueryClient } from '@tanstack/react-query'
import { getAutomationInfo } from '@/actions/automations'
import SearchButton from './search-button'
import { Calendar, Plus } from 'lucide-react'

type Props = {}

const AutomationList = (props: Props) => {
  const { data, isLoading, error, isFetching, isError } = useQueryAutomations()
  const router = useRouter()
  
  // ✅ Get QueryClient - will throw if provider not set up (caught by ErrorLogger)
  const queryClient = useQueryClient()

  // Removed excessive console logging to prevent terminal spam

  const { latestVariable } = useMutationDataState(['create-automation'])
  const { mutate: createAutomation, isPending: isCreating } = useCreateAutomation()
  const paths = usePaths()
  const pathname = paths?.pathname || ''
  
  // ⚡ PREFETCH: Prefetch automation data on hover for instant loading
  const handleMouseEnter = React.useCallback((automationId: string) => {
    if (!queryClient) {
      console.warn('⚠️ [AutomationList] QueryClient not available, skipping prefetch')
      return
    }
    
    try {
      queryClient.prefetchQuery({
        queryKey: ['automation-info', automationId],
        queryFn: () => getAutomationInfo(automationId),
        staleTime: 30 * 60 * 1000,
      }).catch(() => {
        // Silent fail - prefetching is non-critical, don't log errors
      })
    } catch (error: any) {
      // Silent fail - prefetching is non-critical, don't log errors
    }
  }, [queryClient])
  
  // ✅ Get automations list from data
  const automationsList = data?.data || []

  // ✅ Build final list - REMOVED optimistic updates to prevent fake automations
  // Only show real automations from database, not optimistic ones
  const finalList = useMemo(() => {
    // Don't add optimistic updates - they cause 404 errors when clicked
    // The real automation will appear after the mutation completes and query invalidates
    return automationsList
  }, [automationsList])

  // ⚡ SHOW LOADING SKELETON only on TRUE first load (no cache)
  if (isLoading && !data && !isError) {
    return <AutomationListSkeleton />
  }

  // ✅ Show error state if query failed
  if (isError || error) {
    return (
      <div className="h-[70vh] flex justify-center items-center flex-col gap-y-3 px-4 lg:px-8">
        <h3 className="text-lg text-gray-400">Error loading automations</h3>
        <p className="text-sm text-red-400">{String(error?.message || error || 'Unknown error')}</p>
        <CreateAutomation />
      </div>
    )
  }

  // ✅ Check if we have valid data with automations - THIS IS THE SUCCESS CASE
  if (data && data.status === 200 && Array.isArray(data.data) && data.data.length > 0 && finalList && finalList.length > 0) {
    // ✅ Continue to render the list below
  } else {
    // ✅ Show loading if still fetching
    if (isFetching || isLoading) {
      return <AutomationListSkeleton />
    }
    
    // ✅ Check if data exists but is empty
    if (data && data.status === 200 && (!data.data || !Array.isArray(data.data) || data.data.length === 0)) {
      return (
        <div className="h-[70vh] flex justify-center items-center flex-col gap-y-3 px-4 lg:px-8">
          <h3 className="text-lg text-gray-400">No Automations</h3>
          <CreateAutomation />
        </div>
      )
    }
    
    // ✅ No data or invalid status
    return (
      <div className="h-[70vh] flex justify-center items-center flex-col gap-y-3 px-4 lg:px-8">
        <h3 className="text-lg text-gray-400">No Automations</h3>
        <CreateAutomation />
      </div>
    )
  }

  // Format date helper
  const formatDate = (date: Date) => {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7)
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`
    }
    
    const month = getMonth(date.getUTCMonth() + 1)
    const day = date.getUTCDate()
    return `${month} ${day}`
  }

  return (
    <div className="flex flex-col gap-y-6 w-full px-[6px]">
      {/* Search and Create Automation Bar */}
      <div className="flex items-center justify-between gap-4 w-full">
        <SearchButton />
        <Button
          onClick={(e) => {
            e.preventDefault()
            if (isCreating) return
            
            const newId = v4()
            createAutomation(
              {
                name: 'Untitled',
                id: newId,
                createdAt: new Date(),
                keywords: [],
              },
              {
                onSuccess: (response: any) => {
                  if (response?.status === 200 && response?.res?.id) {
                    const automationId = response.res.id
                    const currentPath = window.location.pathname
                    const basePath = currentPath.split('/automations')[0]
                    router.push(`${basePath}/automations/${automationId}`)
                  }
                },
              }
            )
          }}
          disabled={isCreating}
          className="px-4 py-2 bg-gradient-to-br from-[#3352CC] to-[#1C2D70] hover:opacity-90 text-white rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          New
        </Button>
      </div>

      {/* Table Headers */}
      <div className="hidden md:grid grid-cols-[2fr_1fr_auto] gap-4 items-center px-4 text-sm text-app-text-secondary border-b border-app-border pb-2">
        <div className="font-medium">Automation</div>
        <div className="text-right font-medium flex items-center justify-end gap-1">
          <Calendar className="w-4 h-4" />
          Last Published
        </div>
        <div className="text-center font-medium ml-8">Status</div>
      </div>

      {/* Automation Cards */}
      <div className="flex flex-col gap-y-3">
        {finalList.map((automation: any) => {
          const isActive = automation.active
          const status = isActive ? 'Live' : 'Draft'
          const statusColor = isActive 
            ? 'bg-green-500/10 text-green-500 border-green-500/20' 
            : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
          
          return (
            <div
              key={automation.id}
              className="bg-app-card-bg hover:bg-app-bg-secondary transition-colors rounded-lg border border-app-border p-4 shadow-sm"
            >
              <div className="flex flex-col md:grid md:grid-cols-[2fr_1fr_auto] gap-4 md:items-center">
                {/* Automation Info - Mobile: Full width, Desktop: Grid column */}
                <Link
                  href={`${pathname}/${automation.id}`}
                  prefetch={true}
                  onMouseEnter={() => handleMouseEnter(automation.id)}
                  className="flex items-center gap-3 group min-w-0"
                >
                  {/* Image/Icon */}
                  <div className="w-14 h-14 rounded-lg bg-app-bg-secondary border border-app-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-app-blue to-app-blue-dark flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {automation.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Name and Trigger */}
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <h3 className="font-semibold text-base text-app-text-primary group-hover:text-app-blue transition-colors truncate">
                      {automation.name}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-app-text-secondary whitespace-nowrap">
                        When user comments
                      </span>
                      {automation.keywords && automation.keywords.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-500 border border-purple-500/20 whitespace-nowrap">
                          {automation.keywords[0].word}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Mobile: Status and Last Published in a row */}
                <div className="flex md:hidden items-center justify-between gap-2 mt-2 pt-3 border-t border-app-border">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
                    {status}
                  </span>
                  <div className="flex items-center gap-1 text-sm text-app-text-secondary">
                    <Calendar className="w-4 h-4" />
                    <span>{automation.createdAt ? formatDate(new Date(automation.createdAt)) : 'N/A'}</span>
                  </div>
                </div>

                {/* Desktop: Last Published */}
                <div className="hidden md:block text-right text-sm text-app-text-secondary whitespace-nowrap">
                  {automation.createdAt ? formatDate(new Date(automation.createdAt)) : 'N/A'}
                </div>

                {/* Desktop: Status */}
                <div className="hidden md:block text-center ml-8">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
                    {status}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AutomationList
