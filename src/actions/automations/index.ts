'use server'

import { refreshToken } from '@/lib/fetch'
import { onCurrentUser } from '../user'
import { findUser } from '../user/queries'
import {
  addKeyWord,
  addListener,
  addPost,
  addTrigger,
  createAutomation,
  deleteKeywordQuery,
  findAutomation,
  getAutomations,
  updateAutomation,
} from './queries'
import { client } from '@/lib/prisma'

export const createAutomations = async (id?: string) => {
  const user = await onCurrentUser()
  try {
    const create = await createAutomation(user.id, id)
    if (create) return { status: 200, data: 'Automation created', res: create }

    return { status: 404, data: 'Oops! something went wrong' }
  } catch (error) {
    return { status: 500, data: 'Internal server error' }
  }
}

export const getAllAutomations = async () => {
  try {
    console.log('🔍 [getAllAutomations] Starting...')
    
    let user
    try {
      user = await onCurrentUser()
      console.log('🔍 [getAllAutomations] User:', user?.id)
    } catch (userError) {
      console.error('❌ [getAllAutomations] User fetch error:', userError)
      return { status: 401, data: [] }
    }
    
    if (!user || !user.id) {
      console.error('❌ [getAllAutomations] No user')
      return { status: 401, data: [] }
    }
    
    console.log('🔍 [getAllAutomations] Fetching from database...')
    let automations
    try {
      automations = await getAutomations(user.id)
      console.log('🔍 [getAllAutomations] Database result:', {
        hasAutomations: !!automations,
        automationsCount: automations?.automations?.length,
      })
    } catch (dbError) {
      console.error('❌ [getAllAutomations] Database error:', dbError)
      return { status: 500, data: [] }
    }
    
    // ✅ Handle case where user exists but has no automations
    if (automations && automations.automations) {
      const automationsList = automations.automations || []
      console.log('🔍 [getAllAutomations] Automations list length:', automationsList.length)
      
      // ✅ CRITICAL FIX: Manual serialization to ensure ONLY plain objects
      // Prisma objects can have non-serializable properties, so we extract only what we need
      const serializedAutomations = automationsList.map((automation: any) => {
        try {
          // Extract only primitive values from Prisma objects
          const result: any = {
            id: String(automation.id || ''),
            name: String(automation.name || ''),
            active: Boolean(automation.active ?? false),
            createdAt: null as string | null,
            updatedAt: null as string | null,
            keywords: [] as any[],
            listener: null as any,
          }
          
          // Handle dates safely
          if (automation.createdAt) {
            if (automation.createdAt instanceof Date) {
              result.createdAt = automation.createdAt.toISOString()
            } else {
              try {
                result.createdAt = new Date(automation.createdAt).toISOString()
              } catch {
                result.createdAt = null
              }
            }
          }
          
          if (automation.updatedAt) {
            if (automation.updatedAt instanceof Date) {
              result.updatedAt = automation.updatedAt.toISOString()
            } else {
              try {
                result.updatedAt = new Date(automation.updatedAt).toISOString()
              } catch {
                result.updatedAt = null
              }
            }
          }
          
          // Handle keywords array - extract only primitive values
          if (Array.isArray(automation.keywords)) {
            result.keywords = automation.keywords.map((k: any) => {
              if (!k || typeof k !== 'object') return null
              return {
                id: String(k.id || ''),
                word: String(k.word || ''),
                automationId: String(k.automationId || ''),
              }
            }).filter((k: any) => k !== null)
          }
          
          // Handle listener - extract only primitive values
          if (automation.listener && typeof automation.listener === 'object') {
            result.listener = {
              id: String(automation.listener.id || ''),
              listener: String(automation.listener.listener || ''),
            }
          }
          
          return result
        } catch (itemError) {
          console.error('❌ [getAllAutomations] Error serializing automation item:', itemError)
          console.error('❌ [getAllAutomations] Problematic automation:', {
            id: automation?.id,
            name: automation?.name,
            hasKeywords: !!automation?.keywords,
            hasListener: !!automation?.listener,
          })
          return null
        }
      }).filter((item: any) => item !== null) // Remove any failed serializations
      
      console.log('✅ [getAllAutomations] Returning', serializedAutomations.length, 'automations')
      
      // ✅ Final validation: Ensure it's serializable
      let finalResult
      try {
        const testString = JSON.stringify(serializedAutomations)
        console.log('✅ [getAllAutomations] Serialization validation passed, length:', testString.length)
        
        // ✅ Create the final result object
        finalResult = { status: 200, data: serializedAutomations }
        
        // ✅ Double-check the result is serializable
        const resultString = JSON.stringify(finalResult)
        console.log('✅ [getAllAutomations] Final result serialization passed, length:', resultString.length)
        console.log('✅ [getAllAutomations] Final result structure:', {
          hasStatus: 'status' in finalResult,
          hasData: 'data' in finalResult,
          statusValue: finalResult.status,
          dataLength: finalResult.data?.length,
        })
        
        return finalResult
      } catch (validateError) {
        console.error('❌ [getAllAutomations] Serialization validation failed:', validateError)
        console.error('❌ [getAllAutomations] Failed data:', serializedAutomations)
        return { status: 500, data: [] }
      }
    }
    
    console.log('⚠️ [getAllAutomations] No automations found')
    return { status: 200, data: [] }
  } catch (error: any) {
    console.error('❌ [getAllAutomations] FATAL ERROR:', error)
    console.error('❌ [getAllAutomations] Error stack:', error?.stack)
    console.error('❌ [getAllAutomations] Error message:', error?.message)
    return { status: 500, data: [] }
  }
}

