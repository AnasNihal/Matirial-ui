
import { NextRequest, NextResponse } from 'next/server'
import { 
  sendDM, 
  sendPrivateReplyToComment,
  getCommentDetails, 
  sendPublicReplyToComment
} from '@/lib/fetch'
import {
  matchKeyword,
  getKeywordAutomation,
  getKeywordPost,
  trackResponses,
  createChatHistory,
  getChatHistory,
} from '@/actions/webhook/queries'
import { findAutomation } from '@/actions/automations/queries'
import { openai } from '@/lib/openai'
import { client } from '@/lib/prisma'

const FACEBOOK_PAGE_ID = "899407896585353"

// Webhook verification (GET request)
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('hub.mode')
  const token = req.nextUrl.searchParams.get('hub.verify_token')
  const challenge = req.nextUrl.searchParams.get('hub.challenge')
  


  // Verify the token matches your verify token
  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log('Webhook verified')
    return new NextResponse(challenge)
  }

  return new NextResponse('Forbidden', { status: 403 })
}

// Webhook events (POST request)
export async function POST(req: NextRequest) {
  console.log('=== Webhook Received ===')
  
  try {
    const webhook_payload = await req.json()
    console.log('Full Payload:', JSON.stringify(webhook_payload, null, 2))

    // Check if it's an Instagram webhook
    if (webhook_payload.object !== 'instagram') {
      return NextResponse.json({ message: 'Not Instagram webhook' }, { status: 200 })
    }

    const entry = webhook_payload.entry?.[0]
    if (!entry) {
      return NextResponse.json({ message: 'No entry data' }, { status: 200 })
    }

    // Handle COMMENTS (Most important for your use case)
    if (entry.changes) {
      return await handleCommentEvent(entry, webhook_payload)
    }

    // Handle DIRECT MESSAGES
    if (entry.messaging) {
      return await handleMessagingEvent(entry, webhook_payload)
    }

    return NextResponse.json({ message: 'Event processed' }, { status: 200 })
    
  } catch (error) {
    console.error('Webhook Error:', error)
    return NextResponse.json(
      { message: 'Error processing webhook' },
      { status: 200 } // Always return 200 to avoid Meta retry
    )
  }
}

// Handle comment events
async function handleCommentEvent(entry: any, webhook_payload: any) {
  console.log('=== Processing Comment Event ===')
  
  const change = entry.changes?.[0]
  if (!change || change.field !== 'comments') {
    return NextResponse.json({ message: 'Not a comment event' }, { status: 200 })
  }

  const value = change.value
  console.log('Comment Value:', JSON.stringify(value, null, 2))

  // Extract comment data
  const commentText = value.text || ''
  const commentId = value.id
  const mediaId = value.media?.id
  const fromUserId = value.from?.id
  const pageId = FACEBOOK_PAGE_ID


  if (!commentText || !commentId) {
    console.log('Missing comment text or ID')
    return NextResponse.json({ message: 'Invalid comment data' }, { status: 200 })
  }

  console.log('Comment Text:', commentText)
  console.log('Comment ID:', commentId)
  console.log('Media ID:', mediaId)
  console.log('From User ID:', fromUserId)

  // ✅ CRITICAL: Check if comment matches keyword from ACTIVE automation on THIS SPECIFIC POST
  if (!mediaId) {
    console.log('❌ No media ID provided, cannot verify post')
    return NextResponse.json({ message: 'No media ID' }, { status: 200 })
  }

  const matcher = await matchKeyword(commentText, mediaId)
  console.log('Keyword Match:', matcher)

  if (!matcher || !matcher.automationId) {
    console.log('❌ No keyword match found for active automation on this post')
    return NextResponse.json({ message: 'No keyword match' }, { status: 200 })
  }

  // Get automation details (already verified as active in matchKeyword)
  const automation = await getKeywordAutomation(matcher.automationId, false)
  
  if (!automation) {
    console.log('❌ Automation not found or not active')
    return NextResponse.json({ message: 'No active automation' }, { status: 200 })
  }

  if (!automation.trigger || automation.trigger.length === 0) {
    console.log('❌ No trigger configured for automation')
    return NextResponse.json({ message: 'No trigger' }, { status: 200 })
  }

  // ✅ Double-check: Verify this post is in the automation's post list
  const hasPost = automation.posts.some((post) => post.postid === mediaId)
  if (!hasPost) {
    console.log(`❌ Post ${mediaId} not in automation ${automation.id}`)
    return NextResponse.json({ message: 'Post not in automation' }, { status: 200 })
  }

  console.log(`✅ Automation ${automation.id} is ACTIVE and monitoring post ${mediaId}`)
  console.log(`✅ Keyword "${matcher.word}" matched!`)

  const token = automation.User?.integrations[0]?.token
  if (!token) {
    console.log('No access token found')
    return NextResponse.json({ message: 'No token' }, { status: 200 })
  }

  // Handle MESSAGE listener - Send private reply to comment
if (automation.listener?.listener === 'MESSAGE') {
  console.log('Sending PRIVATE + PUBLIC reply...')

  const dmMessage =
    automation.listener.prompt || 'Thanks for your message 💬'

  const publicReply =
    automation.listener.commentReply || 'Thanks for your comment ❤️'

  try {
    // ✅ 1. PUBLIC COMMENT REPLY (UNDER POST)
    await sendPublicReplyToComment(commentId, publicReply)
    console.log('✅ Public reply sent')

    // ✅ 2. PRIVATE DM
    await sendPrivateReplyToComment(pageId, commentId, dmMessage, token)
    console.log('✅ Private DM sent')

    // ✅ 3. Track response
    await trackResponses(automation.id, 'COMMENT')

    return NextResponse.json(
      { message: 'Public + Private replies sent successfully' },
      { status: 200 }
    )

  } catch (error: any) {
    console.error(
      '❌ Failed to send replies:',
      error.response?.data || error.message
    )
  }
}


  // Handle SMARTAI listener
  if (
    automation.listener?.listener === 'SMARTAI' &&
    automation.User?.subscription?.plan === 'PRO'
  ) {
    console.log('Using Smart AI for response...')
    
    try {
      const aiMessage = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `${automation.listener.prompt}. Keep responses under 2 sentences.`,
          },
          {
            role: 'user',
            content: commentText,
          },
        ],
      })

      const aiResponse = aiMessage.choices[0]?.message?.content
      
      if (aiResponse) {
        // Save chat history
        const receiver = createChatHistory(
          automation.id,
          pageId,
          fromUserId,
          commentText
        )
        
        const sender = createChatHistory(
          automation.id,
          pageId,
          fromUserId,
          aiResponse
        )
        
        await client.$transaction([receiver, sender])

        // Send private reply
        const privateReply = await sendPrivateReplyToComment(
          pageId,
          commentId,
          aiResponse,
          token
        )

        if (privateReply.status === 200) {
          await trackResponses(automation.id, 'COMMENT')
          console.log('AI private reply sent successfully')
          
          return NextResponse.json(
            { message: 'AI reply sent' },
            { status: 200 }
          )
        }
      }
    } catch (error) {
      console.error('Smart AI error:', error)
    }
  }

  return NextResponse.json({ message: 'Comment processed' }, { status: 200 })
}

