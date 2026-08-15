'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { onOAuthInstagram } from '@/actions/integrations'
import { Instagram } from 'lucide-react'

type Props = {
  open: boolean
  instagramUsername?: string | null
}

export default function IntegrationWarningModal({ open, instagramUsername }: Props) {
  const handleFixNow = () => {
    // Directly trigger Instagram OAuth integration
    onOAuthInstagram('INSTAGRAM')
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md p-0 gap-0 bg-white dark:bg-[#1a1a1a] border-0 rounded-2xl overflow-hidden [&>button]:hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-[#3352CC] to-[#1C2D70] px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="text-white font-semibold text-lg">Mation</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Main Message */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#3352CC] dark:text-[#5B7FFF]">
              Mation is no longer authorized to connect to @{instagramUsername || 'your_account'}.
            </h2>

            {/* Visual Connection Indicator */}
            <div className="flex items-center justify-center gap-4 py-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3352CC] to-[#1C2D70] flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600"></div>
                <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600"></div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                <Instagram className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleFixNow}
              className="w-full bg-gradient-to-r from-[#3352CC] to-[#1C2D70] hover:opacity-90 text-white font-medium py-6 rounded-xl"
            >
              Fix Now
            </Button>
          </div>

          {/* Instructional Text */}
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Please click 'Fix Now' to re-enable automation.
          </p>

          {/* Support Information */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
              If you have any questions or you're not sure why you're receiving this, contact at{' '}
              <a href="mailto:contact@mation.com" className="text-[#3352CC] dark:text-[#5B7FFF] hover:underline">
                contact@mation.com
              </a>
              .
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
              We're happy to help.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

