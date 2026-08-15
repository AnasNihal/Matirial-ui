'use client'

import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import React from 'react'

type Props = {}

const SearchButton = (props: Props) => {
  return (
    <div className="flex overflow-hidden gap-x-2 border-[1px] border-app-border rounded-lg px-4 py-2 items-center bg-app-card-bg hover:border-app-blue transition-colors flex-1 max-w-md">
      <Search className="w-4 h-4 text-app-text-secondary flex-shrink-0" />
      <Input
        placeholder="Search automations"
        className="border-none outline-none ring-0 focus:ring-0 bg-transparent text-sm text-app-text-primary placeholder:text-app-text-tertiary flex-1 min-w-0"
      />
    </div>
  )
}

export default SearchButton

