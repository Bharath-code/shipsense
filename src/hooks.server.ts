import { type Handle } from '@sveltejs/kit';

// @convex-dev/auth sets the JWT cookie CLIENT-SIDE after the OAuth redirect.
// Checking for it here in a server hook creates a race condition:
// the server redirects back to /auth/login before the client JS has a chance
// to store the token, causing "Client disconnected" on the Convex callback.
//
// Auth-guarding is handled client-side in dashboard/+layout.svelte via useAuth().

export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event);
};
