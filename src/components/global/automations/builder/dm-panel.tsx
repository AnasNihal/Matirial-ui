'use client'

import React from 'react'
import { useListener } from '@/hooks/use-automations'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useQueryAutomation } from '@/hooks/user-queries'

type Props = {
  id: string
  isActive: boolean
  onFocus: () => void
  dmPreview: string
  setDmPreview: (t: string) => void
  dmEnabled: boolean
  setDmEnabled: (b: boolean) => void
}

const DmPanel = ({
  id,
  isActive,
  onFocus,
  dmPreview,
  setDmPreview,
  dmEnabled,
  setDmEnabled,
}: Props) => {
  const { onSetListener, onFormSubmit, register, isPending } = useListener(id)
  const { data } = useQueryAutomation(id)

  React.useEffect(() => {
    if (data?.data?.listener && !dmPreview) {
      setDmPreview(data.data.listener.prompt)
      setDmEnabled(true)
    }
  }, [data?.data?.listener, dmPreview, setDmPreview, setDmEnabled])  // ✅ Fix: Add missing dependencies

  return (
    <div
      className={`rounded-xl border ${
        isActive ? 'border-blue-500' : 'border-[#2a2a2a]'
      } bg-[#101010] p-4`}
      onClick={onFocus}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-medium">3. DM reply</p>
          <p className="text-xs text-text-secondary">
            We send this DM when the keyword is detected.
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs">
          <span className="text-text-secondary">Enable</span>
          <input
            type="checkbox"
            checked={dmEnabled}
            onChange={() => setDmEnabled(!dmEnabled)}
          />
        </label>
      </div>

      {dmEnabled && (
        <form
          onSubmit={(e) => {
            onSetListener('MESSAGE')
            onFormSubmit(e)
          }}
          className="flex flex-col gap-3 mt-2"
        >
          <Textarea
            {...register('prompt')}
            value={dmPreview}
            onChange={(e) => setDmPreview(e.target.value)}
            className="bg-[#121212] border-[#333] text-xs min-h-[120px]"
            placeholder="Thanks for commenting! Here’s the link / info..."
          />

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-xs"
          >
            {isPending ? 'Saving...' : 'Save DM reply'}
          </Button>
        </form>
      )}
    </div>
  )
}

export default DmPanel
