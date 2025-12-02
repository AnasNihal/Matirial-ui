import { client } from '@/lib/prisma'

// ✅ IMPROVED: Match keyword AND post together for ACTIVE automations
export const matchKeyword = async (keyword: string, postId?: string) => {
  // If no postId, we can't verify - used for DMs
  if (!postId) {
  return await client.keyword.findFirst({
      where: {
        word: { equals: keyword, mode: 'insensitive' },
        Automation: { active: true },
      },
      include: {
        Automation: {
          include: { posts: true, trigger: true, listener: true },
        },
      },
    })
  }

  // ✅ For comments: Find ALL keywords matching this word from ACTIVE automations
  const allMatches = await client.keyword.findMany({
    where: {
      word: { equals: keyword, mode: 'insensitive' },
      Automation: { active: true },
    },
    include: {
      Automation: {
        include: { posts: true, trigger: true, listener: true },
      },
    },
  })

  console.log(`🔍 Searching for keyword "${keyword}" on post ${postId}`)
  console.log(`🔍 Found ${allMatches.length} active automation(s) with keyword "${keyword}"`)

  if (allMatches.length === 0) {
    console.log(`❌ No active automations with keyword "${keyword}" found in database`)
    console.log(`   💡 TIP: Make sure automation is ACTIVATED and keyword is saved`)
    return null
  }

  // ✅ Filter to find which automation is monitoring THIS specific post
  for (const match of allMatches) {
    if (!match.Automation) {
      console.log(`⚠️  Match found but Automation is null`)
      continue
    }

    console.log(`   📋 Checking automation ${match.Automation.id}:`)
    console.log(`      - Active: ${match.Automation.active}`)
    console.log(`      - Posts count: ${match.Automation.posts.length}`)
    console.log(`      - Trigger count: ${match.Automation.trigger?.length || 0}`)
    console.log(`      - Listener: ${match.Automation.listener ? 'Yes' : 'No'}`)

    if (match.Automation.posts.length > 0) {
      console.log(`      - Post IDs: ${match.Automation.posts.map((p) => p.postid).join(', ')}`)
    }

    const hasPost = match.Automation.posts.some((post) => post.postid === postId)
    
    if (hasPost) {
      console.log(`✅ MATCH! Automation ${match.Automation.id} monitors post ${postId}`)
      return match
    } else {
      console.log(`   ⏭️  Automation ${match.Automation.id} uses keyword "${keyword}" but monitors different post(s)`)
    }
  }

  console.log(`❌ No active automation found with keyword "${keyword}" for post ${postId}`)
  console.log(`   💡 TIP: Check that you selected the correct post when setting up automation`)
  return null
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
  
  // ✅ CRITICAL FIX: Check if history exists before accessing
  if (history.length === 0) {
    return {
      history: [],
      automationId: null,
    }
  }
  
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
