'use client'

import { useQueryAutomationPosts } from '@/hooks/user-queries'
import Image from 'next/image'
import { InstagramPostProps } from '@/types/posts.type'
import { Loader2, X, Check, Play, Zap } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import React from 'react'

type Props = {
  id: string
  isActive: boolean
  onFocus: () => void
  selectedPost: any
  setSelectedPost: (post: any) => void
}

const PostPanel = ({ id, isActive, onFocus, selectedPost, setSelectedPost }: Props) => {
  const { data, isLoading, isFetching, error } = useQueryAutomationPosts()
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [tempSelectedPost, setTempSelectedPost] = React.useState<any>(selectedPost)

  console.log('🔍 [PostPanel] Render:', {
    isLoading,
    isFetching,
    hasData: !!data,
    dataStatus: data?.status,
    hasDataArray: !!data?.data?.data,
    dataLength: data?.data?.data?.length || 0,
    error: error ? String(error) : null,
  })

  const igData = data?.data?.data as InstagramPostProps[] | undefined
  
  // Log reel detection for debugging
  if (igData && igData.length > 0) {
    const reels = igData.filter((p) => p.media_type === 'VIDEO')
    console.log('🔍 [PostPanel] Reels found:', reels.length, 'out of', igData.length, 'total posts')
    if (reels.length > 0) {
      reels.slice(0, 3).forEach((reel) => {
        console.log('🔍 [PostPanel] Reel sample:', {
          id: reel.id,
          hasThumbnail: !!reel.thumbnail_url,
          hasMediaUrl: !!reel.media_url,
          thumbnailUrl: reel.thumbnail_url || 'N/A',
        })
      })
    }
  }
  
  const initialPosts = igData?.slice(0, 3) || []
  const allPosts = igData || []

  const handleOpenModal = () => {
    setTempSelectedPost(selectedPost)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setTempSelectedPost(selectedPost)
  }

  const handleConfirmSelection = () => {
    if (tempSelectedPost) {
      setSelectedPost(tempSelectedPost)
    }
    setIsModalOpen(false)
  }

  const isReel = (post: InstagramPostProps) => {
    return post.media_type === 'VIDEO'
  }

  const isCarousel = (post: InstagramPostProps) => {
    return post.media_type === 'CAROSEL_ALBUM'
  }

  return (
    <div
      className={`rounded-xl border ${
        isActive ? 'border-blue-500' : 'border-app-border'
      } bg-app-card-bg p-4 xl:block border-0 xl:border`}
      onClick={onFocus}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-medium">1. Select post / reel</p>
          <p className="text-xs text-text-secondary">
            Choose which content this automation should listen to.
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wide text-text-secondary">Optional</span>
      </div>

      {(isLoading || isFetching) && !igData && (
        <div className="py-6 text-xs text-text-secondary flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Fetching Instagram posts...
        </div>
      )}

      {!isLoading && !isFetching && !igData && (
        <div className="py-4 text-xs text-text-secondary">
          {error ? (
            <span className="text-red-400">Error loading posts. Please try again.</span>
          ) : (
            'No posts found. Make sure your Instagram integration is connected.'
          )}
        </div>
      )}

      {!isLoading && !isFetching && igData && igData.length === 0 && (
        <div className="py-4 text-xs text-text-secondary">
          No recent media found on this Instagram account.
        </div>
      )}

      {igData && igData.length > 0 && (
        <>
          {/* Show only first 3 posts */}
          <div className="grid grid-cols-3 gap-3 mt-2">
            {initialPosts.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => {
                  const postData = {
                    id: post.id,
                    media: post.media_url,
                    caption: post.caption,
                    mediaType: post.media_type,
                    thumbnail: isReel(post) && post.thumbnail_url ? post.thumbnail_url : undefined,
                  }
                  // Store thumbnail in localStorage for reels so it persists after refresh
                  if (isReel(post) && post.thumbnail_url) {
                    try {
                      localStorage.setItem(`post_${post.id}`, JSON.stringify({
                        thumbnail: post.thumbnail_url
                      }))
                    } catch (e) {
                      console.warn('Failed to cache reel thumbnail:', e)
                    }
                  }
                  setSelectedPost(postData)
                }}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                  selectedPost?.id === post.id ? 'border-blue-500' : 'border-transparent'
                }`}
              >
                <Image
                  src={
                    // For videos/reels, use thumbnail_url if available, otherwise use media_url
                    isReel(post) && post.thumbnail_url
                      ? post.thumbnail_url
                      : post.media_url
                  }
                  alt={isReel(post) ? 'Reel' : isCarousel(post) ? 'Carousel' : 'Post'}
                  fill
                  className="object-cover"
                  unoptimized
                />
                {/* Media type indicators */}
                {isReel(post) && (
                  <div className="absolute bottom-1 left-1 bg-app-text-primary/70 dark:bg-black/70 rounded px-1.5 py-0.5 flex items-center gap-1 z-10">
                    <Play className="h-3 w-3 text-app-bg-primary dark:text-white fill-app-bg-primary dark:fill-white" />
                  </div>
                )}
                {isCarousel(post) && (
                  <div className="absolute bottom-1 left-1 bg-app-text-primary/60 dark:bg-black/60 rounded px-1.5 py-0.5">
                    <div className="w-3 h-3 border border-app-bg-primary dark:border-white rounded-sm" />
                  </div>
                )}
                {selectedPost?.id === post.id && (
                  <div className="absolute top-1 right-1 bg-app-blue rounded-full p-0.5">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* See More button if there are more than 3 posts */}
          {igData.length > 3 && (
            <button
              type="button"
              onClick={handleOpenModal}
              className="w-full mt-3 py-2 text-xs text-text-secondary hover:text-app-text-primary border border-app-border rounded-lg transition-colors"
            >
              See More ({igData.length - 3} more)
            </button>
          )}
        </>
      )}

      {/* Modal for selecting post/reel */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-app-card-bg rounded-3xl p-6 max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-app-border shadow-2xl">
          <DialogHeader className="flex-shrink-0 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold text-app-text-primary">
                Select Post or Reel
              </DialogTitle>
              <button
                onClick={handleCloseModal}
                className="text-text-secondary hover:text-app-text-primary transition-colors rounded-lg p-1 hover:bg-app-bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </DialogHeader>

          {/* Scrollable grid */}
          <div className="flex-1 overflow-y-auto mt-4 pr-2 custom-scrollbar">
            <div className="grid grid-cols-3 gap-3">
              {/* Create New Post/Reel option */}
              <button
                type="button"
                className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-purple-500 to-purple-700 border-2 border-app-border hover:border-app-border-secondary transition-all flex flex-col items-center justify-center group"
              >
                <Zap className="h-6 w-6 text-white mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-white text-xs font-medium text-center px-2">Next Post or Reel</span>
              </button>

              {allPosts.map((post) => {
                const isSelected = tempSelectedPost?.id === post.id
                // Use thumbnail_url for videos/reels if available, otherwise use media_url
                const imageUrl = (isReel(post) && post.thumbnail_url) 
                  ? post.thumbnail_url 
                  : post.media_url
                
                return (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => {
                      const postData = {
                        id: post.id,
                        media: post.media_url,
                        caption: post.caption,
                        mediaType: post.media_type,
                        thumbnail: isReel(post) && post.thumbnail_url ? post.thumbnail_url : undefined,
                      }
                      // Store thumbnail in localStorage for reels so it persists after refresh
                      if (isReel(post) && post.thumbnail_url) {
                        try {
                          localStorage.setItem(`post_${post.id}`, JSON.stringify({
                            thumbnail: post.thumbnail_url
                          }))
                        } catch (e) {
                          console.warn('Failed to cache reel thumbnail:', e)
                        }
                      }
                      setTempSelectedPost(postData)
                    }}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected ? 'border-purple-500 ring-2 ring-purple-200' : 'border-app-border hover:border-app-border-secondary'
                    }`}
                  >
                    <Image
                      src={imageUrl}
                      alt={isReel(post) ? 'Reel' : isCarousel(post) ? 'Carousel' : 'Post'}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {/* Selection checkmark */}
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-app-blue rounded-full p-1 z-10 shadow-lg">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                    {/* Media type indicators */}
                    {isReel(post) && (
                      <div className="absolute bottom-1 left-1 bg-app-text-primary/70 dark:bg-black/70 rounded px-1.5 py-0.5 flex items-center gap-1 z-10">
                        <Play className="h-3 w-3 text-app-bg-primary dark:text-white fill-app-bg-primary dark:fill-white" />
                      </div>
                    )}
                    {isCarousel(post) && (
                      <div className="absolute bottom-1 left-1 bg-app-text-primary/70 dark:bg-black/70 rounded px-1.5 py-0.5 z-10">
                        <div className="w-3 h-3 border border-app-bg-primary dark:border-white rounded-sm" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Confirm button */}
          <div className="flex-shrink-0 mt-4 pt-4 border-t border-app-border">
            <Button
              onClick={handleConfirmSelection}
              disabled={!tempSelectedPost}
              className="w-full bg-app-blue hover:bg-app-blue-dark disabled:bg-app-bg-tertiary disabled:text-text-secondary text-white rounded-lg h-10 font-medium"
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PostPanel
