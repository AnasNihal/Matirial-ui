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
    // ✅ SINGLE MESSAGE BUBBLE APPROACH: Try to send image + text + button in ONE message
    // Strategy: Send image with quick_replies (buttons) - Instagram may allow this combination
    
    console.log('🔵 [sendPrivateReplyToComment] Starting (Single bubble: image + text + button):', {
      hasText: !!message,
      textLength: message.length,
      hasImage: !!imageUrl,
      linksCount: links?.length || 0,
      hasRecipientId: !!recipientId,
      note: 'Attempting to send everything in ONE message bubble',
    })

    let imageSent = false
    let textSent = false
    let linksSent = 0
    
    // ✅ STEP 1: ALWAYS send image first (as private reply to comment)
    // This ensures image is sent even if single-bubble approach fails
    if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
      if (imageUrl.startsWith('http://')) {
        console.warn('⚠️ [sendPrivateReplyToComment] Image URL uses HTTP instead of HTTPS. Instagram may reject this.')
      }
      
      // Build quick_replies from links
      const quickReplies = links && links.length > 0 
        ? links.map(link => ({
            content_type: 'text',
            title: link.title || 'Click here',
            payload: link.url,
          }))
        : []
      
      // Try web_url type first (might work for link previews)
      const webUrlReplies = links && links.length > 0
        ? links.map(link => ({
            content_type: 'web_url',
            title: link.title || 'Click here',
            url: link.url,
          }))
        : []
      
      console.log('📷 [sendPrivateReplyToComment] Step 1: Sending image first...')
      
      // First, send image as private reply (this always works)
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
        
        console.log('✅ [sendPrivateReplyToComment] Step 1 SUCCESS: Image sent as private reply', {
          status: imageResponse.status,
        })
        imageSent = true
        
        // ✅ STEP 2: Now try to send text + buttons as a follow-up direct DM
        // Since we already used the one private reply for the image, send text+buttons as direct DM
        if (recipientId && (message || (links && links.length > 0))) {
          console.log('💬 [sendPrivateReplyToComment] Step 2: Attempting to send text + buttons as follow-up direct DM...')
          
          // Try with web_url buttons first (better for link previews)
          if (webUrlReplies.length > 0) {
            try {
              const followUpResponse = await axios.post(
                `${GRAPH_BASE_URL}/${pageId}/messages`,
                {
                  recipient: { id: recipientId },
                  message: {
                    text: message || '',
                    quick_replies: webUrlReplies,
                  },
                },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                }
              )
              
              console.log('✅ [sendPrivateReplyToComment] Step 2 SUCCESS: Text + web_url buttons sent!', {
                status: followUpResponse.status,
              })
              textSent = true
            } catch (webUrlError: any) {
              const errorDetails = webUrlError.response?.data || webUrlError.message
              console.warn('⚠️ [sendPrivateReplyToComment] web_url buttons failed, trying text buttons:', {
                error: errorDetails?.error?.message || errorDetails,
                errorCode: errorDetails?.error?.code,
              })
              
              // Fallback: Try with text buttons
              try {
                const followUpResponse = await axios.post(
                  `${GRAPH_BASE_URL}/${pageId}/messages`,
                  {
                    recipient: { id: recipientId },
                    message: {
                      text: message || '',
                      quick_replies: quickReplies,
                    },
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                  }
                )
                
                console.log('✅ [sendPrivateReplyToComment] Step 2 SUCCESS: Text + text buttons sent!', {
                  status: followUpResponse.status,
                })
                textSent = true
              } catch (textButtonError: any) {
                console.warn('⚠️ [sendPrivateReplyToComment] Text buttons failed, sending text only:', {
                  error: textButtonError.response?.data || textButtonError.message,
                })
                
                // Fallback: Send text only
                if (message) {
                  try {
                    await axios.post(
                      `${GRAPH_BASE_URL}/${pageId}/messages`,
                      {
                        recipient: { id: recipientId },
                        message: { text: message },
                      },
                      {
                        headers: {
                          Authorization: `Bearer ${token}`,
                          'Content-Type': 'application/json',
                        },
                      }
                    )
                    console.log('✅ [sendPrivateReplyToComment] Text sent separately')
                    textSent = true
                  } catch (e: any) {
                    console.error('❌ [sendPrivateReplyToComment] Failed to send text:', e.response?.data || e.message)
                  }
                }
              }
            }
          } else if (message) {
            // No links, just send text
            try {
              await axios.post(
                `${GRAPH_BASE_URL}/${pageId}/messages`,
                {
                  recipient: { id: recipientId },
                  message: { text: message },
                },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                }
              )
              console.log('✅ [sendPrivateReplyToComment] Text sent separately')
              textSent = true
            } catch (e: any) {
              console.error('❌ [sendPrivateReplyToComment] Failed to send text:', e.response?.data || e.message)
            }
          }
          
          // ✅ STEP 3: Send links separately (if buttons didn't work or we want link previews)
          if (links && links.length > 0 && recipientId) {
            console.log('🔗 [sendPrivateReplyToComment] Step 3: Sending link URLs separately for preview cards...')
            
            for (const link of links) {
              try {
                await axios.post(
                  `${GRAPH_BASE_URL}/${pageId}/messages`,
                  {
                    recipient: { id: recipientId },
                    message: { text: link.url }, // URL alone triggers preview card
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                  }
                )
                console.log('✅ [sendPrivateReplyToComment] Link URL sent:', link.url)
                linksSent++
                await new Promise(resolve => setTimeout(resolve, 500))
              } catch (e: any) {
                console.error('❌ [sendPrivateReplyToComment] Failed to send link:', e.response?.data || e.message)
              }
            }
          }
        }
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
      }
    } else if (!imageUrl && message) {
      // No image, just text + buttons
      const quickReplies = links && links.length > 0 
        ? links.map(link => ({
            content_type: 'text',
            title: link.title || 'Click here',
            payload: link.url,
          }))
        : []
      
      try {
        const textMessageResponse = await axios.post(
          `${GRAPH_BASE_URL}/${pageId}/messages`,
          {
            recipient: recipientId 
              ? { id: recipientId }
              : { comment_id: commentId },
            message: {
              text: message,
              quick_replies: quickReplies,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )
        
        console.log('✅ [sendPrivateReplyToComment] SUCCESS: Text + Buttons message sent!', {
          status: textMessageResponse.status,
          responseData: textMessageResponse.data,
        })
        textSent = true
      } catch (textError: any) {
        const errorDetails = textError.response?.data || textError.message
        console.error('❌ [sendPrivateReplyToComment] Text + Buttons failed:', {
          error: errorDetails?.error?.message || errorDetails,
          errorCode: errorDetails?.error?.code,
        })
        // Try sending text only
        if (message && recipientId) {
          try {
            await axios.post(
              `${GRAPH_BASE_URL}/${pageId}/messages`,
              {
                recipient: { id: recipientId },
                message: { text: message },
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }
            )
            textSent = true
          } catch (e: any) {
            console.error('❌ [sendPrivateReplyToComment] Failed to send text:', e.response?.data || e.message)
          }
        }
      }
    }
    
    // Return result
    const summary = { imageSent, textSent, linksSent, totalLinks: links?.length || 0 }
    console.log('📊 [sendPrivateReplyToComment] Final Summary:', summary)
    
    if (imageSent || textSent || linksSent > 0) {
      return { 
        status: 200, 
        success: true, 
        data: 'Messages sent successfully',
        summary 
      }
    } else {
      return { 
        status: 400, 
        success: false, 
        error: 'Failed to send any messages',
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
