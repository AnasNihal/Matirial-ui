'use server'

import { client } from '@/lib/prisma'
import { v4 } from 'uuid'

export const createAutomation = async (clerkId: string, id?: string) => {
  // Check if automation with this ID already exists
  if (id) {
    const existing = await client.automation.findUnique({
      where: { id },
    })
    if (existing) {
      console.warn('⚠️ [createAutomation] Automation with ID already exists:', id)
      return existing
    }
  }

  const result = await client.user.update({
    where: {
      clerkId,
    },
    data: {
      automations: {
        create: {
          ...(id && { id }),
        },
      },
    },
    include: {
      automations: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
  })

  // Return the created automation
  return result.automations[0]
}

export const getAutomations = async (clerkId: string) => {
  return await client.user.findUnique({
    where: {
      clerkId,
    },
    select: {
      automations: {
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          keywords: true,
          listener: true, // ✅ CRITICAL: Include listener to get dmCount and commentCount
        },
      },
    },
  })
}

export const findAutomation = async (id: string) => {
  // Validate UUID format before querying
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    console.error('❌ [findAutomation] Invalid automation ID format:', id)
    throw new Error(`Invalid automation ID format: ${id}. Expected UUID format.`)
  }
  
  const automation = await client.automation.findUnique({
    where: { id },
    include: {
      keywords: true,
      trigger: true,
      posts: true,
      listener: true,
      User: {
        select: {
          subscription: true,
          integrations: {
            select: {
              id: true,
              token: true,
              instagramId: true,
              instagramUsername: true,
              instagramProfilePicture: true,
            },
          },
        },
      },
    },
  })

  return automation
}


export const updateAutomation = async (
  id: string,
  update: {
    name?: string
    active?: boolean
  }
) => {
  return await client.automation.update({
    where: { id },
    data: {
      name: update.name,
      active: update.active,
    },
  })
}

export const addListener = async (
  automationId: string,
  listener: 'SMARTAI' | 'MESSAGE',
  prompt: string,
  reply?: string,
  dmImage?: string | null,
  dmLinks?: Array<{ title: string; url: string }>
) => {
  console.log('💾 [addListener] Saving listener with:', {
    automationId,
    listener,
    promptLength: prompt.length,
    hasReply: !!reply,
    hasImage: !!dmImage,
    imageType: dmImage ? (dmImage.startsWith('data:') ? 'base64' : dmImage.startsWith('http') ? 'url' : 'unknown') : 'none',
    linksCount: dmLinks?.length || 0,
  })
  
  // ✅ Store DM image and links as JSON in commentReply field
  let replyData: string | null = null
  
  // Always create JSON if we have image or links
  if (dmImage || (dmLinks && dmLinks.length > 0)) {
    const validLinks = Array.isArray(dmLinks) 
      ? dmLinks.filter(link => link && typeof link === 'object' && link.title && link.url)
      : []
    
    const jsonData = {
      dmImage: dmImage || null,
      dmLinks: validLinks,
      originalReply: reply || null,
    }
    replyData = JSON.stringify(jsonData)
    console.log('💾 [addListener] Created JSON data:', {
      hasImage: !!dmImage,
      linksCount: validLinks.length,
      jsonLength: replyData.length,
    })
  } else if (reply) {
    // No image/links, just use reply as plain text
    replyData = reply
  }
  
  return await client.automation.update({
    where: {
      id: automationId,
    },
    data: {
      listener: {
        upsert: {
          create: {
            listener,
            prompt,
            commentReply: replyData,
          },
          update: {
            listener,
            prompt,
            commentReply: replyData,
          },
        },
      },
    },
  })
}

export const addTrigger = async (automationId: string, trigger: string[]) => {
  // ✅ CRITICAL FIX: Delete old triggers first, then create new ones
  // This prevents duplicate triggers
  if (trigger.length === 2) {
    return await client.automation.update({
      where: { id: automationId },
      data: {
        trigger: {
          deleteMany: {},  // ✅ Delete old triggers
          createMany: {
            data: [{ type: trigger[0] }, { type: trigger[1] }],
          },
        },
      },
    })
  }
  return await client.automation.update({
    where: {
      id: automationId,
    },
    data: {
      trigger: {
        deleteMany: {},  // ✅ Delete old triggers
        create: {
          type: trigger[0],
        },
      },
    },
  })
}

export const addKeyWord = async (automationId: string, keyword: string) => {
  // ✅ CRITICAL FIX: Delete old keywords first, then create new one
  // This ensures only ONE keyword per automation (REPLACE, not ADD)
  return client.automation.update({
    where: {
      id: automationId,
    },
    data: {
      keywords: {
        deleteMany: {},  // ✅ Delete all existing keywords
        create: {
          word: keyword,
        },
      },
    },
  })
}

export const deleteKeywordQuery = async (id: string) => {
  return client.keyword.delete({
    where: { id },
  })
}

export const addPost = async (
  autmationId: string,
  posts: {
    postid: string
    caption?: string
    media: string
    mediaType: 'IMAGE' | 'VIDEO' | 'CAROSEL_ALBUM'
  }[]
) => {
  // ✅ CRITICAL FIX: Delete old posts first, then create new one
  // This ensures only ONE post per automation (REPLACE, not ADD)
  return await client.automation.update({
    where: {
      id: autmationId,
    },
    data: {
      posts: {
        deleteMany: {},  // ✅ Delete all existing posts
        createMany: {     // ✅ Then create the new one(s)
          data: posts,
        },
      },
    },
  })
}