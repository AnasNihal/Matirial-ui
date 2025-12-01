'use client'
import { onOAuthInstagram } from '@/actions/integrations'
import { Button } from '@/components/ui/button'
import { useQueryUser } from '@/hooks/user-queries'
import React from 'react'

type Props = {
  title: string
  description: string
  icon: React.ReactNode
  strategy: 'INSTAGRAM' | 'CRM'
}

const IntegrationCard = ({ description, icon, strategy, title }: Props) => {

  const onInstaOAuth = () => onOAuthInstagram(strategy)

  // ✅ Use the same hook as other components for consistency
  const { data, isLoading, error, isFetching } = useQueryUser()

  // ✅ Safe access to integrations - handle null data
  const integrations = data?.data?.integrations || []
  const integrated = integrations.find(
    (integration) => integration.name === strategy
  )
  
  // ✅ Show loading state only on initial load (not when refetching)
  if (isLoading && !data) {
    console.log('🔍 [IntegrationCard] Loading - showing skeleton')
    return (
      <div className="border-2 border-[#3352CC] rounded-2xl gap-x-5 p-5 flex items-center justify-between animate-pulse">
        <div className="w-12 h-12 bg-gray-700 rounded" />
        <div className="flex flex-col flex-1 gap-2">
          <div className="h-6 bg-gray-700 rounded w-32" />
          <div className="h-4 bg-gray-700 rounded w-48" />
        </div>
        <div className="h-10 bg-gray-700 rounded-full w-24" />
      </div>
    )
  }
  
  // ✅ Show error state but still render (don't block UI)
  if (error) {
    console.error('❌ [IntegrationCard] Error loading user data:', error)
    console.error('❌ [IntegrationCard] Error details:', {
      message: error?.message,
      stack: error?.stack,
    })
  }
  
  // ✅ Handle case where data is null (user not found in DB yet)
  if (!data?.data) {
    console.warn('⚠️ [IntegrationCard] No user data, showing Connect button')
    console.log('🔍 [IntegrationCard] Data state:', {
      hasData: !!data,
      dataStatus: data?.status,
      isLoading,
      isFetching,
    })
  }

  return (
    <div className="border-2 border-[#3352CC] rounded-2xl gap-x-5 p-5 flex items-center justify-between">
      {icon}
      <div className="flex flex-col flex-1">
        <h3 className="text-xl"> {title}</h3>
        <p className="text-[#9D9D9D] text-base ">{description}</p>
      </div>
      <Button
        onClick={onInstaOAuth}
        disabled={integrated?.name === strategy}
        className="bg-gradient-to-br text-white rounded-full text-lg from-[#3352CC] font-medium to-[#1C2D70] hover:opacity-70 transition duration-100"
      >
        {integrated ? 'Connected' : 'Connect'}
      </Button>
    </div>
  )
}

export default IntegrationCard
