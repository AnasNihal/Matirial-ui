import React from 'react'
import Link from 'next/link'
import { User } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  label?: string
  href?: string
}

const ClerkAuthState = ({ label = 'Profile', href = '/dashboard' }: Props) => {
  return (
    <Button
      className="w-full justify-start rounded-xl bg-[#252525] px-4 py-3 text-left text-white hover:bg-[#252525]/70"
      asChild
    >
      <Link href={href}>
        <span className="inline-flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="text-sm font-medium">{label}</span>
        </span>
      </Link>
    </Button>
  )
}

export default ClerkAuthState
