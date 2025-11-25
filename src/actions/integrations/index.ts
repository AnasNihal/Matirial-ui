'use server'

import { redirect } from 'next/navigation'
import { onCurrentUser } from '../user'
import { createIntegration, getIntegration } from './queries'
import { generateTokens } from '@/lib/fetch'
import axios from 'axios'

export const onOAuthInstagram = (strategy: 'INSTAGRAM' | 'CRM') => {
  if (strategy === 'INSTAGRAM') {
    return redirect(process.env.INSTAGRAM_EMBEDDED_OAUTH_URL as string)
  }
}

export const onIntegrate = async (code: string) => {
  console.log('🔵 onIntegrate started with code:', code);
  
  const user = await onCurrentUser()
  console.log('👤 Current user:', user.id);

  try {
    const integration = await getIntegration(user.id)
    console.log('📊 Existing integration:', integration);

    if (integration && integration.integrations.length === 0) {
      console.log('🔄 Generating tokens...');
      
      const token = await generateTokens(code)
      console.log('✅ Token received:', token);

      if (token && token.access_token) {
        console.log('🔄 Fetching Instagram user ID...');
        
        const insta_id = await axios.get(
          `${process.env.INSTAGRAM_BASE_URL}/me?fields=user_id&access_token=${token.access_token}`
        )
        
        console.log('✅ Instagram user ID:', insta_id.data.user_id);

        const today = new Date()
        const expire_date = today.setDate(today.getDate() + 60)
        
        console.log('💾 Creating integration in database...');
        const create = await createIntegration(
          user.id,
          token.access_token,
          new Date(expire_date),
          insta_id.data.user_id
        )
        
        console.log('✅ Integration created:', create);
        return { status: 200, data: create }
      }
      
      console.log('🔴 Token generation failed - no access_token');
      return { status: 401, message: 'No access token received' }
    }
    
    if (!integration) {
      console.log('🔴 No integration record found for user');
      return { status: 404, message: 'Integration record not found' }
    }
    
    if (integration.integrations.length > 0) {
      console.log('⚠️ Integration already exists');
      return { status: 409, message: 'Integration already exists' }
    }
    
    console.log('🔴 Unexpected state - integration exists but has items');
    return { status: 404, message: 'Unexpected integration state' }
    
  } catch (error: any) {
    console.error('🔴 Integration Error:', error);
    console.error('Error Details:', error.response?.data || error.message);
    return { 
      status: 500, 
      message: error.response?.data?.error?.message || error.message || 'Integration failed'
    }
  }
}