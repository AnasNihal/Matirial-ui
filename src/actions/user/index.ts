'use server'

import { currentUser } from '@clerk/nextjs/server'

import { redirect } from 'next/navigation'
import { createUser, findUser, updateSubscription } from './queries'
import { refreshToken } from '@/lib/fetch'
import { updateIntegration } from '../integrations/queries'
import { stripe } from '@/lib/stripe'

export const onCurrentUser = async () => {
  const user = await currentUser()
  if (!user) return redirect('/sign-in')

  return user
}

export const onBoardUser = async () => {
  const user = await onCurrentUser()
  try {
    const found = await findUser(user.id)
    if (found) {
      if (found.integrations.length > 0) {
        const today = new Date()
        const time_left =
          found.integrations[0].expiresAt?.getTime()! - today.getTime()

        const days = Math.round(time_left / (1000 * 3600 * 24))
        if (days < 5) {
          console.log('🔄 [onBoardUser] Token expires in', days, 'days, refreshing...')

          const refresh = await refreshToken(found.integrations[0].token)

          if (refresh && refresh.access_token) {
            const today = new Date()
            const expire_date = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000) // 60 days

            try {
              const update_token = await updateIntegration(
                found.integrations[0].id,
                refresh.access_token,
                expire_date
              )
              if (update_token) {
                console.log('✅ [onBoardUser] Token refreshed successfully')
              } else {
                console.error('❌ [onBoardUser] Update token failed - no result returned')
              }
            } catch (updateError: any) {
              console.error('❌ [onBoardUser] Update token failed:', updateError?.message || updateError)
            }
          } else {
            console.error('❌ [onBoardUser] Token refresh failed - no access_token in response')
          }
        }
      }

      return {
        status: 200,
        data: {
          firstname: found.firstname,
          lastname: found.lastname,
        },
      }
    }
    const created = await createUser(
      user.id,
      user.firstName!,
      user.lastName!,
      user.emailAddresses[0].emailAddress
    )
    return { status: 201, data: created }
  } catch (error) {
    console.log(error)
    return { status: 500 }
  }
}

export const onUserInfo = async () => {
  try {
  const user = await onCurrentUser()
    console.log('🔍 [onUserInfo] User ID:', user?.id)
    
    if (!user || !user.id) {
      console.error('❌ [onUserInfo] No user')
      return { status: 401, data: null }
    }
    
    const profile = await findUser(user.id)
    console.log('🔍 [onUserInfo] Profile found:', !!profile)
    
    if (profile) {
      console.log('✅ [onUserInfo] Returning profile with integrations:', profile.integrations?.length || 0)
      return { status: 200, data: profile }
    }

    console.warn('⚠️ [onUserInfo] Profile not found for user:', user.id)
    // ✅ Return empty data instead of 404 to prevent React Query errors
    return { status: 200, data: null }
  } catch (error: any) {
    console.error('❌ [onUserInfo] ERROR:', error)
    console.error('❌ [onUserInfo] Error stack:', error?.stack)
    return { status: 500, data: null }
  }
}

export const onSubscribe = async (session_id: string) => {
  console.log('🔍 [onSubscribe] Starting for session_id:', session_id)
  const user = await onCurrentUser()
  console.log('🔍 [onSubscribe] User ID:', user?.id)
  try {
    const session = await stripe.checkout.sessions.retrieve(session_id)
    console.log('🔍 [onSubscribe] Session found:', !!session, 'customer:', session?.customer)
    if (session) {
      const subscribed = await updateSubscription(user.id, {
        customerId: session.customer as string,
        plan: 'PRO',
      })
      console.log('🔍 [onSubscribe] Subscription update result:', !!subscribed)

      if (subscribed) {
        console.log('✅ [onSubscribe] Success')
        return { status: 200 }
      }
      console.warn('⚠️ [onSubscribe] Subscription update failed')
      return { status: 401 }
    }
    console.warn('⚠️ [onSubscribe] Session not found')
    return { status: 404 }
  } catch (error: any) {
    console.error('❌ [onSubscribe] ERROR:', error)
    console.error('❌ [onSubscribe] Error details:', { message: error?.message, stack: error?.stack })
    return { status: 500 }
  }
}