// Handle direct message events
async function handleMessagingEvent(entry: any, webhook_payload: any) {
  console.log('=== Processing Messaging Event ===')
  
  const messaging = entry.messaging?.[0]
  if (!messaging) {
    return NextResponse.json({ message: 'No messaging data' }, { status: 200 })
  }

  if (messaging?.message?.is_echo === true) {
    console.log("🚫 Ignoring echo message")
    return NextResponse.json({ message: "Echo ignored" }, { status: 200 })
  }

  const messageText = messaging.message?.text || ''
  const senderId = messaging.sender?.id
  const recipientId = messaging.recipient?.id
  const pageId = FACEBOOK_PAGE_ID


  console.log('Message Text:', messageText)
  console.log('Sender ID:', senderId)

  // ✅ Check for keyword match from ACTIVE automation (no postId for DMs)
  const matcher = await matchKeyword(messageText)

  if (matcher && matcher.automationId) {
    const automation = await getKeywordAutomation(matcher.automationId, true)
    
    if (!automation) {
      console.log('❌ Automation not found or not active')
      return NextResponse.json({ message: 'No active automation' }, { status: 200 })
    }

    if (!automation.trigger || automation.trigger.length === 0) {
      console.log('❌ No trigger configured')
      return NextResponse.json({ message: 'No trigger' }, { status: 200 })
    }

    console.log(`✅ DM automation ${automation.id} is ACTIVE`)
    console.log(`✅ Keyword "${matcher.word}" matched in DM!`)

    const token = automation.User?.integrations[0]?.token
    if (!token) {
      return NextResponse.json({ message: 'No token' }, { status: 200 })
    }

    // Handle MESSAGE listener
    if (automation.listener?.listener === 'MESSAGE') {
      const dm = await sendDM(
        pageId,
        senderId,
        automation.listener.prompt || 'Thank you for your message!',
        token
      )

      if (dm.status === 200) {
        await trackResponses(automation.id, 'DM')
        return NextResponse.json({ message: 'DM sent' }, { status: 200 })
      }
    }

    // Handle SMARTAI listener
    if (
      automation.listener?.listener === 'SMARTAI' &&
      automation.User?.subscription?.plan === 'PRO'
    ) {
      const aiMessage = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `${automation.listener.prompt}. Keep responses under 2 sentences.`,
          },
          {
            role: 'user',
            content: messageText,
          },
        ],
      })

      const aiResponse = aiMessage.choices[0]?.message?.content
      
      if (aiResponse) {
        const receiver = createChatHistory(
          automation.id,
          pageId,
          senderId,
          messageText
        )
        
        const sender = createChatHistory(
          automation.id,
          pageId,
          senderId,
          aiResponse
        )
        
        await client.$transaction([receiver, sender])

        const dm = await sendDM(pageId, senderId, aiResponse, token)

        if (dm.status === 200) {
          await trackResponses(automation.id, 'DM')
          return NextResponse.json({ message: 'AI DM sent' }, { status: 200 })
        }
      }
    }
  }

  // Handle conversation continuation
  const customerHistory = await getChatHistory(recipientId, senderId)
  
  if (customerHistory.history.length > 0) {
    const automation = await findAutomation(customerHistory.automationId!)

    if (
      automation?.User?.subscription?.plan === 'PRO' &&
      automation.listener?.listener === 'SMARTAI'
    ) {
      const aiMessage = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `${automation.listener.prompt}. Keep responses under 2 sentences.`,
          },
          ...customerHistory.history,
          {
            role: 'user',
            content: messageText,
          },
        ],
      })

      const aiResponse = aiMessage.choices[0]?.message?.content
      
      if (aiResponse) {
        const receiver = createChatHistory(
          automation.id,
          pageId,
          senderId,
          messageText
        )
        
        const sender = createChatHistory(
          automation.id,
          pageId,
          senderId,
          aiResponse
        )
        
        await client.$transaction([receiver, sender])

        const dm = await sendDM(pageId, senderId, aiResponse, automation.User?.integrations[0].token!)

        if (dm.status === 200) {
          return NextResponse.json({ message: 'Conversation continued' }, { status: 200 })
        }
      }
    }
  }

  return NextResponse.json({ message: 'Message processed' }, { status: 200 })
}