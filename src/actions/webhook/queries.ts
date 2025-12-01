import { client } from '@/lib/prisma'

// Match keyword ONLY from ACTIVE automations
export const matchKeyword = async (keyword: string, postId?: string) => {
  const keywordMatch = await client.keyword.findFirst({
    where: {
      word: {
        equals: keyword,
        mode: 'insensitive',
      },
      Automation: {  // ✅ Capital A - matches Prisma schema
        active: true,  // ✅ ONLY active automations
      },
    },
    include: {
      Automation: {  // ✅ Capital A - matches Prisma schema
        include: {
          posts: true,  // Include posts to verify
        },
      },
    },
  })

  // If postId is provided, verify the automation is monitoring this specific post
  if (keywordMatch && keywordMatch.Automation && postId) {
    const hasPost = keywordMatch.Automation.posts.some(
      (post) => post.postid === postId
    )
    
    if (!hasPost) {
      console.log(`❌ Keyword matched but post ${postId} is not in automation`)
      return null  // Post not in this automation
    }
  }

  return keywordMatch
}

export const getKeywordAutomation = async (
  automationId: string,
  dm: boolean
) => {
  return await client.automation.findUnique({
    where: {
      id: automationId,
      active: true,  // ✅ ONLY get if automation is active
    },

    include: {
      dms: dm,
      posts: true,  // ✅ Include posts to verify
      trigger: {
        where: {
          type: dm ? 'DM' : 'COMMENT',
        },
      },
      listener: true,
      User: {
        select: {
          subscription: {
            select: {
              plan: true,
            },
          },
          integrations: {
            select: {
              token: true,
            },
          },
        },
      },
    },
  })
}
export const trackResponses = async (
  automationId: string,
  type: 'COMMENT' | 'DM'
) => {
  if (type === 'COMMENT') {
    return await client.listener.update({
      where: { automationId },
      data: {
        commentCount: {
          increment: 1,
        },
      },
    })
  }

  if (type === 'DM') {
    return await client.listener.update({
      where: { automationId },
      data: {
        dmCount: {
          increment: 1,
        },
      },
    })
  }
}

export const createChatHistory = (
  automationId: string,
  sender: string,
  reciever: string,
  message: string
) => {
  return client.automation.update({
    where: {
      id: automationId,
    },
    data: {
      dms: {
        create: {
          reciever,
          senderId: sender,
          message,
        },
      },
    },
  })
}

export const getKeywordPost = async (postId: string, automationId: string) => {
  return await client.post.findFirst({
    where: {
      AND: [{ postid: postId }, { automationId }],
    },
    select: { automationId: true },
  })
}

export const getChatHistory = async (sender: string, reciever: string) => {
  const history = await client.dms.findMany({
    where: {
      AND: [{ senderId: sender }, { reciever }],
    },
    orderBy: { createdAt: 'asc' },
  })
  const chatSession: {
    role: 'assistant' | 'user'
    content: string
  }[] = history.map((chat) => {
    return {
      role: chat.reciever ? 'assistant' : 'user',
      content: chat.message!,
    }
  })

  return {
    history: chatSession,
    automationId: history[history.length - 1].automationId,
  }
}
