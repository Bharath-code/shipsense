import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { type Handle, redirect } from "@sveltejs/kit";

// For SvelteKit, we'll manually check the cookie since convexAuthNextjsToken is tailored for Next.js.
// Or we can just let convexAuth pass a JWT token and we check if we have the Convex auth cookie.
// The default cookie name used by @convex-dev/auth is `__convexAuthJWT`.

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get("__convexAuthJWT");
  
  // Expose token to locals if needed
  event.locals.token = token;

  const isAuthRoute = event.url.pathname.startsWith("/auth/login");
  const isDashboardRoute = event.url.pathname.startsWith("/dashboard");

  // Basic redirection logic
  if (isDashboardRoute && !token) {
    throw redirect(303, "/auth/login");
  }

  if (isAuthRoute && token) {
    throw redirect(303, "/dashboard");
  }

  return resolve(event);
};