export const getAutomationInfo = async (id: string) => {
  console.log('🔍 [getAutomationInfo] Starting for id:', id)
  
  // Validate UUID format before querying
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    console.error('❌ [getAutomationInfo] Invalid automation ID format:', id)
    return {
      status: 400,
      data: null,
      error: `Invalid automation ID format: ${id}. Expected UUID format.`,
    }
  }
  
  try {
    await onCurrentUser()
    
    const automation = await findAutomation(id)
    console.log('🔍 [getAutomationInfo] Database result:', {
      hasAutomation: !!automation,
      hasKeywords: !!automation?.keywords,
      hasPosts: !!automation?.posts,
      hasListener: !!automation?.listener,
    })
    
    if (!automation) {
      console.warn('⚠️ [getAutomationInfo] Automation not found')
      return { status: 404, data: null }
    }
    
    // ✅ CRITICAL FIX: Serialize Prisma objects to plain objects
    const serialized = {
      id: String(automation.id || ''),
      name: String(automation.name || ''),
      active: Boolean(automation.active ?? false),
      createdAt: automation.createdAt instanceof Date 
        ? automation.createdAt.toISOString() 
        : (automation.createdAt ? new Date(automation.createdAt).toISOString() : null),
      keywords: Array.isArray(automation.keywords) 
        ? automation.keywords.map((k: any) => ({
            id: String(k.id || ''),
            word: String(k.word || ''),
            automationId: String(k.automationId || ''),
          }))
        : [],
      trigger: Array.isArray(automation.trigger) 
        ? automation.trigger.map((t: any) => ({
            id: String(t.id || ''),
            type: String(t.type || ''),
            automationId: String(t.automationId || ''),
          }))
        : [],
      posts: Array.isArray(automation.posts) 
        ? automation.posts.map((p: any) => ({
            id: String(p.id || ''),
            postid: String(p.postid || ''),
            media: String(p.media || ''),
            caption: p.caption ? String(p.caption) : null,
            mediaType: String(p.mediaType || 'IMAGE'),
            automationId: String(p.automationId || ''),
          }))
        : [],
      listener: automation.listener ? {
        id: String(automation.listener.id || ''),
        listener: String(automation.listener.listener || ''),
        prompt: String(automation.listener.prompt || ''),
        commentReply: automation.listener.commentReply ? String(automation.listener.commentReply) : null,
        dmCount: Number(automation.listener.dmCount || 0),
        commentCount: Number(automation.listener.commentCount || 0),
        automationId: String(automation.listener.automationId || ''),
      } : null,
      User: automation.User ? {
        subscription: automation.User.subscription ? {
          id: String(automation.User.subscription.id || ''),
          plan: String(automation.User.subscription.plan || ''),
        } : null,
        integrations: Array.isArray(automation.User.integrations) 
          ? automation.User.integrations.map((i: any) => ({
              id: String(i.id || ''),
              token: String(i.token || ''),
              instagramId: i.instagramId ? String(i.instagramId) : null,
              instagramUsername: i.instagramUsername ? String(i.instagramUsername) : null,
              instagramProfilePicture: i.instagramProfilePicture ? String(i.instagramProfilePicture) : null,
            }))
          : [],
      } : null,
    }
    
    // ✅ Validate serialization
    try {
      JSON.stringify(serialized)
      console.log('✅ [getAutomationInfo] Serialization validation passed')
    } catch (serializeError) {
      console.error('❌ [getAutomationInfo] Serialization validation failed:', serializeError)
      return { status: 500, data: null }
    }
    
    console.log('✅ [getAutomationInfo] Returning serialized automation')
    return { status: 200, data: serialized }
  } catch (error: any) {
    console.error('❌ [getAutomationInfo] ERROR:', error)
    console.error('❌ [getAutomationInfo] Error stack:', error?.stack)
    return { status: 500, data: null }
  }
}

