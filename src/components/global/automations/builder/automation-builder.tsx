'use client'

import React from 'react'
import { useQueryAutomation } from '@/hooks/user-queries'
import { useEditAutomation } from '@/hooks/use-automations'
import { useMutationDataState } from '@/hooks/use-mutation-data'
import { Input } from '@/components/ui/input'
import { ChevronLeft, ChevronRight, PencilIcon } from 'lucide-react'
import ActivateAutomationButton from '@/components/global/activate-automation-button'

import PhonePreview from './phone-preview'
import PostPanel from './post-panel'
import KeywordPanel from './keyword-panel'
import DmPanel from './dm-panel'

type Props = {
  id: string
}

export default function AutomationBuilder({ id }: Props) {
  const { data } = useQueryAutomation(id)
  const { edit, enableEdit, inputRef, isPending } = useEditAutomation(id)
  const { latestVariable } = useMutationDataState(['update-automation'])

  // ✅ Fixed States
  const [activeStep, setActiveStep] = React.useState<'post' | 'keyword' | 'dm'>('post')

  const [previewPost, setPreviewPost] = React.useState<{
    id: string
    media: string
    caption?: string
  } | null>(null)

  const [keyword, setKeyword] = React.useState('')
  const [dmText, setDmText] = React.useState(
    'Thanks for your comment! We’ll DM you more details 😊'
  )
  const [dmEnabled, setDmEnabled] = React.useState(false)

  // ✅ Hydrate preview on first load ONLY
  const hasLoaded = React.useRef(false)

  React.useEffect(() => {
    if (!data?.data || hasLoaded.current) return

    const auto = data.data

    if (auto.posts?.length > 0) {
      setPreviewPost({
        id: auto.posts[0].postid,
        media: auto.posts[0].media,
        caption: auto.posts[0].caption ?? undefined,
      })
    }

    if (auto.keywords?.length > 0) {
      setKeyword(auto.keywords[0].word)
    }

    if (auto.listener?.prompt) {
      setDmText(auto.listener.prompt)
      setDmEnabled(true)
    }

    hasLoaded.current = true
  }, [data?.data])

  if (!data?.data) {
    return (
      <div className="h-[70vh] flex items-center justify-center text-text-secondary">
        Loading automation...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-y-8">

      {/* ================= TOP BAR ================= */}
      <div className="flex items-center justify-between gap-x-4 bg-[#111] border border-[#2a2a2a] rounded-2xl px-5 py-4">

        <div className="flex items-center gap-x-3 min-w-0">
          <button
            className="rounded-full border border-[#333] p-2 hover:bg-[#1a1a1a]"
            onClick={() => history.back()}
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex flex-col min-w-0">
            <p className="text-xs text-text-secondary/70">Automation</p>

            <div className="flex items-center gap-x-2 min-w-0">
              {edit ? (
                <Input
                  ref={inputRef}
                  placeholder={isPending ? latestVariable?.variables : 'Add a new name'}
                  className="bg-transparent h-auto outline-none text-base border-none p-0"
                />
              ) : (
                <p className="text-base truncate">
                  {latestVariable?.variables
                    ? latestVariable.variables.name
                    : data.data.name}
                </p>
              )}

              {!edit && (
                <button
                  className="flex-shrink-0 hover:opacity-75"
                  onClick={enableEdit}
                >
                  <PencilIcon size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-x-4">
          <span className="hidden md:inline text-xs text-text-secondary/70">
            Changes are saved automatically
          </span>
          <ActivateAutomationButton id={id} />
        </div>
      </div>

      {/* ================= MAIN GRID ================= */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* PHONE PREVIEW */}
        <div className="flex justify-center">
          <PhonePreview
            selectedPost={previewPost}
            keyword={keyword}
            dmText={dmText}
            dmEnabled={dmEnabled}
            activeStep={activeStep}
          />
        </div>

        {/* RIGHT SIDE */}
        <div className="flex flex-col gap-4">

          {/* STEP INDICATOR */}
          <div className="flex items-center justify-between text-xs text-text-secondary">

            <div className="flex gap-x-2">
              {['post', 'keyword', 'dm'].map((step) => (
                <button
                  key={step}
                  onClick={() => setActiveStep(step as 'post' | 'keyword' | 'dm')}
                  className={`px-3 py-1 rounded-full border text-xs capitalize ${
                    activeStep === step
                      ? 'border-blue-500 text-white bg-blue-500/10'
                      : 'border-[#333] hover:bg-[#181818]'
                  }`}
                >
                  {step}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-x-2">
              <span>
                {activeStep === 'post' && 'Select post'}
                {activeStep === 'keyword' && 'Add keyword'}
                {activeStep === 'dm' && 'Configure DM'}
              </span>

              <button
                onClick={() => {
                  if (activeStep === 'post') setActiveStep('keyword')
                  else if (activeStep === 'keyword') setActiveStep('dm')
                }}
                className="rounded-full border border-[#333] p-1 hover:bg-[#181818]"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* PANELS */}
          <div className="flex flex-col gap-4">

            <PostPanel
              id={id}
              isActive={activeStep === 'post'}
              onFocus={() => setActiveStep('post')}
              selectedPost={previewPost}
              setSelectedPost={setPreviewPost}
            />

            <KeywordPanel
              id={id}
              isActive={activeStep === 'keyword'}
              onFocus={() => setActiveStep('keyword')}
              keywordPreview={keyword}
              setKeywordPreview={setKeyword}
            />

            <DmPanel
              id={id}
              isActive={activeStep === 'dm'}
              onFocus={() => setActiveStep('dm')}
              dmPreview={dmText}
              setDmPreview={setDmText}
              dmEnabled={dmEnabled}
              setDmEnabled={setDmEnabled}
            />

          </div>
        </div>
      </div>
    </div>
  )
}
