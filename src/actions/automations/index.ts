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
  const user = await onCurrentUser()
  try {
    const automations = await getAutomations(user.id)
    if (automations) return { status: 200, data: automations.automations }
    return { status: 404, data: [] }
  } catch (error) {
    return { status: 500, data: [] }
  }
}

export const getAutomationInfo = async (id: string) => {
  await onCurrentUser()
  try {
    const automation = await findAutomation(id)
    if (automation) return { status: 200, data: automation }

    return { status: 404 }
  } catch (error) {
    return { status: 500 }
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