export const updateAutomationName = async (
  automationId: string,
  data: {
    name?: string
    active?: boolean
    automation?: string
  }
) => {
  console.log('🔍 [updateAutomationName] Starting for automationId:', automationId, 'data:', data)
  await onCurrentUser()
  try {
    const update = await updateAutomation(automationId, data)
    console.log('🔍 [updateAutomationName] Update result:', !!update)
    if (update) {
      console.log('✅ [updateAutomationName] Success')
      return { status: 200, data: 'Automation successfully updated' }
    }
    console.warn('⚠️ [updateAutomationName] Automation not found')
    return { status: 404, data: 'Oops! could not find automation' }
  } catch (error: any) {
    console.error('❌ [updateAutomationName] ERROR:', error)
    console.error('❌ [updateAutomationName] Error details:', { message: error?.message, stack: error?.stack })
    return { status: 500, data: 'Oops! something went wrong' }
  }
}

export const saveListener = async (
  autmationId: string,
  listener: 'SMARTAI' | 'MESSAGE',
  prompt: string,
  reply?: string
) => {
  console.log('🔍 [saveListener] Starting for automationId:', autmationId, 'listener:', listener, 'prompt length:', prompt?.length)
  await onCurrentUser()
  try {
    const create = await addListener(autmationId, listener, prompt, reply)
    console.log('🔍 [saveListener] Create result:', !!create)
    if (create) {
      console.log('✅ [saveListener] Success')
      return { status: 200, data: 'Listener created' }
    }
    console.warn('⚠️ [saveListener] Failed to create listener')
    return { status: 404, data: 'Cant save listener' }
  } catch (error: any) {
    console.error('❌ [saveListener] ERROR:', error)
    console.error('❌ [saveListener] Error details:', { message: error?.message, stack: error?.stack })
    return { status: 500, data: 'Oops! something went wrong' }
  }
}

export const saveTrigger = async (automationId: string, trigger: string[]) => {
  console.log('🔍 [saveTrigger] Starting for automationId:', automationId, 'trigger:', trigger)
  await onCurrentUser()
  try {
    const create = await addTrigger(automationId, trigger)
    console.log('🔍 [saveTrigger] Create result:', !!create)
    if (create) {
      console.log('✅ [saveTrigger] Success')
      return { status: 200, data: 'Trigger saved' }
    }
    console.warn('⚠️ [saveTrigger] Failed to create trigger')
    return { status: 404, data: 'Cannot save trigger' }
  } catch (error: any) {
    console.error('❌ [saveTrigger] ERROR:', error)
    console.error('❌ [saveTrigger] Error details:', { message: error?.message, stack: error?.stack })
    return { status: 500, data: 'Oops! something went wrong' }
  }
}

