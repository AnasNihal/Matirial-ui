'use server'

import { client } from '@/lib/prisma'
import { v4 } from 'uuid'

export const createAutomation = async (clerkId: string, id?: string) => {
  return await client.user.update({
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
  })
}

export const getAutomations = async (clerkId: string) => {
  return await client.user.findUnique({
    where: {
      clerkId,
    },
    select: {
      automations: {
        orderBy: {
          createdAt: 'desc', // ✅ Most recent first
        },
        include: {
          keywords: true,
          listener: true,
        },
      },
    },
  })
}

export const findAutomation = async (id: string) => {
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
  reply?: string
) => {
  // ✅ CRITICAL FIX: Use upsert to update existing or create new listener
  // This prevents errors when listener already exists
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
            commentReply: reply,
          },
          update: {
            listener,
            prompt,
            commentReply: reply,
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
