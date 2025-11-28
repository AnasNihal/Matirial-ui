import { getAutomationInfo } from '@/actions/automations'
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query'
import { PrefetchUserAutomation } from '@/react-query/prefetch'
import React from 'react'
import AutomationBuilder from '@/components/global/automations/builder/automation-builder'

type Props = {
  params: { id: string; slug: string }
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const info = await getAutomationInfo(params.id)
  return {
    title: info.data?.name || 'Automation',
  }
}

const Page = async ({ params }: Props) => {
  const query = new QueryClient()
  await PrefetchUserAutomation(query, params.id)

  return (
    <HydrationBoundary state={dehydrate(query)}>
      <AutomationBuilder id={params.id} />
    </HydrationBoundary>
  )
}

export default Page
