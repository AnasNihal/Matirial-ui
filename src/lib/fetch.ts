import axios from 'axios'

const GRAPH_API_VERSION = 'v24.0'
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`

// -----------------------------
// GENERATE TOKENS (Exchange authorization code for access token)
// -----------------------------
export const generateTokens = async (code: string) => {
  try {
    // ✅ Use environment variables - check both old and new names for compatibility
    const clientId = process.env.INSTAGRAM_CLIENT_ID || process.env.META_APP_ID
    const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET || process.env.META_APP_SECRET
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || process.env.META_REDIRECT_URI

    // ✅ Validate required environment variables
    if (!clientId || !clientSecret || !redirectUri) {
      const missing = []
      if (!clientId) missing.push('INSTAGRAM_CLIENT_ID or META_APP_ID')
      if (!clientSecret) missing.push('INSTAGRAM_CLIENT_SECRET or META_APP_SECRET')
      if (!redirectUri) missing.push('INSTAGRAM_REDIRECT_URI or META_REDIRECT_URI')
      
      const errorMsg = `Missing required environment variables: ${missing.join(', ')}`
      console.error('❌ [generateTokens]', errorMsg)
      throw new Error(errorMsg)
    }

    // ✅ Validate code parameter
    if (!code || code.trim().length === 0) {
      const errorMsg = 'Authorization code is missing or empty'
      console.error('❌ [generateTokens]', errorMsg)
      throw new Error(errorMsg)
    }

    // ✅ Clean the code (remove any fragments or extra data)
    const cleanCode = code.split('#')[0].split('?')[0].trim()
    
    console.log('✅ [generateTokens] Environment variables check:', {
      hasClientId: !!clientId,
      clientIdLength: clientId?.length || 0,
      clientIdPreview: clientId ? `${clientId.substring(0, 10)}...` : 'MISSING',
      hasClientSecret: !!clientSecret,
      clientSecretLength: clientSecret?.length || 0,
      hasRedirectUri: !!redirectUri,
      redirectUri: redirectUri,
      codeLength: cleanCode.length,
    })

    // ✅ OLD WORKING VERSION: Use Instagram OAuth endpoint with POST and form data
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code: cleanCode,
    })

    console.log('✅ [generateTokens] Making OAuth request to Instagram API:', {
      url: 'https://api.instagram.com/oauth/access_token',
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      redirectUri: redirectUri,
      codeLength: cleanCode.length,
    })

    const response = await axios.post(
      'https://api.instagram.com/oauth/access_token',   // ✅ OLD WORKING ENDPOINT
      body.toString(),                                   // ✅ Form data as string
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded', // ✅ IMPORTANT: Form data header
        },
      }
    )

    console.log('✅ [generateTokens] Token exchange successful:', {
      hasAccessToken: !!response.data?.access_token,
      hasExpiresIn: !!response.data?.expires_in,
      tokenType: response.data?.token_type,
      userId: response.data?.user_id,
    })

    // ✅ Validate response has access_token
    if (!response.data?.access_token) {
      throw new Error('Token exchange succeeded but no access_token in response')
    }

    return response.data
  } catch (error: any) {
    // ✅ Simple error handling (old working version)
    const errorData = error.response?.data
    const errorMessage = errorData?.error?.message || errorData?.error_message || error.message
    const errorCode = errorData?.error?.code || errorData?.error_code
    
    console.error('❌ [generateTokens] Token Error:', {
      message: errorMessage,
      code: errorCode,
      fullError: errorData || error.message,
    })
    
    // Throw error with helpful message
    throw new Error(`Token generation failed: ${errorMessage || error.message}`)
  }
}

// -----------------------------
// REFRESH IG USER TOKEN (LONG-LIVED)
// -----------------------------
export const refreshToken = async (longLivedToken: string) => {
  try {
    // ✅ OLD WORKING VERSION: Use Instagram refresh endpoint
    const instagramBaseUrl = process.env.INSTAGRAM_BASE_URL || 'https://graph.instagram.com'
    
    // ✅ Validate URL format
    if (!instagramBaseUrl.startsWith('http://') && !instagramBaseUrl.startsWith('https://')) {
      console.error('❌ [refreshToken] Invalid INSTAGRAM_BASE_URL format:', instagramBaseUrl)
      return null
    }
    
    const response = await axios.get(
      `${instagramBaseUrl}/refresh_access_token`,
      {
        params: {
          grant_type: 'ig_refresh_token',
          access_token: longLivedToken,
        },
      }
    )

    // ✅ Validate response exists
    if (!response || !response.data) {
      console.error('❌ [refreshToken] Invalid response from Instagram API')
      return null
    }

    // Instagram returns: { access_token, token_type, expires_in }
    return response.data
  } catch (error: any) {
    const errorDetails = error.response?.data || error.message
    console.error('❌ [refreshToken] Error refreshing IG token:', {
      error: errorDetails,
      status: error.response?.status,
      errorCode: errorDetails?.error?.code,
      errorMessage: errorDetails?.error?.message,
    })
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
    let imageSent = false
    let textSent = false
    let linksSent = 0
    
    // ✅ STEP 1: ALWAYS send image first (as private reply to comment)
    if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
      if (imageUrl.startsWith('http://')) {
        console.warn('⚠️ [sendPrivateReplyToComment] Image URL uses HTTP instead of HTTPS. Instagram may reject this.')
      }
      
      console.log('📷 [sendPrivateReplyToComment] Step 1: Sending image first...')
      
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
        
        // ✅ STEP 2: Now try to send text + links as a follow-up direct DM
        if (message || (links && links.length > 0)) {
          if (recipientId) {
            console.log('💬 [sendPrivateReplyToComment] Step 2: Attempting to send text + links as follow-up direct DM...')
            
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
            
            // ✅ STEP 3: Send links separately (if buttons didn't work or we want link previews)
            if (links && links.length > 0) {
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
          } else {
            console.warn('⚠️ [sendPrivateReplyToComment] recipientId missing - cannot send text/links as direct DM after image')
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
        
        // ✅ FALLBACK: If image fails, try to send text as comment reply
        if (message) {
          console.log('🔄 [sendPrivateReplyToComment] Fallback: Attempting to send text as comment reply since image failed...')
          try {
            const textResponse = await axios.post(
              `${GRAPH_BASE_URL}/${pageId}/messages`,
              {
                recipient: { comment_id: commentId },
                message: { text: message },
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }
            )
            console.log('✅ [sendPrivateReplyToComment] Fallback SUCCESS: Text sent as comment reply')
            textSent = true
          } catch (fallbackError: any) {
            console.error('❌ [sendPrivateReplyToComment] Fallback also failed:', fallbackError.response?.data || fallbackError.message)
          }
        }
      }
    } else if (!imageUrl && message) {
      // No image, just text
      try {
        const textMessageResponse = await axios.post(
          `${GRAPH_BASE_URL}/${pageId}/messages`,
          {
            recipient: recipientId 
              ? { id: recipientId }
              : { comment_id: commentId },
            message: {
              text: message,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )
        
        console.log('✅ [sendPrivateReplyToComment] SUCCESS: Text message sent!', {
          status: textMessageResponse.status,
          responseData: textMessageResponse.data,
        })
        textSent = true
      } catch (textError: any) {
        const errorDetails = textError.response?.data || textError.message
        console.error('❌ [sendPrivateReplyToComment] Text message failed:', {
          error: errorDetails?.error?.message || errorDetails,
          errorCode: errorDetails?.error?.code,
        })
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
    const errorDetails = error.response?.data || error.message
    console.error('❌ [sendPublicReplyToComment] Error:', {
      error: errorDetails,
      status: error.response?.status,
      errorCode: errorDetails?.error?.code,
      errorMessage: errorDetails?.error?.message,
      commentId,
    })
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
      `${GRAPH_BASE_URL}/${commentId}`,
      {
        params: {
          fields: 'id,text,from,timestamp',
          access_token: token,
        },
      }
    );

    return response.data;

  } catch (error: any) {
    const errorDetails = error.response?.data || error.message
    console.error('❌ [getCommentDetails] Error:', {
      error: errorDetails,
      status: error.response?.status,
      errorCode: errorDetails?.error?.code,
      errorMessage: errorDetails?.error?.message,
      commentId,
    });
    throw error;
  }
};
