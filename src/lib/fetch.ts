import axios from 'axios'

const GRAPH_API_VERSION = 'v24.0'
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`

// -----------------------------
// GENERATE TOKENS
// -----------------------------
export const generateTokens = async (code: string) => {
  try {
    const response = await axios.get(
      `${GRAPH_BASE_URL}/oauth/access_token`,
      {
        params: {
          client_id: process.env.META_APP_ID,
          client_secret: process.env.META_APP_SECRET,
          grant_type: 'authorization_code',
          redirect_uri: process.env.META_REDIRECT_URI,
          code,
        },
      }
    )

    return response.data
  } catch (error: any) {
    console.error('Error generating tokens:', error.response?.data || error.message)
    throw error
  }
}

// -----------------------------
// REFRESH TOKEN
// -----------------------------
export const refreshToken = async (longLivedToken: string) => {
  try {
    const response = await axios.get(
      `${GRAPH_BASE_URL}/oauth/access_token`,
      {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: process.env.META_APP_ID,
          client_secret: process.env.META_APP_SECRET,
          fb_exchange_token: longLivedToken,
        },
      }
    )

    return response.data
  } catch (error: any) {
    console.error('❌ Error refreshing IG token:', error)
    return null
  }
}

// -----------------------------
// GET PAGE ACCESS TOKEN FROM USER TOKEN
// -----------------------------
export const getPageAccessToken = async (userToken: string, pageId: string) => {
  try {
    console.log('🔄 [getPageAccessToken] Attempting to get page token from user token...')
    
    // First, get user's pages
    const pagesResponse = await axios.get(
      `${GRAPH_BASE_URL}/me/accounts`,
      {
        params: {
          access_token: userToken,
          fields: 'id,name,access_token',
        },
      }
    )

    const pages = pagesResponse.data?.data || []
    console.log('📄 [getPageAccessToken] Found pages:', pages.length)
    
    // Find the page that matches our page ID
    const targetPage = pages.find((page: any) => page.id === pageId)
    
    if (targetPage?.access_token) {
      console.log('✅ [getPageAccessToken] Found page token for page:', targetPage.name)
      return targetPage.access_token
    }
    
    console.warn('⚠️ [getPageAccessToken] Page not found or no access token')
    return null
  } catch (error: any) {
    console.error('❌ [getPageAccessToken] Error:', error.response?.data || error.message)
    return null
  }
}

// -----------------------------
// SEND PRIVATE MESSAGE (DM)
// -----------------------------
export const sendDM = async (
  pageId: string, recipientId: string, message: string, token: string) => {
  console.log('🔵 [sendDM] Sending DM to:', recipientId);

  try {
    const response = await axios.post(
      `${GRAPH_BASE_URL}/${pageId}/messages`,
      {
        recipient: { id: recipientId },
        message: { text: message },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`, // ✅ Use user's token
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ [sendDM] DM sent successfully');
    return response;

  } catch (error: any) {
    console.error('❌ [sendDM] Error:', error.response?.data || error.message);
    throw error;
  }
};

