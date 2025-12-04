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
  console.log('🔵 [onIntegrate] ===== STARTING INTEGRATION =====')
  console.log('🔵 [onIntegrate] Code received:', code ? `${code.substring(0, 20)}...` : 'MISSING')
  console.log('🔵 [onIntegrate] Code length:', code?.length || 0)

  console.log('🔵 [onIntegrate] Getting current user...')
  const user = await onCurrentUser()
  console.log('👤 [onIntegrate] Current user ID:', user.id)

  try {
    console.log('🔵 [onIntegrate] Fetching existing integration from database...')
    const integration = await getIntegration(user.id)
    console.log('📊 [onIntegrate] Existing integration result:', {
      hasIntegration: !!integration,
      integrationsCount: integration?.integrations?.length || 0,
      integrationKeys: integration ? Object.keys(integration) : [],
    })

    // ✅ Handle case where user record doesn't exist (shouldn't happen, but safety check)
    if (!integration) {
      console.error('❌ [onIntegrate] User integration record not found in database')
      return { status: 404, message: 'User integration record not found' }
    }

    // ✅ First-time integration: user exists but has no integrations
    if (integration.integrations.length === 0) {
      console.log('🔄 [onIntegrate] First-time integration - no existing integrations found')
      console.log('🔄 [onIntegrate] Step 1: Generating short-lived token...')

      // 1) SHORT-LIVED TOKEN
      console.log('🔄 [onIntegrate] Step 1: Generating short-lived token from code...')
      let token
      try {
        token = await generateTokens(code)
        console.log('✅ [onIntegrate] Short-lived token received:', {
          hasToken: !!token,
          hasAccessToken: !!token?.access_token,
          tokenKeys: token ? Object.keys(token) : [],
        })
      } catch (tokenError: any) {
        console.error('❌ [onIntegrate] Failed to generate token:', tokenError)
        return { 
          status: 500, 
          message: tokenError?.message || 'Failed to exchange authorization code for token' 
        }
      }

      if (!token || !token.access_token) {
        console.error('❌ [onIntegrate] Token response missing access_token:', token)
        return { status: 401, message: 'No access token received from Facebook' }
      }

      // 2) EXCHANGE TO LONG-LIVED TOKEN
      const instagramBaseUrl = process.env.INSTAGRAM_BASE_URL
      const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET || process.env.META_APP_SECRET

      if (!instagramBaseUrl || !clientSecret) {
        console.error('❌ [onIntegrate] Missing required environment variables:', {
          hasINSTAGRAM_BASE_URL: !!instagramBaseUrl,
          hasINSTAGRAM_CLIENT_SECRET: !!process.env.INSTAGRAM_CLIENT_SECRET,
          hasMETA_APP_SECRET: !!process.env.META_APP_SECRET,
        })
        return { status: 500, message: 'Missing required environment variables for token exchange' }
      }

      const longRes = await axios.get(
        `${instagramBaseUrl}/access_token`,
        {
          params: {
            grant_type: 'ig_exchange_token',
            client_secret: clientSecret,
            access_token: token.access_token,
          },
        }
      )

      const longToken = longRes.data?.access_token
      // ✅ Validate expiresIn is a number
      const rawExpiresIn = longRes.data?.expires_in
      const expiresIn = typeof rawExpiresIn === 'number' && rawExpiresIn > 0 
        ? rawExpiresIn 
        : 60 * 24 * 60 * 60 // Default to 60 days if invalid

      if (!longToken) {
        return { status: 401, message: 'Failed to convert to long-lived token' }
      }

      // 3) FETCH INSTAGRAM PROFILE (THIS IS WHAT WAS MISSING)
      const profileResponse = await axios.get(
        `${instagramBaseUrl}/me`,
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
      console.log('💾 [onIntegrate] Step 4: Saving integration to database...')
      console.log('💾 [onIntegrate] Data to save:', {
        userId: user.id,
        hasLongToken: !!longToken,
        expireDate: expire_date,
        igId,
        igUsername,
        hasProfilePhoto: !!igProfilePhoto,
      })
      
      const create = await createIntegration(
        user.id,
        longToken,
        expire_date,
        igId,
        igUsername,
        igProfilePhoto
      )

      console.log('💾 [onIntegrate] Integration saved successfully:', {
        hasData: !!create,
        dataKeys: create ? Object.keys(create) : [],
        firstname: create?.firstname,
        lastname: create?.lastname,
      })
      console.log('✅ [onIntegrate] ===== INTEGRATION COMPLETE =====')

      return { status: 200, data: create }
    }

    // ✅ ALLOW RECONNECTION: Update existing integration with new token
    if (integration.integrations.length > 0) {
      console.log('🔄 [onIntegrate] Updating existing integration...')
      console.log('🔄 [onIntegrate] Existing integration count:', integration.integrations.length)
      const existingIntegration = integration.integrations[0]
      console.log('🔄 [onIntegrate] Existing integration ID:', existingIntegration.id)
      
      // 1) SHORT-LIVED TOKEN
      console.log('🔄 [onIntegrate] Step 1: Generating short-lived token from code...')
      let token
      try {
        token = await generateTokens(code)
        console.log('✅ [onIntegrate] Short-lived token received:', {
          hasToken: !!token,
          hasAccessToken: !!token?.access_token,
        })
      } catch (tokenError: any) {
        console.error('❌ [onIntegrate] Failed to generate token:', tokenError)
        return { 
          status: 500, 
          message: tokenError?.message || 'Failed to exchange authorization code for token' 
        }
      }

      if (!token || !token.access_token) {
        console.error('❌ [onIntegrate] Token response missing access_token:', token)
        return { status: 401, message: 'No access token received from Facebook' }
      }

      // 2) EXCHANGE TO LONG-LIVED TOKEN
      const instagramBaseUrl = process.env.INSTAGRAM_BASE_URL
      const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET || process.env.META_APP_SECRET

      if (!instagramBaseUrl || !clientSecret) {
        console.error('❌ [onIntegrate] Missing required environment variables:', {
          hasINSTAGRAM_BASE_URL: !!instagramBaseUrl,
          hasINSTAGRAM_CLIENT_SECRET: !!process.env.INSTAGRAM_CLIENT_SECRET,
          hasMETA_APP_SECRET: !!process.env.META_APP_SECRET,
        })
        return { status: 500, message: 'Missing required environment variables for token exchange' }
      }

      const longRes = await axios.get(
        `${instagramBaseUrl}/access_token`,
        {
          params: {
            grant_type: 'ig_exchange_token',
            client_secret: clientSecret,
            access_token: token.access_token,
          },
        }
      )

      const longToken = longRes.data?.access_token
      // ✅ Validate expiresIn is a number
      const rawExpiresIn = longRes.data?.expires_in
      const expiresIn = typeof rawExpiresIn === 'number' && rawExpiresIn > 0 
        ? rawExpiresIn 
        : 60 * 24 * 60 * 60 // Default to 60 days if invalid

      if (!longToken) {
        return { status: 401, message: 'Failed to convert to long-lived token' }
      }

      // 3) FETCH INSTAGRAM PROFILE
      const profileResponse = await axios.get(
        `${instagramBaseUrl}/me`,
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

      console.log('✅ Updated Instagram data:', {
        id: igId,
        username: igUsername,
        hasPhoto: !!igProfilePhoto,
      })

      const expire_date = new Date(Date.now() + expiresIn * 1000)

      // 4) UPDATE EXISTING INTEGRATION
      const { updateIntegration } = await import('./queries')
      const updated = await updateIntegration(
        existingIntegration.id,
        longToken,
        expire_date,
        igId,
        igUsername,
        igProfilePhoto
      )

      console.log('✅ [onIntegrate] Integration updated successfully')
      console.log('✅ [onIntegrate] Updated data:', {
        hasData: !!updated,
        dataKeys: updated ? Object.keys(updated) : [],
      })
      console.log('✅ [onIntegrate] ===== UPDATE COMPLETE =====')
      return { status: 200, data: updated }
    }

    console.error('❌ [onIntegrate] Unexpected integration state')
    return { status: 404, message: 'Unexpected integration state' }
  } catch (error: any) {
    console.error('🔴 [onIntegrate] ===== ERROR OCCURRED =====')
    console.error('🔴 [onIntegrate] Error object:', error)
    console.error('🔴 [onIntegrate] Error message:', error?.message)
    console.error('🔴 [onIntegrate] Error stack:', error?.stack)
    if (error?.response) {
      console.error('🔴 [onIntegrate] Error response status:', error.response.status)
      console.error('🔴 [onIntegrate] Error response data:', error.response.data)
    }
    
    const errorMessage = error.response?.data?.error?.message || error.message || 'Integration failed'
    console.error('🔴 [onIntegrate] Final error message:', errorMessage)
    
    return {
      status: 500,
      message: errorMessage,
    }
  }
}
