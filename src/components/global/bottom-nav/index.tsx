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
  const paths = usePaths()
  const page = paths?.page || ''
  const [isMoreOpen, setIsMoreOpen] = React.useState(false)

  const isActive = (label: string) => {
    if (label === 'home') {
      return page === slug || page === ''
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
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-app-bg-primary border-t border-app-border">
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
                  ? 'text-app-blue'
                  : 'text-text-secondary'
              )}
            >
              <div className={cn('flex items-center justify-center', active && 'text-app-blue')}>
                <IconComponent />
              </div>
              <span className={cn(
                'text-[10px] font-medium capitalize',
                active ? 'text-app-blue' : 'text-text-secondary'
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
                  ? 'text-app-blue'
                  : 'text-text-secondary'
              )}
            >
              <div className={cn('flex items-center justify-center', isMoreOpen && 'text-app-blue')}>
                <Grid />
              </div>
              <span className={cn(
                'text-[10px] font-medium',
                isMoreOpen ? 'text-app-blue' : 'text-text-secondary'
              )}>
                More
              </span>
            </button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[280px] bg-app-bg-primary border-app-border p-0"
          >
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-app-border">
                <h2 className="text-lg font-semibold text-app-text-primary">More</h2>
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
                            ? 'bg-app-bg-secondary text-app-blue'
                            : 'text-text-secondary hover:bg-app-bg-secondary hover:text-app-text-primary'
                        )}
                      >
                        <div className={cn('flex items-center justify-center', active && 'text-app-blue')}>
                          <IconComponent />
                        </div>
                        <span className="text-sm font-medium capitalize">
                          {item.label}
                        </span>
                      </Link>
                    )
                  })}

                  {/* Profile */}
                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-app-bg-secondary hover:text-app-text-primary transition-colors">
                    <User size={20} className="text-text-secondary" />
                    <div className="flex-1">
                      <ClerkAuthState />
                    </div>
                  </div>

                  {/* Help */}
                  <Link
                    href="#"
                    onClick={() => setIsMoreOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-app-bg-secondary hover:text-app-text-primary transition-colors"
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

