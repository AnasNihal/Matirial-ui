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
  console.log('🔵 onIntegrate started with code:', code)

  const user = await onCurrentUser()
  console.log('👤 Current user:', user.id)

  try {
    const integration = await getIntegration(user.id)
    console.log('📊 Existing integration:', integration)

    // Allow first-time integration only
    if (integration && integration.integrations.length === 0) {
      console.log('🔄 Generating tokens...')

      // 1) SHORT-LIVED TOKEN
      const token = await generateTokens(code)
      console.log('✅ Short lived token received:', token)

      if (!token || !token.access_token) {
        return { status: 401, message: 'No access token received' }
      }

      // 2) EXCHANGE TO LONG-LIVED TOKEN
      const longRes = await axios.get(
        `${process.env.INSTAGRAM_BASE_URL}/access_token`,
        {
          params: {
            grant_type: 'ig_exchange_token',
            client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
            access_token: token.access_token,
          },
        }
      )

      const longToken = longRes.data?.access_token
      const expiresIn = longRes.data?.expires_in || 60 * 24 * 60 * 60

      if (!longToken) {
        return { status: 401, message: 'Failed to convert to long-lived token' }
      }

      // 3) FETCH INSTAGRAM PROFILE (THIS IS WHAT WAS MISSING)
      const profileResponse = await axios.get(
        `${process.env.INSTAGRAM_BASE_URL}/me`,
        {
          params: {
            fields: 'id,username,profile_picture_url',
            access_token: longToken,
          },
        }
      )

      const igId = profileResponse.data.id
      const igUsername = profileResponse.data.username
      const igProfilePhoto = profileResponse.data.profile_picture_url

      console.log('✅ Instagram ID:', igId)
      console.log('✅ Instagram username:', igUsername)
      console.log('✅ Instagram photo:', igProfilePhoto)

      const expire_date = new Date(Date.now() + expiresIn * 1000)

      // 4) SAVE EVERYTHING TO DB
      const create = await createIntegration(
        user.id,
        longToken,
        expire_date,
        igId,
        igUsername,
        igProfilePhoto
      )

      console.log('💾 Saved integration:', create)

      return { status: 200, data: create }
    }

    if (!integration) {
      return { status: 404, message: 'Integration record not found' }
    }

    if (integration.integrations.length > 0) {
      return { status: 409, message: 'Integration already exists' }
    }

    return { status: 404, message: 'Unexpected integration state' }
  } catch (error: any) {
    console.error('🔴 Integration Error:', error)
    return {
      status: 500,
      message:
        error.response?.data?.error?.message ||
        error.message ||
        'Integration failed',
    }
  }
}
