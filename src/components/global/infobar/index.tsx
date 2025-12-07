'use client'

import { PAGE_BREAD_CRUMBS } from '@/constants/pages'
import { usePaths } from '@/hooks/user-nav'
import React from 'react'
import MainBreadCrumb from '../bread-crumbs/main-bread-crumb'

type Props = {
  slug: string
}

const InfoBar = ({ slug }: Props) => {
  const paths = usePaths()
  const page = paths?.page || ''
  const currentPage = PAGE_BREAD_CRUMBS.includes(page) || page == slug

  return (
    currentPage && (
      <div className="flex flex-col">
        <MainBreadCrumb
          page={page === slug ? 'Home' : page}
          slug={slug}
        />
      </div>
    )
  )
}

export default InfoBar