export const saveKeyword = async (automationId: string, keyword: string) => {
  console.log('🔍 [saveKeyword] Starting for automationId:', automationId, 'keyword:', keyword)
  await onCurrentUser()
  try {
    const create = await addKeyWord(automationId, keyword)
    console.log('🔍 [saveKeyword] Create result:', !!create)

    if (create) {
      console.log('✅ [saveKeyword] Success')
      return { status: 200, data: 'Keyword added successfully' }
    }
    console.warn('⚠️ [saveKeyword] Failed to create keyword')
    return { status: 404, data: 'Cannot add this keyword' }
  } catch (error: any) {
    console.error('❌ [saveKeyword] ERROR:', error)
    console.error('❌ [saveKeyword] Error details:', { message: error?.message, stack: error?.stack })
    return { status: 500, data: 'Oops! something went wrong' }
  }
}

export const deleteKeyword = async (id: string) => {
  await onCurrentUser()
  try {
    const deleted = await deleteKeywordQuery(id)
    if (deleted)
      return {
        status: 200,
        data: 'Keyword deleted',
      }
    return { status: 404, data: 'Keyword not found' }
  } catch (error) {
    return { status: 500, data: 'Oops! something went wrong' }
  }
}

export const getProfilePosts = async () => {
  try {
    console.log('🔍 [getProfilePosts] Starting...')
    const user = await onCurrentUser()
    console.log('🔍 [getProfilePosts] User ID:', user?.id)

    const profile = await findUser(user.id)
    console.log('🔍 [getProfilePosts] Profile found:', !!profile, 'hasIntegrations:', !!profile?.integrations)
    console.log('🔍 [getProfilePosts] Integrations array:', {
      isArray: Array.isArray(profile?.integrations),
      length: profile?.integrations?.length || 0,
      firstIntegration: profile?.integrations?.[0] ? {
        id: profile.integrations[0].id,
        hasToken: !!profile.integrations[0].token,
        tokenLength: profile.integrations[0].token?.length || 0,
      } : null,
    })

    const integration = profile?.integrations?.[0]
    console.log('🔍 [getProfilePosts] Integration found:', !!integration, 'hasToken:', !!integration?.token)
    
    if (!integration || !integration.token) {
      console.warn('⚠️ [getProfilePosts] No integration or token found')
      console.warn('⚠️ [getProfilePosts] Debug info:', {
        hasProfile: !!profile,
        integrationsLength: profile?.integrations?.length || 0,
        firstIntegrationExists: !!profile?.integrations?.[0],
        firstIntegrationHasToken: !!profile?.integrations?.[0]?.token,
      })
      return { status: 404, data: { data: [] } }
    }

    let token = integration.token

    // ✅ 1) PRE-EMPTIVE REFRESH IF EXPIRING SOON
    if (integration.expiresAt) {
      const expiresAt = new Date(integration.expiresAt)
      const now = new Date()
      const diffMs = expiresAt.getTime() - now.getTime()

      // e.g. if less than 5 days left, refresh now
      const FIVE_DAYS = 5 * 24 * 60 * 60 * 1000

      if (diffMs > 0 && diffMs < FIVE_DAYS) {
        console.log('🔁 Pre-emptive IG token refresh (expires soon)...')
        try {
          const newTokenData = await refreshToken(token)

          if (newTokenData?.access_token) {
            token = newTokenData.access_token

            const expiresInSec =
              typeof newTokenData.expires_in === 'number'
                ? newTokenData.expires_in
                : 60 * 24 * 60 * 60 // fallback 60 days

            await client.integrations.update({
              where: { id: integration.id },
              data: {
                token,
                expiresAt: new Date(Date.now() + expiresInSec * 1000),
              },
            })

            console.log('✅ Token refreshed before expiry')
          }
        } catch (e) {
          console.log('❌ Failed pre-emptive IG refresh:', e)
          // continue with old token, IG will respond if invalid
        }
      }
    }

    // ✅ 2) TRY FETCHING MEDIA WITH CURRENT / REFRESHED TOKEN
    // Include all media types: images, videos (reels), and carousels
    let response = await fetch(
      `${process.env.INSTAGRAM_BASE_URL}/me/media?fields=id,caption,media_url,media_type,timestamp,thumbnail_url&limit=50&access_token=${token}`,
      { cache: 'no-store' }
    )

    let parsed = await response.json()

    // ✅ 3) IF IG SAYS TOKEN EXPIRED (code 190) → REFRESH & RETRY ONCE
    if (parsed?.error?.code === 190) {
      console.log('🔁 Token expired, refreshing & retrying...')

      try {
        const newTokenData = await refreshToken(token)
        if (!newTokenData?.access_token) {
          console.log('❌ Refresh response missing access_token')
          return { status: 401, data: [] }
        }

        token = newTokenData.access_token

        const expiresInSec =
          typeof newTokenData.expires_in === 'number'
            ? newTokenData.expires_in
            : 60 * 24 * 60 * 60 // fallback 60 days

        await client.integrations.update({
          where: { id: integration.id },
          data: {
            token,
            expiresAt: new Date(Date.now() + expiresInSec * 1000),
          },
        })

        const retry = await fetch(
          `${process.env.INSTAGRAM_BASE_URL}/me/media?fields=id,caption,media_url,media_type,timestamp,thumbnail_url&limit=50&access_token=${token}`,
          { cache: 'no-store' }
        )

        parsed = await retry.json()
        console.log('🔍 [getProfilePosts] Retry response:', { hasData: !!parsed?.data, dataLength: parsed?.data?.length, hasError: !!parsed?.error })
      } catch (e: any) {
        console.error('❌ [getProfilePosts] ERROR refreshing expired IG token:', e)
        console.error('❌ [getProfilePosts] Refresh error details:', { message: e?.message, stack: e?.stack })
        return { status: 401, data: { data: [] } }
      }
    }

    // ✅ 4) NORMAL RETURN
    console.log('🔍 [getProfilePosts] Parsed response:', {
      hasData: !!parsed?.data,
      dataLength: parsed?.data?.length,
      hasError: !!parsed?.error,
      errorCode: parsed?.error?.code,
      errorMessage: parsed?.error?.message,
    })
    
    if (parsed?.error) {
      console.error('❌ [getProfilePosts] Instagram API error:', parsed.error)
      return { status: 401, data: { data: [] } }
    }
    
    if (parsed?.data?.length > 0) {
      // Log media types for debugging
      const mediaTypes = parsed.data.map((item: any) => ({
        id: item.id,
        media_type: item.media_type,
        has_thumbnail: !!item.thumbnail_url,
        has_media_url: !!item.media_url,
      }))
      console.log('✅ [getProfilePosts] Returning', parsed.data.length, 'posts')
      console.log('🔍 [getProfilePosts] Media types breakdown:', {
        images: mediaTypes.filter((m: any) => m.media_type === 'IMAGE').length,
        videos: mediaTypes.filter((m: any) => m.media_type === 'VIDEO').length,
        carousels: mediaTypes.filter((m: any) => m.media_type === 'CAROUSEL_ALBUM').length,
        samples: mediaTypes.slice(0, 5),
      })
      return { status: 200, data: parsed }
    }

    console.warn('⚠️ [getProfilePosts] No posts found, returning empty array')
    return { status: 200, data: { data: [] } }
  } catch (error: any) {
    console.error('❌ [getProfilePosts] ERROR:', error)
    console.error('❌ [getProfilePosts] Error details:', { 
      message: error?.message, 
      stack: error?.stack,
      name: error?.name,
    })
    return { status: 500, data: { data: [] } }
  }
}



export const savePosts = async (
  autmationId: string,
  posts: {
    postid: string
    caption?: string
    media: string
    mediaType: 'IMAGE' | 'VIDEO' | 'CAROSEL_ALBUM'
  }[]
) => {
  await onCurrentUser()
  try {
    const create = await addPost(autmationId, posts)

    if (create) return { status: 200, data: 'Posts attached' }

    return { status: 404, data: 'Automation not found' }
  } catch (error) {
    return { status: 500, data: 'Oops! something went wrong' }
  }
}

export const activateAutomation = async (id: string, state: boolean) => {
  await onCurrentUser()
  try {
    const update = await updateAutomation(id, { active: state })
    if (update)
      return {
        status: 200,
        data: `Automation ${state ? 'activated' : 'disabled'}`,
      }
    return { status: 404, data: 'Automation not found' }
  } catch (error) {
    return { status: 500, data: 'Oops! something went wrong' }
  }
}
