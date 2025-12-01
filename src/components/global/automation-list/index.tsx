'use client'
import { usePaths } from '@/hooks/user-nav'
import { cn, getMonth } from '@/lib/utils'
import Link from 'next/link'
import React, { useMemo } from 'react'
import GradientButton from '../gradient-button'
import { Button } from '@/components/ui/button'
import { useQueryAutomations } from '@/hooks/user-queries'
import CreateAutomation from '../create-automation'
import { useMutationDataState } from '@/hooks/use-mutation-data'
import AutomationListSkeleton from '../loader/automation-list-skeleton'
import { useQueryClient } from '@tanstack/react-query'
import { getAutomationInfo } from '@/actions/automations'

type Props = {}

const AutomationList = (props: Props) => {
  const { data, isLoading, error, isFetching, isError } = useQueryAutomations()
  
  // ✅ Get QueryClient - will throw if provider not set up (caught by ErrorLogger)
  const queryClient = useQueryClient()

  console.log('🔍 [AutomationList] RENDER:', {
    isLoading,
    isFetching,
    isError,
    hasData: !!data,
    dataStatus: data?.status,
    dataLength: data?.data?.length,
    error: error ? String(error) : null,
    errorMessage: error?.message,
    errorStack: error?.stack,
  })
  console.log('🔍 [AutomationList] Full data object:', data)

  const { latestVariable } = useMutationDataState(['create-automation'])
  const { pathname } = usePaths()
  
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
      }).catch((error: any) => {
        console.error('❌ [AutomationList] Prefetch error:', error)
        console.error('❌ [AutomationList] Prefetch error details:', {
          message: error?.message,
          stack: error?.stack,
        })
      })
    } catch (error: any) {
      console.error('❌ [AutomationList] Prefetch error:', error)
      console.error('❌ [AutomationList] Prefetch error details:', {
        message: error?.message,
        stack: error?.stack,
      })
    }
  }, [queryClient])
  
  // ✅ Get automations list from data
  const automationsList = data?.data || []
  console.log('🔍 [AutomationList] Automations list:', automationsList)
  console.log('🔍 [AutomationList] Automations list length:', automationsList.length)

  // ✅ Build final list with optimistic updates
  const finalList = useMemo(() => {
    if (latestVariable && latestVariable?.variables && automationsList.length > 0) {
      return [latestVariable.variables, ...automationsList]
    }
    return automationsList
  }, [latestVariable, automationsList])

  console.log('🔍 [AutomationList] Final list:', finalList)
  console.log('🔍 [AutomationList] Final list length:', finalList.length)

  // ⚡ SHOW LOADING SKELETON only on TRUE first load (no cache)
  if (isLoading && !data && !isError) {
    console.log('🔍 [AutomationList] Showing skeleton - loading and no data')
    return <AutomationListSkeleton />
  }

  // ✅ Show error state if query failed
  if (isError || error) {
    console.error('🔴 [AutomationList] ERROR:', error)
    console.error('🔴 [AutomationList] Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    })
    return (
      <div className="h-[70vh] flex justify-center items-center flex-col gap-y-3">
        <h3 className="text-lg text-gray-400">Error loading automations</h3>
        <p className="text-sm text-red-400">{String(error?.message || error || 'Unknown error')}</p>
        <CreateAutomation />
      </div>
    )
  }

  // ✅ Check if we have automations to display
  if (!data || !finalList || finalList.length <= 0) {
    console.log('🔍 [AutomationList] No automations - data:', !!data, 'finalList:', finalList?.length)
    return (
      <div className="h-[70vh] flex justify-center items-center flex-col gap-y-3">
        <h3 className="text-lg text-gray-400">No Automations </h3>
        <CreateAutomation />
      </div>
    )
  }

  console.log('✅ [AutomationList] Rendering', finalList.length, 'automations')

  return (
    <div className="flex flex-col gap-y-3">
      {finalList.map((automation: any) => (
        <Link
          href={`${pathname}/${automation.id}`}
          key={automation.id}
          prefetch={true} // ⚡ Next.js prefetching
          onMouseEnter={() => handleMouseEnter(automation.id)} // ⚡ React Query prefetching on hover
          className="bg-[#1D1D1D] hover:opacity-80 transition duration-100 rounded-xl p-5 border-[1px] radial--gradient--automations flex border-[#545454]"
        >
          <div className="flex flex-col flex-1 items-start">
            <h2 className="text-xl font-semibold">{automation.name}</h2>
            <p className="text-[#9B9CA0] text-sm font-light mb-2">
              This is from the comment
            </p>

            {automation.keywords.length > 0 ? (
              <div className="flex gap-x-2 flex-wrap mt-3">
                {
                  //@ts-ignore
                  automation.keywords.map((keyword, key) => (
                    <div
                      key={keyword.id}
                      className={cn(
                        'rounded-full px-4 py-1 capitalize',
                        (0 + 1) % 1 == 0 &&
                          'bg-keyword-green/15 border-2 border-keyword-green',
                        (1 + 1) % 2 == 0 &&
                          'bg-keyword-purple/15 border-2 border-keyword-purple',
                        (2 + 1) % 3 == 0 &&
                          'bg-keyword-yellow/15 border-2 border-keyword-yellow',
                        (3 + 1) % 4 == 0 &&
                          'bg-keyword-red/15 border-2 border-keyword-red'
                      )}
                    >
                      {keyword.word}
                    </div>
                  ))
                }
              </div>
            ) : (
              <div className="rounded-full border-2 mt-3 border-dashed border-white/60 px-3 py-1">
                <p className="text-sm text-[#bfc0c3]">No Keywords</p>
              </div>
            )}
          </div>
          <div className="flex flex-col justify-between">
            <p className="capitalize text-sm font-light text-[#9B9CA0]">
              {(() => {
                // ✅ Fast date formatting
                const date = new Date(automation.createdAt)
                return `${getMonth(date.getUTCMonth() + 1)} ${date.getUTCDate() === 1 ? `${date.getUTCDate()}st` : `${date.getUTCDate()}th`} ${date.getUTCFullYear()}`
              })()}
            </p>

            {automation.listener?.listener === 'SMARTAI' ? (
              <GradientButton
                type="BUTTON"
                className="w-full bg-background-80 text-white hover:bg-background-80"
              >
                Smart AI
              </GradientButton>
            ) : (
              <Button className="bg-background-80 hover:bg-background-80 text-white">
                Standard
              </Button>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}

export default AutomationList
