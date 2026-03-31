import { type Handle, type HandleServerError } from '@sveltejs/kit';

// @convex-dev/auth sets the JWT cookie CLIENT-SIDE after the OAuth redirect.
// Checking for it here in a server hook creates a race condition:
// the server redirects back to /auth/login before the client JS has a chance
// to store the token, causing "Client disconnected" on the Convex callback.
//
// Auth-guarding is handled client-side in dashboard/+layout.svelte via useAuth().

export const handle: Handle = async ({ event, resolve }) => {
	// Add security headers
	const response = await resolve(event);

	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

	return response;
};

// Global error handler - catches unhandled errors
export const handleError: HandleServerError = async ({ error }) => {
	console.error('Server error:', error);

	// Return safe error message for client (don't expose internal details)
	return {
		message: 'An unexpected error occurred. Please try again.'
	};
};
