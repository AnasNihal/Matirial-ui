
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { 
  sendDM, 
  sendPrivateReplyToComment,
  sendDMWithImage,
  getCommentDetails, 
  sendPublicReplyToComment,
  getPageAccessToken
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

const GRAPH_API_VERSION = 'v24.0'
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`

const FACEBOOK_PAGE_ID = "899407896585353"

// Webhook verification (GET request)
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('hub.mode')
  const token = req.nextUrl.searchParams.get('hub.verify_token')
  const challenge = req.nextUrl.searchParams.get('hub.challenge')
  
  // Validate required parameters
  if (!mode || !token || !challenge) {
    console.log('❌ [Webhook GET] Missing required parameters')
    return new NextResponse('Missing required parameters', { status: 400 })
  }

  // Verify the token matches your verify token
  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ [Webhook GET] Webhook verified successfully')
    return new NextResponse(challenge, { status: 200 })
  }

  console.log('❌ [Webhook GET] Verification failed - invalid token or mode')
  return new NextResponse('Forbidden', { status: 403 })
}

// Webhook events (POST request)
export async function POST(req: NextRequest) {
  console.log('=== Webhook Received ===')
  
  try {
    // Parse JSON payload with error handling
    let webhook_payload: any
    try {
      webhook_payload = await req.json()
      console.log('Full Payload:', JSON.stringify(webhook_payload, null, 2))
    } catch (jsonError: any) {
      console.error('❌ [Webhook POST] Failed to parse JSON:', jsonError.message)
      return NextResponse.json(
        { message: 'Invalid JSON payload', error: jsonError.message },
        { status: 200 } // Return 200 to prevent Meta retries
      )
    }

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
  const instagramScopedId = value.from?.self_ig_scoped_id // ✅ Instagram scoped ID for direct DM
  const pageId = FACEBOOK_PAGE_ID


  if (!commentText || !commentId) {
    console.log('Missing comment text or ID')
    return NextResponse.json({ message: 'Invalid comment data' }, { status: 200 })
  }

  console.log('📝 [Webhook] Comment Details:', {
    commentText,
    commentId,
    mediaId,
    fromUserId,
    instagramScopedId: instagramScopedId || '❌ NOT PROVIDED',
    fromObject: JSON.stringify(value.from, null, 2),
  })

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

  // ✅ Use PAGE ACCESS TOKEN from env (required for Instagram Graph API to send messages)
  const pageToken = process.env.META_PAGE_ACCESS_TOKEN
  const userToken = automation.User?.integrations[0]?.token
  
  console.log('🔍 [Webhook] Token check:', {
    hasPageToken: !!pageToken,
    pageTokenLength: pageToken?.length || 0,
    pageTokenPreview: pageToken ? pageToken.substring(0, 30) + '...' : 'null',
    pageTokenFirstChars: pageToken ? pageToken.substring(0, 10) : 'null',
    pageTokenLastChars: pageToken && pageToken.length > 10 ? '...' + pageToken.substring(pageToken.length - 10) : 'null',
    hasUserToken: !!userToken,
    userTokenPreview: userToken ? userToken.substring(0, 30) + '...' : 'null',
    envVarName: 'META_PAGE_ACCESS_TOKEN',
  })
  
  // Use page token for sending messages (Instagram Graph API requires page token)
  let token = pageToken
  if (!token) {
    console.error('❌❌❌ [Webhook] CRITICAL: No PAGE ACCESS TOKEN found in env (META_PAGE_ACCESS_TOKEN)')
    console.error('❌❌❌ [Webhook] ACTION REQUIRED: Add META_PAGE_ACCESS_TOKEN to your .env file')
    console.error('❌❌❌ [Webhook] Get a new token from: https://developers.facebook.com/tools/explorer/')
    console.error('❌❌❌ [Webhook] Make sure to restart your dev server after updating .env file!')
    return NextResponse.json({ message: 'No page access token configured' }, { status: 200 })
  }
  
  // ✅ Validate token format (should start with EAA for page tokens)
  if (!token.startsWith('EAA')) {
    console.warn('⚠️⚠️⚠️ [Webhook] WARNING: Token does not start with "EAA" - might not be a valid Page Access Token!')
    console.warn('⚠️⚠️⚠️ [Webhook] Page tokens usually start with "EAA"')
    console.warn('⚠️⚠️⚠️ [Webhook] Make sure you selected "Page" (not "User") in Graph API Explorer')
  }
  
  // ✅ Validate token and try to get page token from user token if expired
  let validatedToken = token
  let tokenValid = false
  
  try {
    const testResponse = await axios.get(
      `${GRAPH_BASE_URL}/${FACEBOOK_PAGE_ID}`,
      {
        params: { 
          access_token: token,
          fields: 'id,name'
        },
        headers: { 'Content-Type': 'application/json' }
      }
    )
    
    console.log('✅ [Webhook] Token validation SUCCESS:', {
      tokenType: 'Page Token',
      pageName: testResponse.data?.name || 'N/A',
      pageId: testResponse.data?.id || 'N/A',
    })
    tokenValid = true
  } catch (tokenError: any) {
    const errorDetails = tokenError.response?.data || tokenError.message
    const isExpired = errorDetails?.error?.code === 190 || errorDetails?.error?.code === 463
    
    console.error('❌❌❌ [Webhook] Token validation FAILED:', {
      error: errorDetails?.error?.message || errorDetails,
      errorCode: errorDetails?.error?.code,
      isExpired,
    })
    
    if (isExpired) {
      console.error('❌❌❌ [Webhook] TOKEN IS EXPIRED!')
      console.log('🔄 [Webhook] Attempting to get page token from user integration...')
      
      // Try to get page token from user token
      if (userToken) {
        const pageTokenFromUser = await getPageAccessToken(userToken, FACEBOOK_PAGE_ID)
        if (pageTokenFromUser) {
          console.log('✅ [Webhook] Successfully got page token from user integration!')
          validatedToken = pageTokenFromUser
          tokenValid = true
        } else {
          console.error('❌❌❌ [Webhook] Failed to get page token from user integration')
          console.error('❌❌❌ [Webhook] The token you added is already expired or invalid!')
          console.error('❌❌❌ [Webhook] Get a FRESH token from: https://developers.facebook.com/tools/explorer/')
          console.error('❌❌❌ [Webhook] Make sure to:')
          console.error('   1. Select your APP')
          console.error('   2. Select "Page" (NOT "User")')
          console.error('   3. Select your PAGE')
          console.error('   4. Generate token with permissions: pages_messaging, instagram_basic, instagram_manage_messages')
          console.error('   5. Copy the token and add to .env file')
          console.error('   6. RESTART your dev server!')
        }
      } else {
        console.error('❌❌❌ [Webhook] No user token available for fallback')
        console.error('❌❌❌ [Webhook] Get a FRESH token from: https://developers.facebook.com/tools/explorer/')
      }
    } else {
      console.error('❌❌❌ [Webhook] Token validation error (not expired):', errorDetails)
    }
  }
  
  // Use validated token (or fallback)
  token = validatedToken

  // Handle MESSAGE listener - Send private reply to comment
  if (automation.listener?.listener === 'MESSAGE') {
    console.log('🔵 [Webhook] MESSAGE listener detected - extracting DM data...')

    // ✅ Extract DM message, image, and links from commentReply JSON
    let dmMessage = automation.listener.prompt || 'Thanks for your message 💬'
    let dmImage: string | null = null
    let dmLinks: Array<{ title: string; url: string }> = []
    let publicReply = 'Thanks for your comment ❤️'

    // Try to parse commentReply as JSON to get image and links
    if (automation.listener.commentReply) {
      try {
        const parsed = JSON.parse(automation.listener.commentReply)
        console.log('✅ [Webhook] Parsed commentReply JSON:', {
          hasImage: !!parsed.dmImage,
          linksCount: parsed.dmLinks?.length || 0,
          hasOriginalReply: !!parsed.originalReply,
        })
        
        dmImage = parsed.dmImage || null
        dmLinks = Array.isArray(parsed.dmLinks) 
          ? parsed.dmLinks.filter((l: any) => l && typeof l === 'object' && l.title && l.url)
          : []
        publicReply = parsed.originalReply || publicReply
        
        // If image is base64, convert to dynamic URL
        if (dmImage && dmImage.startsWith('data:image')) {
          // ✅ Priority: Use environment variables for public URL (ngrok, production, etc.)
          let baseUrl = 
            process.env.NGROK_URL || // ngrok URL (e.g., https://abc123.ngrok.io)
            process.env.NEXT_PUBLIC_APP_URL || // Production URL
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) || // Vercel URL
            'http://localhost:3000' // Fallback
          
          // ✅ Fix: Remove trailing slash to avoid double slashes
          baseUrl = baseUrl.replace(/\/$/, '')
          
          dmImage = `${baseUrl}/api/dm-image/${automation.id}`
          console.log('🔄 [Webhook] Converted base64 to dynamic URL:', {
            baseUrl,
            fullUrl: dmImage,
            envVars: {
              hasNGROK_URL: !!process.env.NGROK_URL,
              hasNEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
              hasVERCEL_URL: !!process.env.VERCEL_URL,
            }
          })
        }
      } catch (parseError) {
        // Not JSON, use as plain text for public reply
        console.log('⚠️ [Webhook] commentReply is not JSON, using as plain text')
        publicReply = automation.listener.commentReply
      }
    }

    console.log('🔵 [Webhook] Extracted DM data:', {
      message: dmMessage.substring(0, 50),
      hasImage: !!dmImage,
      imageUrl: dmImage ? dmImage.substring(0, 80) : 'none',
      linksCount: dmLinks.length,
      links: dmLinks.map(l => l.title),
    })

    try {
      // ✅ 1. PUBLIC COMMENT REPLY (UNDER POST)
      console.log('🔵 [Webhook] Step 1: Sending public reply...')
      try {
        await sendPublicReplyToComment(commentId, publicReply, token)
        console.log('✅ [Webhook] Public reply sent successfully')
      } catch (publicError: any) {
        console.error('❌ [Webhook] Failed to send public reply:', {
          error: publicError.response?.data || publicError.message,
        })
        // Continue even if public reply fails
      }

      // ✅ 2. PRIVATE DM with image and links
      console.log('🔵 [Webhook] Step 2: Sending private DM...', {
        commentId,
        fromUserId,
        hasImage: !!dmImage,
        imageUrl: dmImage ? dmImage.substring(0, 80) : 'none',
        linksCount: dmLinks.length,
        messageLength: dmMessage.length,
      })
      
      // ✅ ZORCHA-STYLE: Send image as comment reply, then text as direct DM
      console.log('🔄 [Webhook] Sending private reply (Zorcha-style: image as comment reply, text as direct DM)...')
      console.log('📋 [Webhook] DM Data:', {
        hasMessage: !!dmMessage,
        messageLength: dmMessage?.length || 0,
        messagePreview: dmMessage ? dmMessage.substring(0, 100) : 'none',
        hasImage: !!dmImage,
        imageUrl: dmImage ? dmImage.substring(0, 100) : 'none',
        linksCount: dmLinks?.length || 0,
        links: dmLinks?.map(l => l.title) || [],
        pageId,
        commentId,
        instagramScopedId: instagramScopedId || 'NOT PROVIDED (will use comment_id fallback)',
        tokenPreview: token ? token.substring(0, 30) + '...' : 'none',
      })
      
      try {
        // ✅ Pass Instagram scoped ID for Step 2 (direct DM after image is sent as comment reply)
        const result = await sendPrivateReplyToComment(pageId, commentId, dmMessage, token, dmImage, dmLinks, instagramScopedId)
        if (result) {
          console.log('✅ [Webhook] Private DM result:', {
            result,
            success: result.success,
            status: result.status,
            data: result.data,
            error: result.error,
            note: 'Only ONE message was sent (image + text + buttons combined)',
          })
          
          if (!result.success) {
            console.error('⚠️ [Webhook] Private DM returned but success=false:', result)
          }
        } else {
          console.error('❌ [Webhook] sendPrivateReplyToComment returned undefined/null')
        }
      } catch (privateReplyError: any) {
        const errorDetails = privateReplyError.response?.data || privateReplyError.message
        console.error('❌❌❌ [Webhook] Exception thrown by sendPrivateReplyToComment:', {
          error: errorDetails,
          status: privateReplyError.response?.status,
          errorCode: errorDetails?.error?.code,
          errorMessage: errorDetails?.error?.message,
          fullError: JSON.stringify(errorDetails, null, 2),
          stack: privateReplyError.stack,
        })
      }

      // ✅ 3. Track response
      console.log('🔵 [Webhook] Step 3: Tracking response...')

      // count DM (private reply)
      await trackResponses(automation.id, 'DM')
      console.log('✅ [Webhook] DM incremented')

      // count comment
      await trackResponses(automation.id, 'COMMENT')
      console.log('✅ [Webhook] Comment incremented')


      return NextResponse.json(
        { message: 'Public + Private replies sent successfully' },
        { status: 200 }
      )

    } catch (error: any) {
      console.error('❌❌❌ [Webhook] FAILED TO SEND REPLIES:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        stack: error.stack,
      })
      return NextResponse.json(
        { message: 'Error sending replies', error: error.response?.data || error.message },
        { status: 200 }
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
        // User message: sender = fromUserId, receiver = pageId
        const userMessage = createChatHistory(
          automation.id,
          fromUserId,
          pageId,
          commentText
        )
        
        // AI message: sender = pageId, receiver = fromUserId
        const aiMessage = createChatHistory(
          automation.id,
          pageId,
          fromUserId,
          aiResponse
        )
        
        await client.$transaction([userMessage, aiMessage])

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

    // ✅ Use PAGE ACCESS TOKEN from env for sending DMs
    const pageToken = process.env.META_PAGE_ACCESS_TOKEN
    if (!pageToken) {
      console.log('❌ [Webhook] No PAGE ACCESS TOKEN found in env for DM')
      return NextResponse.json({ message: 'No page access token configured' }, { status: 200 })
    }
    const token = pageToken

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
        // User message: sender = senderId, receiver = pageId
        const userMessage = createChatHistory(
          automation.id,
          senderId,
          pageId,
          messageText
        )
        
        // AI message: sender = pageId, receiver = senderId
        const aiMessage = createChatHistory(
          automation.id,
          pageId,
          senderId,
          aiResponse
        )
        
        await client.$transaction([userMessage, aiMessage])

        const dm = await sendDM(pageId, senderId, aiResponse, token)

        if (dm.status === 200) {
          await trackResponses(automation.id, 'DM')
          return NextResponse.json({ message: 'AI DM sent' }, { status: 200 })
        }
      }
    }
  }

  // Handle conversation continuation
  // Note: recipientId is the page, senderId is the user
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
        // User message: sender = senderId, receiver = pageId
        const userMessage = createChatHistory(
          automation.id,
          senderId,
          pageId,
          messageText
        )
        
        // AI message: sender = pageId, receiver = senderId
        const aiMessage = createChatHistory(
          automation.id,
          pageId,
          senderId,
          aiResponse
        )
        
        await client.$transaction([userMessage, aiMessage])

        // ✅ Use PAGE ACCESS TOKEN from env
        const pageToken = process.env.META_PAGE_ACCESS_TOKEN
        if (!pageToken) {
          console.log('❌ [Webhook] No PAGE ACCESS TOKEN found in env')
          return NextResponse.json({ message: 'No page access token configured' }, { status: 200 })
        }
        const dm = await sendDM(pageId, senderId, aiResponse, pageToken)

        if (dm.status === 200) {
          return NextResponse.json({ message: 'Conversation continued' }, { status: 200 })
        }
      }
    }
  }

  return NextResponse.json({ message: 'Message processed' }, { status: 200 })
}