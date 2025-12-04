'use client'

import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import React from 'react'

type SelectedPost = {
  id: string
  media: string
  caption?: string
  mediaType?: 'IMAGE' | 'VIDEO' | 'CAROSEL_ALBUM'
  thumbnail?: string
}

type DmLink = {
  title: string
  url: string
}

type Props = {
  selectedPost: SelectedPost | null
  keyword: string
  dmText: string
  dmEnabled: boolean
  activeStep: 'post' | 'keyword' | 'dm'
  username?: string
  profilePic?: string
  dmImage?: string | null
  dmLinks?: DmLink[]
}

export default function PhonePreview({
  selectedPost,
  keyword,
  dmText,
  dmEnabled,
  activeStep,
  username = 'your_account',
  profilePic,
  dmImage,
  dmLinks = [],
}: Props) {
  // ------- LOGS (so you can debug easily) -------
  console.log('📱 PhonePreview -> props:', {
    username,
    profilePic,
    activeStep,
    keyword,
    dmText,
    selectedPost,
  })

  const hasPost = !!selectedPost

  // small helper to render avatar fallback circle
  const AvatarFallback = ({ name, size = 32 }: { name: string; size?: number }) => {
    const initial = name ? name.charAt(0).toUpperCase() : 'I'
    const s = size
    return (
      <div
        style={{
          width: s,
          height: s,
          borderRadius: s / 2,
        }}
        className="flex items-center justify-center text-[11px] font-semibold"
      >
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            width: s,
            height: s,
            background:
              'linear-gradient(135deg,#f58529 0%,#dd2a7b 40%,#8134af 60%,#515bd4 100%)',
            color: 'white',
          }}
        >
          {initial}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex justify-center">
      <div
        className="relative overflow-hidden rounded-[28px] shadow-2xl"
        style={{ width: 340, height: 700, background: '#000' }}
      >
        {/* ---------------- STATUS / TOP NAV ---------------- */}
        <div className="pt-3 pb-1 px-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="text-white/80 text-xl leading-none">‹</button>
              <div className="text-sm text-white font-medium">POSTS</div>
            </div>

            <div className="flex items-center gap-3">
              <button className="text-white/70 text-lg">⋯</button>
            </div>
          </div>
        </div>

        {/* ---------------- USER BAR (IG-like) ---------------- */}
        <div className="px-3 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {profilePic ? (
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700">
                  <Image
                    src={profilePic}
                    width={32}
                    height={32}
                    alt="profile"
                    className="object-cover"
                    unoptimized
                    onLoad={() => console.log('✅ profile image loaded')}
                    onError={() => console.log('❌ profile image failed to load')}
                  />
                </div>
              ) : (
                <AvatarFallback name={username ?? 'I'} size={32} />
              )}

              <div className="flex flex-col leading-tight">
                <div className="text-sm text-white font-semibold">
                  {username}
                </div>
                <div className="text-[11px] text-white/60">Original audio</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="text-white/70 text-lg">🔍</button>
              <button className="text-white/70 text-lg">⋯</button>
            </div>
          </div>
        </div>

        {/* ---------------- POST AREA ---------------- */}
        <div
          className="relative bg-black flex items-center justify-center"
          style={{ height: 360 }}
        >
          {hasPost ? (
            <Image
              src={
                // For reels/videos, use thumbnail if available, otherwise use media URL
                selectedPost!.mediaType === 'VIDEO' && selectedPost!.thumbnail
                  ? selectedPost!.thumbnail
                  : selectedPost!.media
              }
              alt={selectedPost!.mediaType === 'VIDEO' ? 'reel' : 'post'}
              fill
              className="object-contain"
              unoptimized
              onLoad={() => console.log('✅ post image loaded')}
              onError={() => console.log('❌ post image failed to load')}
            />
          ) : (
            <div className="w-[280px] h-[280px] rounded-md border border-dashed border-white/10 flex items-center justify-center text-center px-4">
              <div className="text-white/60 text-[13px]">
                You haven’t picked a post or reel for your automation yet
              </div>
            </div>
          )}
        </div>

        {/* ---------------- ACTIONS & CAPTION SNIPPET ---------------- */}
        <div className="px-4 pt-3">
          <div className="flex items-center justify-between text-white text-lg">
            <div className="flex items-center gap-4">
              <button className="text-white/90">♡</button>
              <button className="text-white/90">💬</button>
              <button className="text-white/90">✈️</button>
            </div>

            <div className="text-white/90">🔖</div>
          </div>

          <div className="mt-3 text-[13px] text-white/80">
            {hasPost && selectedPost?.caption ? (
              <>
                <span className="font-semibold mr-2">{username}</span>
                <span>
                  {selectedPost.caption.length > 120
                    ? selectedPost.caption.slice(0, 120) + '…'
                    : selectedPost.caption}
                </span>
              </>
            ) : (
              <div className="text-white/60">View all comments</div>
            )}
          </div>
        </div>

        {/* ---------------- BOTTOM NAV (fake IG) ---------------- */}
        <div
          className="absolute bottom-12 left-0 right-0 px-4"
          style={{ pointerEvents: 'none' }}
        >
          <div className="flex justify-between items-center text-white/60">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm">
                🏠
              </div>
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm">
                🔍
              </div>
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm">
                ⊕
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm">
                ♫
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- COMMENT SHEET (ZORCHA style) ---------------- */}
        <AnimatePresence>
          {activeStep === 'keyword' && (
            <motion.div
              initial={{ y: 400, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 400, opacity: 0 }}
              transition={{ duration: 0.28 }}
              className="absolute left-3 right-3 bottom-3 bg-[#1f1f1f] rounded-2xl border border-white/6 z-30"
              style={{ overflow: 'hidden' }}
            >
              <div className="px-4 pt-3 pb-2 flex items-center justify-center">
                <div className="w-12 h-1 rounded-full bg-white/40" />
              </div>

              <div className="px-4 pb-4 text-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-center text-sm font-semibold">Comments</div>
                  <div className="text-white/60 text-sm">✈</div>
                </div>

                {/* Example comment (user) */}
                <div className="flex gap-3 mb-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-white/7 flex items-center justify-center text-xs">
                    U
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold">User</div>
                    <div className="text-[13px] text-white/70">{keyword || 'Leaves a new comment'}</div>
                    <div className="text-[12px] text-white/50 mt-2">Reply</div>
                  </div>
                  <div className="text-white/60">♡</div>
                </div>

                {/* Owner reply (with profilePic fallback) */}
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    {profilePic ? (
                      <Image
                        src={profilePic}
                        width={32}
                        height={32}
                        alt="owner"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/6 flex items-center justify-center"> C </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="text-[13px] font-semibold">{username}</div>
                    <div className="text-[13px] text-white/70">Youre all set 🎉</div>
                    <div className="text-[12px] text-white/50 mt-2">Reply</div>
                  </div>
                  <div className="text-white/60">♡</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---------------- DM SCREEN (overlay) - USER PERSPECTIVE ---------------- */}
        <AnimatePresence>
          {activeStep === 'dm' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-40"
            >
              <div className="absolute inset-0 bg-black flex flex-col">
                {/* header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <button className="text-white text-xl leading-none">‹</button>
                    {profilePic ? (
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        <Image src={profilePic} width={32} height={32} alt="p" unoptimized />
                      </div>
                    ) : (
                      <AvatarFallback name={username} size={32} />
                    )}
                    <div>
                      <div className="text-sm text-white font-semibold">{username}</div>
                      <div className="text-xs text-white/60">Active now</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-white/70">
                    <button className="text-lg">📞</button>
                    <button className="text-lg">ⓘ</button>
                  </div>
                </div>

                {/* messages area - USER PERSPECTIVE (receiving messages from automation) */}
                <div className="flex-1 overflow-auto p-4">
                  <div className="flex flex-col gap-3">
                    {/* Username and preview text */}
                    <div className="flex items-center gap-2 mb-1">
                      {profilePic ? (
                        <div className="w-6 h-6 rounded-full overflow-hidden opacity-60">
                          <Image src={profilePic} width={24} height={24} alt="p" unoptimized />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full overflow-hidden opacity-60">
                          <AvatarFallback name={username} size={24} />
                        </div>
                      )}
                      <div className="text-xs text-white/60">{username}</div>
                    </div>
                    <div className="text-white/60 text-xs mb-3">This is a preview of the DM thread</div>

                    {/* Welcome message from automation */}
                    <div className="self-start bg-white/6 text-white p-3 rounded-2xl max-w-[75%]">
                      <p className="text-sm leading-relaxed whitespace-pre-line">
                        Hey! Thanks for reaching{'\n'}out — this DM preview{'\n'}appears here.
                      </p>
                    </div>

                    {/* Main DM message from automation */}
                    {dmText && (
                      <div className="self-start bg-white/6 text-white p-3 rounded-2xl max-w-[75%]">
                        <p className="text-sm leading-relaxed whitespace-pre-line">{dmText}</p>
                      </div>
                    )}

                    {/* DM Preview with Image */}
                    {dmImage ? (
                      <div className="self-start max-w-[75%] flex flex-col gap-2">
                        <div className="relative w-full rounded-2xl overflow-hidden bg-white/10 border border-white/10">
                          <img
                            src={dmImage}
                            alt="DM media"
                            className="w-full h-auto object-cover"
                          />
                          {dmText && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4">
                              <p className="text-white text-sm font-medium">{dmText}</p>
                            </div>
                          )}
                        </div>
                        {/* Links as clickable buttons */}
                        {dmLinks.length > 0 && (
                          <div className="flex flex-col gap-2">
                            {dmLinks.map((link, index) => (
                              <button
                                key={index}
                                className="bg-white/10 hover:bg-white/15 border border-white/20 text-white px-4 py-3 rounded-xl text-sm font-medium transition-colors text-center"
                              >
                                {link.title}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Links as clickable buttons (without image) */
                      dmLinks.length > 0 && (
                        <div className="self-start max-w-[75%] flex flex-col gap-2">
                          {dmLinks.map((link, index) => (
                            <button
                              key={index}
                              className="bg-white/10 hover:bg-white/15 border border-white/20 text-white px-4 py-3 rounded-xl text-sm font-medium transition-colors text-center"
                            >
                              {link.title}
                            </button>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* composer - User's input area */}
                <div className="p-4 border-t border-white/10 bg-black">
                  <div className="bg-white/6 rounded-full px-3 py-2.5 flex items-center gap-3">
                    <button className="text-white/70 text-lg">＋</button>
                    <input
                      className="bg-transparent outline-none text-white placeholder:text-white/50 flex-1 text-sm"
                      placeholder="Message..."
                      readOnly
                    />
                    <button className="text-white/70">🎵</button>
                    <button className="text-white/70">🎤</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
