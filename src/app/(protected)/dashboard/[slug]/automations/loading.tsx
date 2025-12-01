// 🚀 INSTANT FEEDBACK: Show loading skeleton for automations page
import AutomationListSkeleton from '@/components/global/loader/automation-list-skeleton'

export default function Loading() {
  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-gray-700 rounded animate-pulse"></div>
        <div className="h-10 w-32 bg-gray-700 rounded animate-pulse"></div>
      </div>
      <AutomationListSkeleton />
    </div>
  )
}

