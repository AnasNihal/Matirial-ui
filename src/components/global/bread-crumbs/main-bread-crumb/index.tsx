import { PAGE_ICON } from '@/constants/pages'
import React from 'react'
import { Button } from '@/components/ui/button'
import { HelpCircle } from 'lucide-react'

type Props = {
  page: string
  slug?: string
}

const MainBreadCrumb = ({ page, slug }: Props) => {
  return (
    <div className="flex flex-col items-start w-full py-4">
      <div className="radial--gradient inline-flex w-full py-3 lg:py-4 pr-16 gap-x-2 items-center justify-between">
        <span className="inline-flex gap-x-2 items-center">
          {PAGE_ICON[page.toUpperCase()]}
          <h2 className="font-semibold text-xl capitalize">{page}</h2>
        </span>
        <Button 
          variant="ghost" 
          className="text-text-secondary hover:text-app-text-primary hover:bg-app-bg-secondary ml-auto"
        >
          <HelpCircle className="w-5 h-5 mr-2" />
          Support
        </Button>
      </div>
    </div>
  )
}

export default MainBreadCrumb