// -----------------------------
// SEND DM WITH IMAGE AND LINKS (Direct to User ID)
// -----------------------------
export const sendDMWithImage = async (
  pageId: string,
  recipientId: string,
  message: string,
  token: string,
  imageUrl?: string | null,
  links?: Array<{ title: string; url: string }>
) => {
  console.log('🔵 [sendDMWithImage] Starting:', {
    recipientId,
    messageLength: message.length,
    hasImage: !!imageUrl,
    imageUrl: imageUrl ? imageUrl.substring(0, 80) + '...' : 'none',
    linksCount: links?.length || 0,
    links: links?.map(l => l.title) || [],
  })

  try {
    // Build complete message text (original message + formatted links)
    let completeMessage = message || ''
    
    // Add links to the message text if they exist
    if (links && links.length > 0) {
      const linksText = links
        .map(link => `${link.title}\n${link.url}`)
        .join('\n\n')
      
      if (completeMessage) {
        completeMessage = `${completeMessage}\n\n${linksText}`
      } else {
        completeMessage = linksText
      }
    }

    // ✅ ZORCHA-STYLE: Send TWO separate messages
    // Step 1: Send image (if exists)
    if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
      console.log('📷 [sendDMWithImage] Step 1: Sending image message...')
      try {
        await axios.post(
          `${GRAPH_BASE_URL}/${pageId}/messages`,
          {
            recipient: { id: recipientId },
            message: {
              attachment: {
                type: 'image',
                payload: {
                  url: imageUrl,
                  is_reusable: false,
                },
              },
            },
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )
        console.log('✅ [sendDMWithImage] Step 1 SUCCESS: Image sent')
      } catch (imageError: any) {
        console.error('❌ [sendDMWithImage] Step 1 FAILED:', imageError.response?.data || imageError.message)
      }
    }
    
    // Step 2: Send text with links
    if (completeMessage) {
      console.log('💬 [sendDMWithImage] Step 2: Sending text message...')
      const textResponse = await axios.post(
        `${GRAPH_BASE_URL}/${pageId}/messages`,
        {
          recipient: { id: recipientId },
          message: { text: completeMessage },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )
      console.log('✅ [sendDMWithImage] Step 2 SUCCESS: Text sent')
      return textResponse
    }
    
    return { status: 200, data: 'Messages sent' }
  } catch (error: any) {
    console.error('❌ [sendDMWithImage] Error:', error.response?.data || error.message)
    throw error
  }
}


// -----------------------------
// SEND PRIVATE REPLY TO COMMENT
// -----------------------------
export const sendPrivateReplyToComment = async (
  pageId: string, 
  commentId: string, 
  message: string, 
  token: string,
  imageUrl?: string | null,
  links?: Array<{ title: string; url: string }>,
  recipientId?: string // Instagram scoped ID for direct DM (Step 2)
) => {
  console.log('🔵 [sendPrivateReplyToComment] Starting:', {
    commentId,
    messageLength: message.length,
    hasImage: !!imageUrl,
    imageUrl: imageUrl ? imageUrl.substring(0, 80) + '...' : 'none',
    linksCount: links?.length || 0,
    links: links?.map(l => l.title) || [],
    hasRecipientId: !!recipientId,
    recipientId: recipientId || '❌ NOT PROVIDED (Step 2 & 3 will be skipped)',
  })

  try {
    // ✅ ZORCHA-STYLE APPROACH: Send multiple separate messages
    // Instagram auto-generates preview cards ONLY when URLs are sent ALONE (no other text)
    // Strategy:
    // Step 1: Send image as private reply to comment
    // Step 2: Send text message (WITHOUT links) as direct DM
    // Step 3: Send each link URL ALONE in separate direct DM messages (Instagram auto-generates preview cards)
    
    // Build text message WITHOUT links (links will be sent separately)
    let textMessage = message || ''
    
    // If we have links, add their titles to the text (but NOT the URLs)
    if (links && links.length > 0) {
      const linkTitles = links.map(link => link.title).join('\n')
      if (textMessage) {
        textMessage = `${textMessage}\n\n${linkTitles}`
      } else {
        textMessage = linkTitles
      }
    }

    console.log('🔵 [sendPrivateReplyToComment] Starting (Zorcha-style: image + text + separate link messages):', {
      hasText: !!textMessage,
      textLength: textMessage.length,
      hasImage: !!imageUrl,
      linksCount: links?.length || 0,
      note: 'Links will be sent ALONE in separate messages for Instagram preview cards',
    })

    let imageSent = false
    let textSent = false
    let linksSent = 0
    
    // ✅ Step 1: Send IMAGE message FIRST (if image exists) - NO TEXT, NO BUTTONS
    if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
      // ⚠️ Instagram requires HTTPS for image URLs
      if (imageUrl.startsWith('http://')) {
        console.warn('⚠️ [sendPrivateReplyToComment] Image URL uses HTTP instead of HTTPS. Instagram may reject this.')
      }
      
      console.log('📷 [sendPrivateReplyToComment] Step 1: Sending IMAGE message (image only, no text, no buttons)...')
      
      try {
        const imageResponse = await axios.post(
          `${GRAPH_BASE_URL}/${pageId}/messages`,
          {
            recipient: { comment_id: commentId },
            message: {
              attachment: {
                type: 'image',
                payload: {
                  url: imageUrl,
                  is_reusable: false,
                },
              },
            },
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )
        
        console.log('✅ [sendPrivateReplyToComment] Step 1 SUCCESS: Image message sent', {
          status: imageResponse.status,
          responseData: imageResponse.data,
        })
        imageSent = true
      } catch (imageError: any) {
        const errorDetails = imageError.response?.data || imageError.message
        const isTokenExpired = errorDetails?.error?.code === 190 || errorDetails?.error?.code === 463
        
        console.error('❌ [sendPrivateReplyToComment] Step 1 FAILED: Image message failed:', {
          error: errorDetails,
          status: imageError.response?.status,
          errorCode: errorDetails?.error?.code,
          errorMessage: errorDetails?.error?.message,
          isTokenExpired,
        })
        
        if (isTokenExpired) {
          console.error('❌❌❌ [sendPrivateReplyToComment] TOKEN EXPIRED!')
          console.error('❌❌❌ ACTION REQUIRED: Your META_PAGE_ACCESS_TOKEN has expired!')
          console.error('❌❌❌ Get a new token from: https://developers.facebook.com/tools/explorer/')
          console.error('❌❌❌ Or reconnect your Instagram integration in the app')
        }
        // Continue to send text message even if image fails
      }
    }
    
    // ✅ Step 2: Send TEXT message (WITHOUT links) as DIRECT DM
    // Instagram only allows ONE private reply per comment, so we send text as direct DM
    if (textMessage && recipientId) {
      console.log('💬 [sendPrivateReplyToComment] Step 2: Sending TEXT message (without links) as DIRECT DM...')
      
      try {
        const textResponse = await axios.post(
          `${GRAPH_BASE_URL}/${pageId}/messages`,
          {
            recipient: { id: recipientId },
            message: { text: textMessage },
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )
        
        console.log('✅ [sendPrivateReplyToComment] Step 2 SUCCESS: Text message sent as direct DM', {
          status: textResponse.status,
          responseData: textResponse.data,
        })
        textSent = true
      } catch (textError: any) {
        const errorDetails = textError.response?.data || textError.message
        const isTokenExpired = errorDetails?.error?.code === 190 || errorDetails?.error?.code === 463
        
        console.error('❌ [sendPrivateReplyToComment] Step 2 FAILED: Text message failed:', {
          error: errorDetails,
          status: textError.response?.status,
          errorCode: errorDetails?.error?.code,
          errorMessage: errorDetails?.error?.message,
          isTokenExpired,
        })
        
        if (isTokenExpired) {
          console.error('❌❌❌ [sendPrivateReplyToComment] TOKEN EXPIRED!')
          console.error('❌❌❌ ACTION REQUIRED: Your META_PAGE_ACCESS_TOKEN has expired!')
          console.error('❌❌❌ Get a new token from: https://developers.facebook.com/tools/explorer/')
          console.error('❌❌❌ Or reconnect your Instagram integration in the app')
        }
        // Continue to send links even if text fails
      }
    } else if (textMessage && !recipientId) {
      console.warn('⚠️ [sendPrivateReplyToComment] Step 2 SKIPPED: No recipientId provided for direct DM', {
        hasTextMessage: !!textMessage,
        hasRecipientId: !!recipientId,
        note: 'Text message requires recipientId (Instagram scoped ID) to send as direct DM',
      })
    } else if (!textMessage) {
      console.log('ℹ️ [sendPrivateReplyToComment] Step 2 SKIPPED: No text message to send')
    }
    
    // ✅ Step 3: Send each link URL ALONE in separate direct DM messages
    // Instagram auto-generates preview cards ONLY when URLs are sent ALONE (no other text)
    if (links && links.length > 0 && recipientId) {
      console.log('🔗 [sendPrivateReplyToComment] Step 3: Sending link URLs ALONE (one per message) for Instagram preview cards...')
      
      let successCount = 0
      let failCount = 0
      
      for (let i = 0; i < links.length; i++) {
        const link = links[i]
        console.log(`📤 [sendPrivateReplyToComment] Step 3.${i + 1}: Sending link URL ALONE: ${link.url}`)
        
        try {
          // ✅ CRITICAL: Send ONLY the URL, no other text (Instagram auto-generates preview card)
          const linkResponse = await axios.post(
            `${GRAPH_BASE_URL}/${pageId}/messages`,
            {
              recipient: { id: recipientId },
              message: { text: link.url }, // ✅ URL ALONE - Instagram will generate preview card
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          )
          
          console.log(`✅ [sendPrivateReplyToComment] Step 3.${i + 1} SUCCESS: Link URL sent (Instagram will auto-generate preview card)`, {
            status: linkResponse.status,
            url: link.url,
            title: link.title,
          })
          successCount++
          linksSent++
          
          // Small delay between messages to avoid rate limiting
          if (i < links.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        } catch (linkError: any) {
          const errorDetails = linkError.response?.data || linkError.message
          const isTokenExpired = errorDetails?.error?.code === 190 || errorDetails?.error?.code === 463
          
          console.error(`❌ [sendPrivateReplyToComment] Step 3.${i + 1} FAILED: Link URL failed:`, {
            error: errorDetails,
            status: linkError.response?.status,
            url: link.url,
            title: link.title,
            isTokenExpired,
          })
          
          if (isTokenExpired) {
            console.error('❌❌❌ [sendPrivateReplyToComment] TOKEN EXPIRED!')
            console.error('❌❌❌ ACTION REQUIRED: Your META_PAGE_ACCESS_TOKEN has expired!')
            console.error('❌❌❌ Get a new token from: https://developers.facebook.com/tools/explorer/')
            console.error('❌❌❌ Or reconnect your Instagram integration in the app')
          }
          failCount++
        }
      }
      
      console.log('📊 [sendPrivateReplyToComment] Step 3 Summary:', {
        totalLinks: links.length,
        successCount,
        failCount,
        note: 'Instagram should auto-generate preview cards for successfully sent URLs',
      })
    } else if (links && links.length > 0 && !recipientId) {
      console.warn('⚠️ [sendPrivateReplyToComment] Step 3 SKIPPED: No recipientId provided for direct DM', {
        linksCount: links.length,
        hasRecipientId: !!recipientId,
        note: 'Link URLs require recipientId (Instagram scoped ID) to send as direct DM',
      })
    } else if (!links || links.length === 0) {
      console.log('ℹ️ [sendPrivateReplyToComment] Step 3 SKIPPED: No links to send')
    }
    
    // Return summary
    const summary = {
      imageSent,
      textSent,
      linksSent,
      totalLinks: links?.length || 0,
    }
    
    console.log('📊 [sendPrivateReplyToComment] Final Summary:', summary)
    
    if (imageSent || textSent || linksSent > 0) {
      return { 
        status: 200, 
        success: true, 
        data: 'Messages sent successfully (Zorcha-style)',
        summary 
      }
    } else {
      console.warn('⚠️ [sendPrivateReplyToComment] No messages were sent (no image, no text, no links)')
      return { 
        status: 400, 
        success: false, 
        error: 'No messages were sent',
        summary 
      }
    }
  } catch (error: any) {
    const errorDetails = error.response?.data || error.message
    console.error('❌❌❌ [sendPrivateReplyToComment] UNHANDLED ERROR:', {
      error: errorDetails,
      status: error.response?.status,
      errorCode: errorDetails?.error?.code,
      errorMessage: errorDetails?.error?.message,
      commentId,
      hasImage: !!imageUrl,
      linksCount: links?.length || 0,
      fullError: JSON.stringify(errorDetails, null, 2),
      stack: error.stack,
    })
    // Return error instead of throwing so webhook can handle it
    return { 
      status: error.response?.status || 500, 
      success: false, 
      error: errorDetails,
      message: 'Failed to send private reply'
    }
  }
}



export const sendPublicReplyToComment = async (
  commentId: string,
  message: string,
  token: string
) => {
  console.log('🔵 [sendPublicReplyToComment] Sending PUBLIC reply to comment:', commentId)

  try {
    const response = await axios.post(
      `${GRAPH_BASE_URL}/${commentId}/replies`,
      { message },
      {
        headers: {
          Authorization: `Bearer ${token}`, // ✅ Use user's token
          'Content-Type': 'application/json'
        }
      }
    )

    console.log('✅ [sendPublicReplyToComment] Public reply sent successfully')
    return response

  } catch (error: any) {
    console.error(
      'Public Reply Error:',
      error.response?.data || error.message
    )
    throw error
  }
}




// -----------------------------
// GET COMMENT DETAILS (uses IG TOKEN from DB)
// -----------------------------
export const getCommentDetails = async (
  commentId: string,
  token: string
) => {
  try {
    const response = await axios.get(
      `${GRAPH_BASE_URL}/${commentId}?fields=id,text,from,timestamp&access_token=${token}`
    );

    return response.data;

  } catch (error: any) {
    console.error('Get Comment Error:', error.response?.data || error.message);
    throw error;
  }
};
