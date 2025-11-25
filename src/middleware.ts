import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

/** ✅ Public routes (never protected) */
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
])

/** ✅ Protected routes (your original ones) */
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/payment(.*)',
  '/callback(.*)',
])

export default clerkMiddleware(async (auth, req) => {

  // 1. If public route → allow
  if (isPublicRoute(req)) return

  // 2. If protected → lock it
  if (isProtectedRoute(req)) {
    await auth.protect()
  }

  // 3. Everything else = allow
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
