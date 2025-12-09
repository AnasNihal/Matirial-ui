import { stripe } from '@/lib/stripe'
import { currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ 
        status: 401, 
        error: 'Unauthorized - User not authenticated' 
      }, { status: 401 })
    }

    const priceId = process.env.STRIPE_SUBSCRIPTION_PRICE_ID
    if (!priceId) {
      console.error('❌ [Payment] STRIPE_SUBSCRIPTION_PRICE_ID not configured')
      return NextResponse.json({ 
        status: 500, 
        error: 'Payment configuration error' 
      }, { status: 500 })
    }

    const hostUrl = process.env.NEXT_PUBLIC_HOST_URL
    if (!hostUrl) {
      console.error('❌ [Payment] NEXT_PUBLIC_HOST_URL not configured')
      return NextResponse.json({ 
        status: 500, 
        error: 'Payment configuration error' 
      }, { status: 500 })
    }

    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${hostUrl}/payment?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${hostUrl}/payment?cancel=true`,
        customer_email: user.emailAddresses[0]?.emailAddress,
      })

      if (session && session.url) {
        return NextResponse.json({
          status: 200,
          session_url: session.url,
        })
      }

      return NextResponse.json({ 
        status: 500, 
        error: 'Failed to create checkout session' 
      }, { status: 500 })
    } catch (stripeError: any) {
      console.error('❌ [Payment] Stripe error:', stripeError.message)
      return NextResponse.json({ 
        status: 500, 
        error: 'Payment processing failed',
        details: stripeError.message 
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('❌ [Payment] Unexpected error:', error)
    return NextResponse.json({ 
      status: 500, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
