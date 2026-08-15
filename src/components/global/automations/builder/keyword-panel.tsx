'use client'

import { useKeywords } from '@/hooks/use-automations'
import { useQueryAutomation } from '@/hooks/user-queries'
import { Input } from '@/components/ui/input'

type Props = {
  id: string
  isActive: boolean
  onFocus: () => void
  keywordPreview: string
  setKeywordPreview: (k: string) => void
}

const KeywordPanel = ({
  id,
  isActive,
  onFocus,
  keywordPreview,
  setKeywordPreview,
}: Props) => {
  const { keyword, onValueChange, onKeyPress } = useKeywords(id)
  const { data } = useQueryAutomation(id)

  return (
    <div
      className={`rounded-xl border ${
        isActive ? 'border-blue-500' : 'border-app-border'
      } bg-app-card-bg p-4 xl:block border-0 xl:border`}
      onClick={onFocus}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-medium">2. Add keyword</p>
          <p className="text-xs text-text-secondary">
            We'll detect this keyword in comments or DMs.
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wide text-text-secondary">
          Required
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {data?.data?.keywords?.map((k) => (
          <span
            key={k.id}
            className="px-3 py-1 rounded-full bg-app-bg-secondary text-xs capitalize text-app-text-primary"
          >
            {k.word}
          </span>
        ))}
      </div>

      <Input
        value={keyword}
        onChange={(e) => {
          onValueChange(e)
          setKeywordPreview(e.target.value)
        }}
        onKeyDown={onKeyPress}
        placeholder="Type keyword and press Enter to save (e.g. 'demo', 'pricing')"
        className="bg-app-bg-tertiary border-app-border text-xs"
      />
    </div>
  )
}

export default KeywordPanel
