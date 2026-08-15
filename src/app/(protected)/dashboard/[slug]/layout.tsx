import InfoBar from '@/components/global/infobar'
import Sidebar from '@/components/global/sidebar'
import BottomNav from '@/components/global/bottom-nav'
import React from 'react'

type Props = {
  children: React.ReactNode
  params: { slug: string }
}

const Layout = async ({ children, params }: Props) => {
  // ✅ SIMPLIFIED: No server-side prefetch, let client handle it with React Query
  return (
      <div className="p-3">
        <Sidebar slug={params.slug} />
        <div
          className="
      lg:ml-[250px] 
      lg:pl-10 
      lg:pt-2
      flex 
      flex-col 
      overflow-auto
      pb-20
      lg:pb-5
      "
        >
          <InfoBar slug={params.slug} />
          {children}
        </div>
        <BottomNav slug={params.slug} />
      </div>
  )
}

export default Layout
