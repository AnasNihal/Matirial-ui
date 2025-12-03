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
  })

  try {
    // ✅ ZORCHA-STYLE APPROACH: Send TWO separate messages
    // Instagram API does NOT support image + text + buttons in ONE message
    // Solution: Send image first, then text with links (Instagram auto-generates link preview cards)
    
    // Build complete message text (original message + formatted links)
    let completeMessage = message || ''
    
    // Format links as plain text (Instagram will auto-generate preview cards)
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

    console.log('🔵 [sendPrivateReplyToComment] Starting (Zorcha-style: 2 separate messages):', {
      hasText: !!completeMessage,
      textLength: completeMessage.length,
      hasImage: !!imageUrl,
      linksCount: links?.length || 0,
    })

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
      } catch (imageError: any) {
        const errorDetails = imageError.response?.data || imageError.message
        console.error('❌ [sendPrivateReplyToComment] Step 1 FAILED: Image message failed:', {
          error: errorDetails,
          status: imageError.response?.status,
          errorCode: errorDetails?.error?.code,
          errorMessage: errorDetails?.error?.message,
        })
        // Continue to send text message even if image fails
      }
    }
    
    // ✅ Step 2: Send TEXT message as DIRECT DM (not as comment reply)
    // Instagram only allows ONE private reply per comment, so we send text as direct DM
    if (completeMessage) {
      console.log('💬 [sendPrivateReplyToComment] Step 2: Sending TEXT message as DIRECT DM (Instagram will auto-generate link preview cards)...')
      
      // Use recipientId (Instagram scoped ID) for direct DM, fallback to comment_id if not provided
      const dmRecipient = recipientId || commentId
      const recipientType = recipientId ? 'direct DM (user ID)' : 'comment reply (fallback)'
      
      console.log('📤 [sendPrivateReplyToComment] Step 2 recipient:', {
        recipientId: dmRecipient,
        recipientType,
        hasRecipientId: !!recipientId,
      })
      
      try {
        const textResponse = await axios.post(
          `${GRAPH_BASE_URL}/${pageId}/messages`,
          {
            recipient: recipientId ? { id: recipientId } : { comment_id: commentId },
            message: { text: completeMessage },
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
          recipientType,
          note: 'Instagram will auto-generate link preview cards for URLs in the message',
        })
        
        return { status: 200, success: true, data: 'Image + text messages sent successfully (Zorcha-style)' }
      } catch (textError: any) {
        const errorDetails = textError.response?.data || textError.message
        console.error('❌ [sendPrivateReplyToComment] Step 2 FAILED: Text message failed:', {
          error: errorDetails,
          status: textError.response?.status,
          errorCode: errorDetails?.error?.code,
          errorMessage: errorDetails?.error?.message,
          recipientType,
        })
        
        return { 
          status: textError.response?.status || 500, 
          success: false, 
          error: errorDetails,
          message: 'Failed to send text message'
        }
      }
    }

    console.warn('⚠️ [sendPrivateReplyToComment] No content to send (no message, no image, no links)')
    return { status: 200, success: false, data: 'No content to send' }
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
