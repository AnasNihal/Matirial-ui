import axios from 'axios';

const GRAPH_API_VERSION = 'v24.0';
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// PAGE ACCESS TOKEN (from env)
const PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN;

// -----------------------------
// GENERATE TOKENS (Exchange authorization code for access token)
// -----------------------------
export const generateTokens = async (code: string) => {
  try {
    const body = new URLSearchParams({
      client_id: process.env.INSTAGRAM_CLIENT_ID!,
      client_secret: process.env.INSTAGRAM_CLIENT_SECRET!,
      grant_type: "authorization_code",
      redirect_uri: process.env.INSTAGRAM_REDIRECT_URI!,
      code: code,
    });

    const response = await axios.post(
      "https://api.instagram.com/oauth/access_token",   // ✅ IMPORTANT
      body.toString(),                                   // ✅ IMPORTANT
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded", // ✅ IMPORTANT
        },
      }
    );

    console.log("✅ TOKEN GENERATED:", response.data);
    return response.data;

  } catch (error: any) {
    console.error("❌ TOKEN ERROR:", error.response?.data || error.message);
    throw error;
  }
};

// -----------------------------
// REFRESH IG USER TOKEN (LONG-LIVED)
// -----------------------------
export const refreshToken = async (longLivedToken: string) => {
  try {
    const res = await axios.get(
      `${process.env.INSTAGRAM_BASE_URL}/refresh_access_token`,
      {
        params: {
          grant_type: 'ig_refresh_token',
          access_token: longLivedToken,
        },
      }
    )

    // Instagram returns: { access_token, token_type, expires_in }
    return res.data
  } catch (error) {
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
// SEND PRIVATE REPLY TO COMMENT
// -----------------------------
export const sendPrivateReplyToComment = async (
  pageId: string, 
  commentId: string, 
  message: string, 
  token: string,
  imageUrl?: string | null,
  links?: Array<{ title: string; url: string }>
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
    // ✅ CRITICAL: Instagram only allows ONE private message per comment
    // So we must combine everything into a SINGLE message
    
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

    console.log('🔵 [sendPrivateReplyToComment] Complete message:', {
      hasText: !!completeMessage,
      textLength: completeMessage.length,
      hasImage: !!imageUrl,
    })

    // ✅ Option 1: Send image with text (if image exists)
    if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
      console.log('🔄 [sendPrivateReplyToComment] Sending SINGLE message with image + text + links')
      
      const response = await axios.post(
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
            // Include all text (message + links) in the message
            ...(completeMessage && { text: completeMessage }),
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )
      
      console.log('✅ [sendPrivateReplyToComment] Image with text + links sent successfully')
      return { status: 200, data: 'Message sent' }
    }
    
    // ✅ Option 2: Send text only (if no image)
    if (completeMessage) {
      console.log('🔄 [sendPrivateReplyToComment] Sending SINGLE text message with links')
      
      const response = await axios.post(
        `${GRAPH_BASE_URL}/${pageId}/messages`,
        {
          recipient: { comment_id: commentId },
          message: { text: completeMessage },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )
      
      console.log('✅ [sendPrivateReplyToComment] Text message with links sent successfully')
      return { status: 200, data: 'Message sent' }
    }

    console.warn('⚠️ [sendPrivateReplyToComment] No content to send (no message, no image, no links)')
    return { status: 200, data: 'No content to send' }
  } catch (error: any) {
    console.error('❌ [sendPrivateReplyToComment] Error:', {
      error: error.response?.data || error.message,
      status: error.response?.status,
      commentId,
      hasImage: !!imageUrl,
      linksCount: links?.length || 0,
    })
    throw error
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
