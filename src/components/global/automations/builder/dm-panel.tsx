'use client'

import React from 'react'
import { useQueryAutomation } from '@/hooks/user-queries'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Camera, Trash2, Smile, Link2, X, Pencil, Paperclip } from 'lucide-react'

export type DmLink = {
  title: string
  url: string
}

type Props = {
  id: string
  isActive: boolean
  onFocus: () => void
  dmPreview: string
  setDmPreview: (t: string) => void
  dmEnabled: boolean
  setDmEnabled: (b: boolean) => void
  dmLinks?: DmLink[]
  setDmLinks?: (links: DmLink[]) => void
  dmImage?: string | null
  setDmImage?: (image: string | null) => void
}

const DmPanel = ({
  id,
  isActive,
  onFocus,
  dmPreview,
  setDmPreview,
  dmEnabled,
  setDmEnabled,
  dmLinks = [],
  setDmLinks,
  dmImage = null,
  setDmImage,
}: Props) => {
  const { data } = useQueryAutomation(id)
  const [localDmLinks, setLocalDmLinks] = React.useState<DmLink[]>(dmLinks)
  const [localDmImage, setLocalDmImage] = React.useState<string | null>(dmImage)
  const [isLinkModalOpen, setIsLinkModalOpen] = React.useState(false)
  const [editingLinkIndex, setEditingLinkIndex] = React.useState<number | null>(null)
  const [linkTitle, setLinkTitle] = React.useState('')
  const [linkUrl, setLinkUrl] = React.useState('')
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const hasInitializedRef = React.useRef(false)

  // Sync local state with props when they change
  React.useEffect(() => {
    setLocalDmLinks(dmLinks)
  }, [dmLinks])

  React.useEffect(() => {
    setLocalDmImage(dmImage)
  }, [dmImage])

  // Sync with parent if callbacks provided - update immediately
  React.useEffect(() => {
    if (setDmLinks) {
      setDmLinks(localDmLinks)
    }
  }, [localDmLinks, setDmLinks])

  React.useEffect(() => {
    if (setDmImage) {
      setDmImage(localDmImage)
    }
  }, [localDmImage, setDmImage])

  // Only initialize from database data ONCE on initial load, never reset after user edits
  React.useEffect(() => {
    if (data?.data?.listener && !hasInitializedRef.current) {
      // Only set if dmPreview is empty (initial state) and we haven't initialized yet
      if (!dmPreview || dmPreview.trim() === '') {
        setDmPreview(data.data.listener.prompt)
        setDmEnabled(true)
        hasInitializedRef.current = true
      }
    }
  }, [data?.data?.listener, setDmPreview, setDmEnabled]) // Removed dmPreview from dependencies

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Convert to base64 for preview/storage
      const reader = new FileReader()
      reader.onloadend = () => {
        setLocalDmImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setLocalDmImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleOpenLinkModal = (index?: number) => {
    if (index !== undefined) {
      // Editing existing link
      setEditingLinkIndex(index)
      setLinkTitle(localDmLinks[index].title)
      setLinkUrl(localDmLinks[index].url)
    } else {
      // Adding new link
      setEditingLinkIndex(null)
      setLinkTitle('')
      setLinkUrl('')
    }
    setIsLinkModalOpen(true)
  }

  const handleCloseLinkModal = () => {
    setIsLinkModalOpen(false)
    setEditingLinkIndex(null)
    setLinkTitle('')
    setLinkUrl('')
  }

  const handleAddLink = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    if (!linkTitle.trim() || !linkUrl.trim()) {
      return
    }

    // Ensure URL has protocol
    let finalUrl = linkUrl.trim()
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = `https://${finalUrl}`
    }

    const newLink: DmLink = {
      title: linkTitle.trim(),
      url: finalUrl,
    }

    if (editingLinkIndex !== null) {
      // Update existing link
      const updatedLinks = [...localDmLinks]
      updatedLinks[editingLinkIndex] = newLink
      setLocalDmLinks(updatedLinks)
    } else {
      // Add new link
      setLocalDmLinks([...localDmLinks, newLink])
    }

    handleCloseLinkModal()
  }

  const handleDeleteLink = (index: number) => {
    const updatedLinks = localDmLinks.filter((_, i) => i !== index)
    setLocalDmLinks(updatedLinks)
  }

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
        <div className="flex flex-col gap-3 mt-2">
          {/* Media Preview Section */}
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-[#121212] border border-[#333]">
            {localDmImage ? (
              <>
                <img
                  src={localDmImage}
                  alt="DM media preview"
                  className="w-full h-full object-cover"
                />
                {/* Change and Delete buttons */}
                <div className="absolute bottom-2 left-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="dm-image-input"
                  />
                  <label
                    htmlFor="dm-image-input"
                    className="flex items-center gap-1.5 bg-black/70 hover:bg-black/90 text-white text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    Change
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute bottom-2 right-2 bg-black/70 hover:bg-black/90 text-white p-1.5 rounded-full transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="dm-image-input"
                />
                <label
                  htmlFor="dm-image-input"
                  className="flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-[#222] text-text-secondary text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors border border-[#333]"
                >
                  <Camera className="h-4 w-4" />
                  Add Image
                </label>
              </div>
            )}
          </div>

          {/* DM Text Input with Character Counter */}
          <div className="relative">
            <Input
              type="text"
              value={dmPreview}
              onChange={(e) => {
                const value = e.target.value
                if (value.length <= 80) {
                  setDmPreview(value)
                }
              }}
              className="bg-[#121212] border-[#333] text-xs h-10 pr-20"
              placeholder="This is something new"
              maxLength={80}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span className="text-xs text-text-secondary">
                {dmPreview.length}/80
              </span>
              <button
                type="button"
                className="text-text-secondary hover:text-white transition-colors"
                onClick={() => {
                  // Emoji picker would go here - for now just a button
                  const emoji = '😊'
                  if (dmPreview.length < 80) {
                    setDmPreview(dmPreview + emoji)
                  }
                }}
              >
                <Smile className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Added Links List */}
          {localDmLinks.length > 0 && (
            <div className="flex flex-col gap-2">
              {localDmLinks.map((link, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5"
                >
                  <Paperclip className="h-4 w-4 text-purple-500 flex-shrink-0" />
                  <span className="flex-1 text-xs text-gray-800 truncate font-medium">
                    {link.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenLinkModal(index)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteLink(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Link Button */}
          <button
            type="button"
            onClick={() => handleOpenLinkModal()}
            className="flex items-center justify-center gap-2 bg-white border border-purple-500 text-purple-500 hover:bg-purple-50 text-xs px-4 py-2 rounded-lg transition-colors"
          >
            <Link2 className="h-4 w-4" />
            Add Link
          </button>
        </div>
      )}

      {/* Add Link Modal */}
      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent className="bg-white rounded-3xl p-6 max-w-md border-0 shadow-2xl">
          <DialogHeader className="relative">
            <div className="flex items-center justify-between mb-4">
              <DialogTitle className="text-lg font-semibold text-gray-800">
                Add Message
              </DialogTitle>
              <button
                onClick={handleCloseLinkModal}
                className="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {/* Title Input */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
                <span className="text-lg font-normal">æ</span>
              </div>
              <Input
                type="text"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Enter Title"
                className="pl-10 pr-24 bg-gray-100 border-gray-200 rounded-xl h-12 text-sm text-gray-700 placeholder:text-gray-400 focus:bg-white focus:border-gray-300"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">
                Open Link
              </span>
            </div>

            {/* URL Input */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
                <Paperclip className="h-4 w-4" />
              </div>
              <Input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="Enter Link"
                className="pl-10 pr-32 bg-gray-100 border-gray-200 rounded-xl h-12 text-sm text-gray-700 placeholder:text-gray-400 focus:bg-white focus:border-gray-300"
              />
              {!linkUrl && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                  https://example.com
                </span>
              )}
            </div>

            {/* Add Message Button */}
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleAddLink()
              }}
              disabled={!linkTitle.trim() || !linkUrl.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-xl h-12 font-medium text-sm mt-2"
            >
              Add Message
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DmPanel
