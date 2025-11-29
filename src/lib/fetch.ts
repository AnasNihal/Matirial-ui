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
  console.log('Sending DM to:', recipientId);

  try {
    const response = await axios.post(
      `${GRAPH_BASE_URL}/${pageId}/messages`,
      {
        recipient: { id: recipientId },
        message: { text: message },
      },
      {
        headers: {
          Authorization: `Bearer ${PAGE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response;

  } catch (error: any) {
    console.error('DM Error:', error.response?.data || error.message);
    throw error;
  }
};


// -----------------------------
// SEND PRIVATE REPLY TO COMMENT
// -----------------------------
export const sendPrivateReplyToComment = async (
pageId: string, commentId: string, message: string, token: string) => {
  console.log('Sending private reply to comment:', commentId);

  try {
    const response = await axios.post(
      `${GRAPH_BASE_URL}/${pageId}/messages`,
      {
        recipient: { comment_id: commentId },
        message: { text: message },
      },
      {
        headers: {
          Authorization: `Bearer ${PAGE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response;

  } catch (error: any) {
    console.error('Private Reply Error:', error.response?.data || error.message);
    throw error;
  }
};



export const sendPublicReplyToComment = async (
  commentId: string,
  message: string
) => {
  console.log('Sending PUBLIC reply to comment:', commentId)

  try {
    const response = await axios.post(
      `${GRAPH_BASE_URL}/${commentId}/replies`,
      { message },
      {
        headers: {
          Authorization: `Bearer ${process.env.META_PAGE_ACCESS_TOKEN}`, // ✅ PAGE TOKEN ONLY
          'Content-Type': 'application/json'
        }
      }
    )

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
