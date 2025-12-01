'use client'

import React from 'react'
import { useQueryAutomation } from '@/hooks/user-queries'
import { useEditAutomation } from '@/hooks/use-automations'
import { useMutationData, useMutationDataState } from '@/hooks/use-mutation-data'
import { Input } from '@/components/ui/input'
import { ChevronLeft, ChevronRight, PencilIcon } from 'lucide-react'
import ActivateAutomationButton from '@/components/global/activate-automation-button'
import AutomationBuilderSkeleton from '@/components/global/loader/automation-builder-skeleton'

import PhonePreview from './phone-preview'
import PostPanel from './post-panel'
import KeywordPanel from './keyword-panel'
import DmPanel from './dm-panel'

type Props = {
  id: string
}

export default function AutomationBuilder({ id }: Props) {
  // ✅ This will throw if QueryClientProvider is not set up
  // Error will be caught by ErrorLogger and logged to terminal
  const { data, refetch, isLoading } = useQueryAutomation(id)
  
  const { edit, enableEdit, inputRef, isPending: namePending } = useEditAutomation(id)
  const { latestVariable } = useMutationDataState(['update-automation'])

  const [activeStep, setActiveStep] = React.useState<'post' | 'keyword' | 'dm'>('post')

  const [previewPost, setPreviewPost] = React.useState<{
    id: string
    media: string
    caption?: string
    mediaType?: 'IMAGE' | 'VIDEO' | 'CAROSEL_ALBUM'
    thumbnail?: string
  } | null>(null)

  const [igUsername, setIgUsername] = React.useState('your_account')
  const [igProfilePic, setIgProfilePic] = React.useState<string | undefined>(undefined)

  const [keyword, setKeyword] = React.useState('')
  const [dmText, setDmText] = React.useState('Thanks for your comment! Well DM you more details 😊')
  const [dmEnabled, setDmEnabled] = React.useState(false)
  const [dmImage, setDmImage] = React.useState<string | null>(null)
  const [dmLinks, setDmLinks] = React.useState<Array<{ title: string; url: string }>>([])

  const [isLive, setIsLive] = React.useState(false)
  const [hasChanges, setHasChanges] = React.useState(false)

  const prevLoadedDataRef = React.useRef<any>(null)
  const skipNextDataUpdateRef = React.useRef(false)
  const isInitialLoadRef = React.useRef(true)

  const initialData = React.useRef({
    post: null as typeof previewPost,
    keyword: '',
    dmText: '',
    dmEnabled: false,
  })

  // Mutations for activate & update
  const { mutate: activateMutate, isPending: isActivating } = useMutationData(
    ['activate-automation'],
    (data: { state: boolean }) => import('@/actions/automations').then(mod => mod.activateAutomation(id, data.state)),
    undefined  // Don't invalidate queries automatically
  )
  const { mutate: updateMutate, isPending: isUpdating} = useMutationData(
    ['update-automation'],
    async () => {
      const { savePosts, saveKeyword, saveListener, saveTrigger } = await import('@/actions/automations')
      
      // ✅ VALIDATION: Check required fields
      if (!previewPost) {
        throw new Error('Please select a post before activating')
      }
      if (!keyword || keyword.trim() === '') {
        throw new Error('Please enter a keyword before activating')
      }
      if (dmEnabled && (!dmText || dmText.trim() === '')) {
        throw new Error('Please enter a DM message or disable DM')
      }
      
      // ✅ Save trigger first (COMMENT trigger for comment-to-DM automation)
      await saveTrigger(id, ['COMMENT'])
      
      await savePosts(id, [
        {
          postid: previewPost.id,
          media: previewPost.media,
          caption: previewPost.caption || undefined,  // ✅ Handle null/undefined
          mediaType: 'IMAGE',
        },
      ])
      
      await saveKeyword(id, keyword.trim())
      
      if (dmEnabled && dmText) {
        await saveListener(id, 'MESSAGE', dmText.trim())
      }
    },
    undefined  // Don't invalidate queries automatically
  )

  React.useEffect(() => {
    if (!data?.data) return
    
    // Skip update if we just saved manually (prevents reset)
    if (skipNextDataUpdateRef.current) {
      console.log('Skipping data update - we just saved manually')
      skipNextDataUpdateRef.current = false
      return
    }
    
    // Only update from server data on initial load
    if (!isInitialLoadRef.current) {
      console.log('Skipping data update - not initial load, using local state')
      return
    }
    
    console.log('Initial load: updating local state from server data')
    isInitialLoadRef.current = false
    prevLoadedDataRef.current = data.data

    const auto = data.data
    console.log('🔍 [AutomationBuilder] Processing automation data:', {
      hasPosts: !!auto.posts,
      postsLength: auto.posts?.length || 0,
      hasKeywords: !!auto.keywords,
      keywordsLength: auto.keywords?.length || 0,
      hasListener: !!auto.listener,
      hasUser: !!auto.User,
      hasIntegrations: !!auto.User?.integrations,
      integrationsLength: auto.User?.integrations?.length || 0,
    })

    if (auto.posts?.length > 0) {
      const postData = {
        id: auto.posts[0].postid,
        media: auto.posts[0].media,
        caption: auto.posts[0].caption ?? undefined,
        mediaType: auto.posts[0].mediaType as 'IMAGE' | 'VIDEO' | 'CAROSEL_ALBUM' | undefined,
        thumbnail: (auto.posts[0] as any).thumbnail || undefined,
      }
      console.log('🔍 [AutomationBuilder] Setting post data:', { 
        id: postData.id, 
        hasMedia: !!postData.media, 
        hasCaption: !!postData.caption,
        mediaType: postData.mediaType,
        hasThumbnail: !!postData.thumbnail,
      })
      setPreviewPost(postData)
      initialData.current.post = postData
    } else {
      console.log('🔍 [AutomationBuilder] No posts found, clearing post data')
      setPreviewPost(null)
      initialData.current.post = null
    }

    if (auto.keywords?.length > 0) {
      console.log('🔍 [AutomationBuilder] Setting keyword:', auto.keywords[0].word)
      setKeyword(auto.keywords[0].word)
      initialData.current.keyword = auto.keywords[0].word
    } else {
      console.log('🔍 [AutomationBuilder] No keywords found, clearing keyword')
      setKeyword('')
      initialData.current.keyword = ''
    }

    if (auto.listener?.prompt) {
      console.log('🔍 [AutomationBuilder] Setting listener prompt, length:', auto.listener.prompt.length)
      setDmText(auto.listener.prompt)
      setDmEnabled(true)
      initialData.current.dmText = auto.listener.prompt
      initialData.current.dmEnabled = true
    } else {
      console.log('🔍 [AutomationBuilder] No listener found, clearing DM data')
      setDmText('')
      setDmEnabled(false)
      initialData.current.dmText = ''
      initialData.current.dmEnabled = false
    }

    const integration = auto?.User?.integrations?.[0]
    console.log('🔍 [AutomationBuilder] Integration data:', {
      hasIntegration: !!integration,
      hasUsername: !!integration?.instagramUsername,
      hasProfilePic: !!integration?.instagramProfilePicture,
    })
    if (integration?.instagramUsername) {
      console.log('🔍 [AutomationBuilder] Setting Instagram username:', integration.instagramUsername)
      setIgUsername(integration.instagramUsername)
    }
    if (integration?.instagramProfilePicture) {
      console.log('🔍 [AutomationBuilder] Setting Instagram profile picture')
      setIgProfilePic(integration.instagramProfilePicture)
    }

    setIsLive(auto.active || false)
    setHasChanges(false)
  }, [data?.data])

  React.useEffect(() => {
    if (!isLive) {
      setHasChanges(false)
      return
    }
    const changed =
      previewPost?.id !== initialData.current.post?.id ||
      keyword !== initialData.current.keyword ||
      dmText !== initialData.current.dmText ||
      dmEnabled !== initialData.current.dmEnabled

    setHasChanges(changed)
  }, [previewPost, keyword, dmText, dmEnabled, isLive])


async function handleActivate() {
  try {
    await handleUpdate()   // save post + keyword + dmText FIRST
    await new Promise<void>((resolve, reject) => {
      activateMutate(
        { state: true },
        {
          onSuccess: () => {
            skipNextDataUpdateRef.current = true
            setIsLive(true)
            setHasChanges(false)
            // Update initial data to reflect the new state
            initialData.current = {
              post: previewPost,
              keyword,
              dmText,
              dmEnabled,
            }
            resolve()
          },
          onError: (error) => {
            console.error('Failed to activate automation:', error)
            alert('Failed to activate automation. Please try again.')
            reject(error)
          },
        }
      )
    })
  } catch (error: any) {
    console.error('Error in handleActivate:', error)
    // ✅ Show user-friendly error messages
    if (error.message) {
      alert(error.message)
    } else {
      alert('Failed to activate automation. Please check all fields are filled.')
    }
  }
}


  async function handleDeactivate() {
    try {
      await new Promise<void>((resolve, reject) => {
        activateMutate(
          { state: false },
          {
            onSuccess: () => {
              skipNextDataUpdateRef.current = true
              setIsLive(false)
              setHasChanges(false)
              resolve()
            },
            onError: (error) => {
              console.error('Failed to deactivate automation:', error)
              reject(error)
            },
          }
        )
      })
    } catch (error) {
      console.error('Error in handleDeactivate:', error)
    }
  }

  async function handleUpdate() {
    try {
      await new Promise<void>((resolve, reject) => {
        updateMutate(undefined, {
          onSuccess: () => {
            skipNextDataUpdateRef.current = true
            setHasChanges(false)
            // Update initial data after successful update
            initialData.current = {
              post: previewPost,
              keyword,
              dmText,
              dmEnabled,
            }
            resolve()
          },
          onError: (error) => {
            console.error('Failed to update automation:', error)
            reject(error)
          },
        })
      })
    } catch (error) {
      console.error('Error in handleUpdate:', error)
      throw error
    }
  }

  function handleDiscard() {
    setPreviewPost(initialData.current.post)
    setKeyword(initialData.current.keyword)
    setDmText(initialData.current.dmText)
    setDmEnabled(initialData.current.dmEnabled)
    setHasChanges(false)
  }

  // 🚀 ONLY show skeleton on TRUE first load (no cached data)
  if (!data?.data) {
    return <AutomationBuilderSkeleton />
  }

  return (
    <div className="flex flex-col gap-y-8">
      {/* TOP BAR */}
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
                  placeholder={namePending ? latestVariable?.variables : 'Add a new name'}
                  className="bg-transparent h-auto outline-none text-base border-none p-0"
                />
              ) : (
                <p className="text-base truncate">
                  {latestVariable?.variables ? latestVariable.variables.name : data.data.name}
                </p>
              )}

              {!edit && (
                <button className="flex-shrink-0 hover:opacity-75" onClick={enableEdit}>
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

          <ActivateAutomationButton
            id={id}
            isLive={isLive}
            hasChanges={hasChanges}
            onActivate={handleActivate}
            onDeactivate={handleDeactivate}
            onUpdate={handleUpdate}
            onDiscard={handleDiscard}
            isPending={isActivating || isUpdating}
          />
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* PHONE PREVIEW */}
        <div className="flex justify-center">
          <PhonePreview
            selectedPost={previewPost}
            keyword={keyword}
            dmText={dmText}
            dmEnabled={dmEnabled}
            activeStep={activeStep}
            username={igUsername}
            profilePic={igProfilePic}
            dmImage={dmImage}
            dmLinks={dmLinks}
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
              dmImage={dmImage}
              setDmImage={setDmImage}
              dmLinks={dmLinks}
              setDmLinks={setDmLinks}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
