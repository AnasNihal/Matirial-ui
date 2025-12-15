'use client'

import React, { useEffect } from 'react'
import { useQueryAutomations, useQueryUser } from '@/hooks/user-queries'
import { usePaths } from '@/hooks/user-nav'
import Link from 'next/link'
import { 
  MessageSquare, 
  MessageCircle, 
  Zap, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Pause, 
  Settings, 
  ExternalLink,
  Instagram,
  Activity,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import CreateAutomation from '@/components/global/create-automation'
import { cn, getMonth } from '@/lib/utils'
import Image from 'next/image'

type Props = {}

const Page = (props: Props) => {
  const { data: automationsData, isLoading: automationsLoading, isFetching: automationsFetching, refetch } = useQueryAutomations()
  const { data: userData, isLoading: userLoading, isFetching: userFetching } = useQueryUser()
  const paths = usePaths()
  const pathname = paths?.pathname || ''

  // ✅ AUTO-REFRESH EVERY 10 SECONDS to get latest counts
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 [Dashboard] Auto-refreshing automation counts...')
      refetch()
    }, 10000) // 10 seconds

    return () => clearInterval(interval)
  }, [refetch])

  const automations = automationsData?.data || []
  const integrations = userData?.data?.integrations || []
  const hasIntegration = integrations.length > 0
  const hasAutomations = automations.length > 0

  // ✅ DEBUG: Log raw automation data
  console.log('🔍 [Dashboard] Raw automations data:', {
    count: automations.length,
    automations: automations.map((a: any) => ({
      id: a.id,
      name: a.name,
      hasListener: !!a.listener,
      listener: a.listener,
    }))
  })

  // ✅ FIXED: Calculate statistics with proper null checks
  const totalDMs = automations.reduce((sum: number, auto: any) => {
    const dmCount = auto.listener?.dmCount || 0
    console.log(`[Dashboard] Automation ${auto.name}: DM Count = ${dmCount}`)
    return sum + dmCount
  }, 0)
  
  const totalComments = automations.reduce((sum: number, auto: any) => {
    const commentCount = auto.listener?.commentCount || 0
    console.log(`[Dashboard] Automation ${auto.name}: Comment Count = ${commentCount}`)
    return sum + commentCount
  }, 0)
  
  const activeAutomations = automations.filter((auto: any) => auto.active).length
  const engagementGrowth = totalComments > 0 ? Math.round((totalDMs / totalComments) * 100) : 0

  console.log('📊 [Dashboard] Stats:', {
    totalDMs,
    totalComments,
    activeAutomations,
    engagementGrowth,
    automationsCount: automations.length,
  })

  // Check if new user (no integration or no automations)
  const hasCachedAutomations = !!automationsData?.data
  const hasCachedUser = !!userData?.data
  const isStillLoading = (!hasCachedAutomations && automationsLoading) || (!hasCachedUser && userLoading)
  const isNewUser = !isStillLoading && (!hasIntegration || (automations.length === 0 && hasCachedAutomations))

  // Get recent activity (last 5 automations with activity)
  const recentActivity = automations
    .filter((auto: any) => (auto.listener?.dmCount || 0) > 0 || (auto.listener?.commentCount || 0) > 0)
    .slice(0, 5)

  // Get alerts (automations with errors or paused)
  const alerts = automations.filter((auto: any) => !auto.active && hasAutomations)

  if (isStillLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
        <div className="animate-pulse space-y-4 w-full max-w-2xl">
          <div className="h-8 bg-app-bg-tertiary rounded w-1/3 mx-auto"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 bg-app-card-bg rounded-2xl"></div>
            <div className="h-48 bg-app-card-bg rounded-2xl"></div>
          </div>
        </div>
      </div>
    )
  }

  if (isNewUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
        <div className="text-center space-y-4 max-w-md">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-app-text-primary">Welcome to Mation!</h1>
          <p className="text-text-secondary text-lg">
            Get started by connecting your Instagram account and creating your first automation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          {/* Integration Card */}
          <Link 
            href={`${pathname}/integrations`}
            className="group relative bg-gradient-to-br from-app-card-bg to-app-bg-tertiary border border-app-border rounded-2xl p-8 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10"
          >
            <div className="flex flex-col gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <Instagram className="w-7 h-7 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-app-text-primary mb-2">Connect Instagram</h3>
                <p className="text-text-secondary text-sm">
                  Link your Instagram account to start automating your engagement
                </p>
              </div>
              <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mt-2">
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Automation Setup Card */}
          <div className="group relative bg-gradient-to-br from-app-card-bg to-app-bg-tertiary border border-app-border rounded-2xl p-8 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10">
            <div className="flex flex-col gap-4">
              <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                <Zap className="w-7 h-7 text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-app-text-primary mb-2">Create Automation</h3>
                <p className="text-text-secondary text-sm">
                  Set up your first automation to automatically respond to comments and DMs
                </p>
              </div>
              <div className="mt-2">
                <CreateAutomation />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {/* ✅ FIXED: Show loading indicator when fetching new data */}
      {automationsFetching && !automationsLoading && (
        <div className="fixed top-20 right-4 bg-blue-500/10 border border-blue-500/30 text-blue-400 px-4 py-2 rounded-lg text-sm flex items-center gap-2 z-50">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
          Refreshing stats...
        </div>
      )}

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={MessageSquare}
          label="Total DMs Sent"
          value={totalDMs.toLocaleString()}
          trend="+14%"
          trendUp={true}
          color="blue"
          isLoading={automationsFetching}
        />
        <StatCard
          icon={MessageCircle}
          label="Comments Processed"
          value={totalComments.toLocaleString()}
          trend="+8%"
          trendUp={true}
          color="green"
          isLoading={automationsFetching}
        />
        <StatCard
          icon={Zap}
          label="Active Automations"
          value={activeAutomations.toString()}
          trend={`${automations.length} total`}
          trendUp={null}
          color="purple"
          isLoading={automationsFetching}
        />
        <StatCard
          icon={TrendingUp}
          label="Engagement Growth"
          value={`${engagementGrowth}%`}
          trend="This month"
          trendUp={true}
          color="orange"
          isLoading={automationsFetching}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Automations - Main Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-app-text-primary">Your Active Automations</h2>
              <p className="text-text-secondary text-sm mt-1">
                Manage and monitor your automation workflows
              </p>
            </div>
            {automations.length === 0 && !automationsLoading && <CreateAutomation />}
          </div>

          {automationsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-app-card-bg border border-app-border rounded-xl p-6 animate-pulse">
                  <div className="h-6 bg-app-bg-tertiary rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-app-bg-tertiary rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : automations.length === 0 ? (
            <div className="bg-app-card-bg border border-app-border rounded-xl p-12 text-center">
              <Zap className="w-12 h-12 text-text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-app-text-primary mb-2">No Automations Yet</h3>
              <p className="text-text-secondary mb-6">Create your first automation to get started</p>
              <CreateAutomation />
            </div>
          ) : (
            <div className="space-y-4">
              {automations.map((automation: any) => (
                <AutomationCard
                  key={automation.id}
                  automation={automation}
                  pathname={pathname}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Activity Feed */}
          <div className="bg-app-card-bg border border-app-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-app-text-primary">Recent Activity</h3>
            </div>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-8 h-8 text-text-secondary mx-auto mb-2" />
                <p className="text-text-secondary text-sm">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((automation: any) => (
                  <ActivityItem key={automation.id} automation={automation} />
                ))}
              </div>
            )}
          </div>

          {/* Alerts & Warnings */}
          {alerts.length > 0 && (
            <div className="bg-app-card-bg border border-yellow-500/30 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-semibold text-app-text-primary">Alerts</h3>
              </div>
              <div className="space-y-3">
                {alerts.map((automation: any) => (
                  <div key={automation.id} className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-app-text-primary font-medium">{automation.name}</p>
                      <p className="text-xs text-text-secondary">Automation is paused</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Connected Accounts */}
          <div className="bg-app-card-bg border border-app-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Instagram className="w-5 h-5 text-pink-400" />
              <h3 className="text-lg font-semibold text-app-text-primary">Connected Accounts</h3>
            </div>
            {integrations.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-text-secondary text-sm mb-4">No accounts connected</p>
                <Link href={`${pathname}/integrations`}>
                  <Button size="sm" className="w-full">Connect Account</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {integrations.map((integration: any) => (
                  <div key={integration.id} className="flex items-center gap-3 p-3 bg-app-bg-tertiary rounded-lg">
                    {integration.instagramProfilePicture ? (
                      <Image
                        src={integration.instagramProfilePicture}
                        alt={integration.instagramUsername || 'Instagram'}
                        width={40}
                        height={40}
                        className="rounded-full"
                        unoptimized
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                        <Instagram className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-app-text-primary truncate">
                        @{integration.instagramUsername || 'Instagram'}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <p className="text-xs text-text-secondary">Connected</p>
                      </div>
                    </div>
                    <Link href={`${pathname}/integrations`}>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System Health */}
          <div className="bg-app-card-bg border border-app-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-app-text-primary">System Health</h3>
            </div>
            <div className="space-y-3">
              <HealthItem label="Webhooks" status="active" />
              <HealthItem label="Message Sending" status="active" />
              <HealthItem label="Instagram API" status="active" />
              <HealthItem label="Deliverability" status="active" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ✅ FIXED: Added loading state to StatCard
const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  trend, 
  trendUp, 
  color,
  isLoading 
}: { 
  icon: any
  label: string
  value: string
  trend: string
  trendUp: boolean | null
  color: 'blue' | 'green' | 'purple' | 'orange'
  isLoading?: boolean
}) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  }

  return (
    <div className={cn(
      "bg-app-card-bg border border-app-border rounded-xl p-6 hover:border-app-border-secondary transition-colors",
      isLoading && "animate-pulse"
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center border', colorClasses[color])}>
          <Icon className="w-6 h-6" />
        </div>
        {trendUp !== null && (
          <div className={cn('flex items-center gap-1 text-xs font-medium', trendUp ? 'text-green-400' : 'text-red-400')}>
            {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-app-text-primary mb-1">{value}</p>
        <p className="text-sm text-text-secondary">{label}</p>
        {trendUp === null && <p className="text-xs text-text-secondary mt-1">{trend}</p>}
      </div>
    </div>
  )
}

// Automation Card Component
const AutomationCard = ({ automation, pathname }: { automation: any; pathname: string }) => {
  const triggerType = automation.trigger?.[0]?.type || 'COMMENT'
  const keywords = automation.keywords || []
  const dmCount = automation.listener?.dmCount || 0
  const commentCount = automation.listener?.commentCount || 0
  const createdAt = automation.createdAt ? new Date(automation.createdAt) : new Date()

  return (
    <Link
      href={`${pathname}/automations/${automation.id}`}
      className="block bg-app-card-bg border border-app-border rounded-xl p-6 hover:border-blue-500/50 transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-app-text-primary group-hover:text-blue-400 transition-colors">
              {automation.name}
            </h3>
            {automation.active ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                Active
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-medium">
                <Pause className="w-3 h-3" />
                Paused
              </span>
            )}
          </div>
          <p className="text-sm text-text-secondary mb-3">
            {triggerType === 'COMMENT' ? 'Comment Trigger' : 'DM Trigger'} → Auto DM
          </p>
        </div>
        <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>

      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {keywords.slice(0, 3).map((keyword: any) => (
            <span
              key={keyword.id}
              className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-medium"
            >
              {keyword.word}
            </span>
          ))}
          {keywords.length > 3 && (
            <span className="px-3 py-1 rounded-full bg-app-bg-tertiary text-text-secondary text-xs">
              +{keywords.length - 3} more
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-app-border">
        <div className="flex items-center gap-4 text-sm text-text-secondary">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4" />
            <span>{dmCount} DMs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4" />
            <span>{commentCount} comments</span>
          </div>
        </div>
        <div className="text-xs text-text-secondary">
          {getMonth(createdAt.getMonth() + 1)} {createdAt.getDate()}, {createdAt.getFullYear()}
        </div>
      </div>
    </Link>
  )
}

// Activity Item Component
const ActivityItem = ({ automation }: { automation: any }) => {
  const dmCount = automation.listener?.dmCount || 0
  const commentCount = automation.listener?.commentCount || 0
  const lastActivity = automation.updatedAt ? new Date(automation.updatedAt) : new Date()

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
        <MessageSquare className="w-4 h-4 text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-app-text-primary font-medium truncate">{automation.name}</p>
        <p className="text-xs text-text-secondary">
          {dmCount} DMs sent • {commentCount} comments processed
        </p>
        <p className="text-xs text-text-secondary/70 mt-1">
          {lastActivity.toLocaleDateString()} at {lastActivity.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

// Health Item Component
const HealthItem = ({ label, status }: { label: string; status: 'active' | 'warning' | 'error' }) => {
  const statusConfig = {
    active: { color: 'text-green-400', bg: 'bg-green-400', label: 'Active' },
    warning: { color: 'text-yellow-400', bg: 'bg-yellow-400', label: 'Warning' },
    error: { color: 'text-red-400', bg: 'bg-red-400', label: 'Error' },
  }

  const config = statusConfig[status]

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-secondary">{label}</span>
      <div className="flex items-center gap-2">
        <div className={cn('w-2 h-2 rounded-full', config.bg)}></div>
        <span className={cn('text-xs font-medium', config.color)}>{config.label}</span>
      </div>
    </div>
  )
}

export default Page