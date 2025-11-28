'use client'

import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

type SelectedPost = {
  id: string
  media: string
  caption?: string
}

type Props = {
  selectedPost: SelectedPost | null
  keyword: string
  dmText: string
  dmEnabled: boolean
  activeStep: 'post' | 'keyword' | 'dm'
  username?: string
  profilePic?: string
}

export default function PhonePreview({
  selectedPost,
  keyword,
  dmText,
  dmEnabled,
  activeStep,
  username = 'your_account',
  profilePic,
}: Props) {

  const hasPost = !!selectedPost

  return (
    <div className="w-full flex justify-center">

      <div className="relative w-[320px] h-[640px] rounded-[38px] border-[6px] border-[#111] bg-black overflow-hidden shadow-2xl">

        {/* ------------------- TOP BAR ------------------- */}
        <div className="h-10 border-b border-[#222] flex items-center justify-center text-white text-sm font-semibold relative">
          <span className="absolute left-4 text-xl">‹</span>
          POSTS
        </div>

        {/* ------------------- USER BAR ------------------- */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#222]">
          {profilePic ? (
            <Image
              src={profilePic}
              width={28}
              height={28}
              alt="profile"
              className="rounded-full"
            />
          ) : (
            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-pink-500 to-yellow-400 flex items-center justify-center text-[10px] font-bold">
              IG
            </div>
          )}

          <span className="text-white text-xs font-medium">
            {username}
          </span>
        </div>

        {/* ------------------- POST AREA ------------------- */}
        <div className="relative w-full h-[320px] flex items-center justify-center bg-black">

          {hasPost ? (
            <Image
              src={selectedPost!.media}
              alt="post"
              fill
              className="object-contain"
            />
          ) : (
            <div className="w-[250px] h-[250px] border border-dashed border-[#444] flex items-center justify-center text-[#9ca3af] text-xs text-center px-4 rounded-lg">
              You haven’t picked a post or reel yet
            </div>
          )}

        </div>

        {/* ------------------- ACTION BAR ------------------- */}
        <div className="px-3 pt-2 flex justify-between text-white text-lg">
          <div className="flex gap-4">
            <span>♡</span>
            <span>💬</span>
            <span>✈</span>
          </div>
          <span>🔖</span>
        </div>

        <div className="px-3 text-xs text-gray-400">
          View all comments
        </div>

        {/* ================= COMMENT VIEW ================= */}
        <AnimatePresence>
          {activeStep === 'keyword' && (
            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-0 left-0 right-0 bg-[#181818] text-white rounded-t-2xl px-4 py-4 text-xs z-20"
            >
              <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-4"></div>
              <p className="text-center font-medium text-sm mb-4">
                Comments
              </p>

              {/* User comment */}
              <div className="flex gap-2 mb-4">
                <div className="h-8 w-8 bg-[#333] rounded-full" />
                <div>
                  <div className="bg-[#2a2a2a] px-3 py-2 rounded-2xl rounded-tl-sm">
                    <span className="font-semibold">User</span>{' '}
                    {keyword || 'hello'}
                  </div>
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Reply
                  </span>
                </div>
              </div>

              {/* Owner reply */}
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-[#333] rounded-full" />
                <div>
                  <div className="bg-[#2a2a2a] px-3 py-2 rounded-2xl rounded-tl-sm">
                    <span className="font-semibold">{username}</span>{' '}
                    You’re all set 🎉
                  </div>
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Reply
                  </span>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* ================= DM VIEW ================= */}
        <AnimatePresence>
          {activeStep === 'dm' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 bg-black z-30 flex flex-col"
            >

              {/* Header */}
              <div className="h-12 border-b border-[#222] flex items-center px-3 justify-between text-white">
                <span>‹</span>

                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 bg-[#444] rounded-full"></div>
                  <span className="text-xs">{username}</span>
                </div>

                <div className="flex gap-3">
                  <span>📞</span>
                  <span>ⓘ</span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-3 flex flex-col justify-end gap-3">

                {selectedPost && (
                  <div className="bg-[#111] w-44 rounded-xl overflow-hidden border border-[#333]">
                    <div className="relative h-[120px]">
                      <Image
                        src={selectedPost.media}
                        alt="product"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-2 text-[11px]">
                      {selectedPost.caption || 'Selected product'}
                    </div>
                  </div>
                )}

                <div className="self-end max-w-[80%] bg-blue-600 px-3 py-2 rounded-2xl text-[12px]">
                  {dmText || "Thanks for your comment! We'll DM you soon."}
                </div>

              </div>

              {/* Input bar */}
              <div className="h-12 border-t border-[#222] px-3 flex items-center gap-2 text-gray-400 text-xs">
                <div className="h-8 w-8 bg-blue-600 rounded-full text-white flex items-center justify-center">
                  +
                </div>
                <div className="flex-1 bg-[#1a1a1a] rounded-full px-3 py-2">
                  Message...
                </div>
                🙂
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
