  import { Button } from '@/components/ui/button'
  import { Loader2 } from 'lucide-react'
  import React, { useState, useEffect, useRef } from 'react'
  import { ActiveAutomation } from '@/icons/active-automation'

  type Props = {
    id: string
    isLive: boolean
    hasChanges: boolean
    onActivate: () => Promise<void>
    onDeactivate: () => Promise<void>
    onUpdate: () => Promise<void>
    onDiscard: () => void
    isPending: boolean
  }

  const ActivateAutomationButton = ({
    id,
    isLive,
    hasChanges,
    onActivate,
    onDeactivate,
    onUpdate,
    onDiscard,
    isPending,
  }: Props) => {
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setDropdownOpen(false)
        }
      }

      if (dropdownOpen) {
        document.addEventListener('mousedown', handleClickOutside)
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [dropdownOpen])

    if (!isLive) {
      return (
        <Button
          disabled={isPending}
          onClick={onActivate}
          className="lg:px-10 bg-gradient-to-br hover:opacity-80 text-white rounded-full from-[#3352CC] font-medium to-[#1C2D70] ml-4"
        >
          {isPending ? <Loader2 className="animate-spin mr-2" /> : <ActiveAutomation />}
          <p className="lg:inline hidden">Activate</p>
        </Button>
      )
    }

    if (isLive && !hasChanges) {
      return (
        <div className="relative ml-4 inline-flex items-center">
          <Button
            disabled={isPending}
            onClick={onDeactivate}
            className="lg:px-10 bg-gradient-to-br hover:opacity-80 text-white rounded-full from-[#D53F3F] font-medium to-[#802020]"
          >
            {isPending ? <Loader2 className="animate-spin mr-2" /> : <ActiveAutomation />}
            <p className="lg:inline hidden">Deactivate</p>
          </Button>
        </div>
      )
    }

    return (
      <div className="relative ml-4 inline-flex items-center" ref={dropdownRef}>
        <Button
          disabled={isPending}
          onClick={onUpdate}
          className="lg:px-6 bg-gradient-to-br hover:opacity-80 text-white rounded-full from-[#22C55E] font-medium to-[#166534] mr-2"
        >
          {isPending ? <Loader2 className="animate-spin mr-2" /> : <ActiveAutomation />}
          <p className="lg:inline hidden">Update</p>
        </Button>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-label="More options"
          className="bg-gray-800 hover:bg-gray-700 p-2 rounded-full"
          type="button"
        >
          ▼
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-10 w-48 bg-gray-900 border border-gray-700 rounded shadow-lg z-50">
            <button
              className="block w-full px-4 py-2 text-left text-white hover:bg-gray-700 rounded-t"
              onClick={async () => {
                setDropdownOpen(false)
                await onDeactivate()
              }}
            >
              Deactivate
            </button>
            <button
              className="block w-full px-4 py-2 text-left text-white hover:bg-gray-700 rounded-b"
              onClick={() => {
                setDropdownOpen(false)
                onDiscard()
              }}
            >
              Discard Changes
            </button>
          </div>
        )}
      </div>
    )
  }

  export default ActivateAutomationButton
