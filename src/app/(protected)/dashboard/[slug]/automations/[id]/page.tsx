import { getAutomationInfo } from '@/actions/automations'
import React from 'react'
import AutomationBuilder from '@/components/global/automations/builder/automation-builder'

type Props = {
  params: { id: string; slug: string }
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    const info = await getAutomationInfo(params.id)
    return {
      title: info.data?.name || 'Automation',
    }
  } catch (error) {
    console.error('❌ [generateMetadata] Error:', error)
    return {
      title: 'Automation',
    }
  }
}

const Page = async ({ params }: Props) => {
  // ✅ SIMPLIFIED: Let client-side React Query handle prefetching
  // Server-side prefetching was causing QueryClient issues
  return <AutomationBuilder id={params.id} />
}

export default Page
