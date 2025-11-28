'use client'

import { useQueryAutomationPosts } from '@/hooks/user-queries'
import { useAutomationPosts } from '@/hooks/use-automations'
import Image from 'next/image'
import { InstagramPostProps } from '@/types/posts.type'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

type Props = {
  id: string
  isActive: boolean
  onFocus: () => void
  selectedPost: any
  setSelectedPost: (post: any) => void
}

const PostPanel = ({
  id,
  isActive,
  onFocus,
  selectedPost,
  setSelectedPost,
}: Props) => {
  const { data, isLoading } = useQueryAutomationPosts()
  const { posts, onSelectPost, mutate, isPending } = useAutomationPosts(id)

  const igData = data?.data?.data as InstagramPostProps[] | undefined
  console.log("INSTAGRAM DATA", data)


  return (
    <div
      className={`rounded-xl border ${
        isActive ? 'border-blue-500' : 'border-[#2a2a2a]'
      } bg-[#101010] p-4`}
      onClick={onFocus}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-medium">1. Select post / reel</p>
          <p className="text-xs text-text-secondary">
            Choose which content this automation should listen to.
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wide text-text-secondary">
          Optional
        </span>
      </div>

      {isLoading && (
        <div className="py-6 text-xs text-text-secondary flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Fetching Instagram posts...
        </div>
      )}

      {!isLoading && !igData && (
        <div className="py-4 text-xs text-text-secondary">
          No posts found. Make sure your Instagram integration is connected.
        </div>
      )}

      {!isLoading && igData && igData.length === 0 && (
        <div className="py-4 text-xs text-text-secondary">
          No recent media found on this Instagram account.
        </div>
      )}

      {igData && igData.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3 mt-2">
            {igData.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => {
                  setSelectedPost({
                    id: post.id,
                    media: post.media_url,
                    caption: post.caption,
                  })

                  onSelectPost({
                    postid: post.id,
                    media: post.media_url,
                    mediaType: post.media_type,
                    caption: post.caption,
                  })
                }}
                className={`relative aspect-square rounded-lg overflow-hidden border
                  ${
                    selectedPost?.id === post.id
                      ? 'border-blue-500'
                      : 'border-transparent'
                  }`}
              >
                <Image
                  src={post.media_url}
                  alt="Post"
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>

          <Button
            onClick={() => mutate({})}
            disabled={posts.length === 0 || isPending}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-xs"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Attach selected posts to automation'
            )}
          </Button>
        </>
      )}
    </div>
  )
}

export default PostPanel
