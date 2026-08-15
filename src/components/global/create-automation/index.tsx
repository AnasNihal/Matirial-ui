'use client'

import { Button } from '@/components/ui/button'
import React, { useRef, useState } from 'react'
import Loader from '../loader'
import { AutomationDuoToneWhite } from '@/icons'
import { useCreateAutomation } from '@/hooks/use-automations'
import { v4 } from 'uuid'
import { useRouter } from 'next/navigation'

type Props = {}

const CreateAutomation = (props: Props) => {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const mutationIdRef = useRef<string | null>(null)

  const { isPending, mutate } = useCreateAutomation()

  const handleCreate = React.useCallback(() => {
    // Prevent double-click/double-creation
    if (isPending || isCreating) {
      console.log('⚠️ [CreateAutomation] Already creating, ignoring click')
      return
    }

    setIsCreating(true)
    const newId = v4()
    mutationIdRef.current = newId

    console.log('🔵 [CreateAutomation] Creating automation with ID:', newId)

    mutate(
      {
        name: 'Untitled',
        id: newId,
        createdAt: new Date(),
        keywords: [],
      },
      {
        onSuccess: (response: any) => {
          console.log('✅ [CreateAutomation] Success response:', {
            status: response?.status,
            hasRes: !!response?.res,
            automationId: response?.res?.id,
          })
          
          if (response?.status === 200 && response?.res?.id) {
            // Navigate to the created automation
            const automationId = response.res.id
            const currentPath = window.location.pathname
            const basePath = currentPath.split('/automations')[0]
            console.log('🔵 [CreateAutomation] Navigating to:', `${basePath}/automations/${automationId}`)
            router.push(`${basePath}/automations/${automationId}`)
          } else {
            console.warn('⚠️ [CreateAutomation] Invalid response, not navigating')
          }
          setIsCreating(false)
        },
        onError: (error: any) => {
          console.error('❌ [CreateAutomation] Error:', error)
          setIsCreating(false)
        },
      }
    )
  }, [isPending, isCreating, mutate, router])

  return (
    <Button
      data-create-automation
      className="lg:px-10 py-6 bg-gradient-to-br hover:opacity-80 text-white rounded-full from-[#3352CC] font-medium to-[#1C2D70] disabled:opacity-50 disabled:cursor-not-allowed"
      onClick={handleCreate}
      disabled={isPending || isCreating}
    >
      <Loader state={isPending || isCreating}>
        <AutomationDuoToneWhite />
        <p className="lg:inline hidden">Create an Automation</p>
      </Loader>
    </Button>
  )
}

export default CreateAutomation
