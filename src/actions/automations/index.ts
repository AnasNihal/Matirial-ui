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
  try {
    console.log('🔍 [getAutomationInfo] Starting for id:', id)
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
  await onCurrentUser()
  try {
    const update = await updateAutomation(automationId, data)
    if (update) {
      return { status: 200, data: 'Automation successfully updated' }
    }
    return { status: 404, data: 'Oops! could not find automation' }
  } catch (error) {
    return { status: 500, data: 'Oops! something went wrong' }
  }
}

export const saveListener = async (
  autmationId: string,
  listener: 'SMARTAI' | 'MESSAGE',
  prompt: string,
  reply?: string
) => {
  await onCurrentUser()
  try {
    const create = await addListener(autmationId, listener, prompt, reply)
    if (create) return { status: 200, data: 'Listener created' }
    return { status: 404, data: 'Cant save listener' }
  } catch (error) {
    return { status: 500, data: 'Oops! something went wrong' }
  }
}

export const saveTrigger = async (automationId: string, trigger: string[]) => {
  await onCurrentUser()
  try {
    const create = await addTrigger(automationId, trigger)
    if (create) return { status: 200, data: 'Trigger saved' }
    return { status: 404, data: 'Cannot save trigger' }
  } catch (error) {
    return { status: 500, data: 'Oops! something went wrong' }
  }
}

export const saveKeyword = async (automationId: string, keyword: string) => {
  await onCurrentUser()
  try {
    const create = await addKeyWord(automationId, keyword)

    if (create) return { status: 200, data: 'Keyword added successfully' }

    return { status: 404, data: 'Cannot add this keyword' }
  } catch (error) {
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
  const user = await onCurrentUser()

  try {
    const profile = await findUser(user.id)

    const integration = profile?.integrations?.[0]
    if (!integration || !integration.token) {
      return { status: 404, data: [] }
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
    let response = await fetch(
      `${process.env.INSTAGRAM_BASE_URL}/me/media?fields=id,caption,media_url,media_type,timestamp&limit=10&access_token=${token}`,
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
          `${process.env.INSTAGRAM_BASE_URL}/me/media?fields=id,caption,media_url,media_type,timestamp&limit=10&access_token=${token}`,
          { cache: 'no-store' }
        )

        parsed = await retry.json()
      } catch (e) {
        console.log('❌ ERROR refreshing expired IG token:', e)
        return { status: 401, data: [] }
      }
    }

    // ✅ 4) NORMAL RETURN
    if (parsed?.data?.length > 0) {
      return { status: 200, data: parsed }
    }

    return { status: 200, data: { data: [] } }
  } catch (error) {
    console.log('❌ ERROR in getProfilePosts:', error)
    return { status: 500, data: [] }
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
