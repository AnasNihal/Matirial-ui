'use client'

import React from 'react'
import Link from 'next/link'
import { usePaths } from '@/hooks/user-nav'
import { cn } from '@/lib/utils'
import {
  HomeDuoToneWhite,
  AutomationDuoToneWhite,
  RocketDuoToneWhite,
  SettingsDuoToneWhite,
  ContactsDuoToneWhite,
  HelpDuoToneWhite,
  Grid,
} from '@/icons'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { User } from 'lucide-react'
import ClerkAuthState from '../clerk-auth-state'

type Props = {
  slug: string
}

const BottomNav = ({ slug }: Props) => {
  const { page } = usePaths()
  const [isMoreOpen, setIsMoreOpen] = React.useState(false)

  const isActive = (label: string) => {
    if (label === 'home') {
      return page === slug
    }
    return page === label
  }

  const mainNavItems = [
    {
      label: 'home',
      icon: HomeDuoToneWhite,
      href: `/dashboard/${slug}/`,
    },
    {
      label: 'automations',
      icon: AutomationDuoToneWhite,
      href: `/dashboard/${slug}/automations`,
    },
    {
      label: 'integrations',
      icon: RocketDuoToneWhite,
      href: `/dashboard/${slug}/integrations`,
    },
    {
      label: 'settings',
      icon: SettingsDuoToneWhite,
      href: `/dashboard/${slug}/settings`,
    },
  ]

  const moreNavItems = [
    {
      label: 'contacts',
      icon: ContactsDuoToneWhite,
      href: `/dashboard/${slug}/contacts`,
    },
  ]

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0e0e0e] border-t border-[#333336]">
      <div className="flex items-center justify-around px-2 py-2">
        {mainNavItems.map((item) => {
          const active = isActive(item.label)
          const IconComponent = item.icon
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-colors min-w-[60px] flex-1',
                active
                  ? 'text-[#768BDD]'
                  : 'text-[#9B9CA0]'
              )}
            >
              <div className={cn('flex items-center justify-center', active && 'text-[#768BDD]')}>
                <IconComponent />
              </div>
              <span className={cn(
                'text-[10px] font-medium capitalize',
                active ? 'text-[#768BDD]' : 'text-[#9B9CA0]'
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}

        {/* More Button */}
        <Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-colors min-w-[60px] flex-1',
                isMoreOpen
                  ? 'text-[#768BDD]'
                  : 'text-[#9B9CA0]'
              )}
            >
              <div className={cn('flex items-center justify-center', isMoreOpen && 'text-[#768BDD]')}>
                <Grid />
              </div>
              <span className={cn(
                'text-[10px] font-medium',
                isMoreOpen ? 'text-[#768BDD]' : 'text-[#9B9CA0]'
              )}>
                More
              </span>
            </button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[280px] bg-[#0e0e0e] border-[#333336] p-0"
          >
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-[#333336]">
                <h2 className="text-lg font-semibold text-white">More</h2>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                <div className="flex flex-col gap-1">
                  {moreNavItems.map((item) => {
                    const active = isActive(item.label)
                    const IconComponent = item.icon
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setIsMoreOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                          active
                            ? 'bg-[#0f0f0f] text-[#768BDD]'
                            : 'text-[#9B9CA0] hover:bg-[#0f0f0f] hover:text-white'
                        )}
                      >
                        <div className={cn('flex items-center justify-center', active && 'text-[#768BDD]')}>
                          <IconComponent />
                        </div>
                        <span className="text-sm font-medium capitalize">
                          {item.label}
                        </span>
                      </Link>
                    )
                  })}

                  {/* Profile */}
                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#9B9CA0] hover:bg-[#0f0f0f] hover:text-white transition-colors">
                    <User size={20} className="text-[#9B9CA0]" />
                    <div className="flex-1">
                      <ClerkAuthState />
                    </div>
                  </div>

                  {/* Help */}
                  <Link
                    href="#"
                    onClick={() => setIsMoreOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#9B9CA0] hover:bg-[#0f0f0f] hover:text-white transition-colors"
                  >
                    <HelpDuoToneWhite />
                    <span className="text-sm font-medium">Help</span>
                  </Link>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}

export default BottomNav

