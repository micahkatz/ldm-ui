import { authMiddleware, redirectToSignIn } from '@clerk/nextjs'
import { NextResponse } from 'next/server'

// See https://clerk.com/docs/references/nextjs/auth-middleware
// for more information about configuring your Middleware
export default authMiddleware({
    // Allow signed out users to access the specified routes:
    publicRoutes: ['/'],
    afterAuth(auth, req, evt) {
        // Handle users who aren't authenticated
        if (!auth.userId && !auth.isPublicRoute) {
            return redirectToSignIn({ returnBackUrl: req.url })
        }

        // If the user is signed in and trying to access a protected route, allow them to access route
        if (auth.userId && !auth.isPublicRoute) {
            return NextResponse.next()
        }
        // Allow users visiting public routes to access them
        return NextResponse.next()
    },
})

export const config = {
    matcher: [
        // Exclude files with a "." followed by an extension, which are typically static files.
        // Exclude files in the _next directory, which are Next.js internals.
        '/((?!.+\\.[\\w]+$|_next).*)',
        // Re-include any files in the api or trpc folders that might have an extension
        '/(api|trpc)(.*)',
    ],
}
