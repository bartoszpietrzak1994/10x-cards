import type { AstroGlobal } from "astro";

/**
 * Checks if the user is authenticated.
 * If not, redirects to the login page with a redirect parameter.
 * 
 * Usage in .astro pages:
 * ```astro
 * ---
 * import { requireAuth } from "@/lib/auth-helpers";
 * requireAuth(Astro);
 * ---
 * ```
 * 
 * @param Astro - Astro global object
 */
export function requireAuth(Astro: AstroGlobal): void {
  if (!Astro.locals.user) {
    const currentPath = Astro.url.pathname + Astro.url.search;
    return Astro.redirect(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
  }
}

/**
 * Checks if the user is authenticated (without redirecting).
 * Returns true if authenticated, false otherwise.
 * 
 * Usage:
 * ```astro
 * ---
 * import { checkAuth } from "@/lib/auth-helpers";
 * const isAuthenticated = checkAuth(Astro);
 * ---
 * ```
 * 
 * @param Astro - Astro global object
 * @returns boolean indicating if user is authenticated
 */
export function checkAuth(Astro: AstroGlobal): boolean {
  return Astro.locals.user !== null;
}

/**
 * Checks if the user is a guest (not authenticated).
 * If user is authenticated, redirects to the home page.
 * 
 * Useful for login/register pages to prevent authenticated users from accessing them.
 * 
 * Usage in auth pages (login, register):
 * ```astro
 * ---
 * import { requireGuest } from "@/lib/auth-helpers";
 * requireGuest(Astro);
 * ---
 * ```
 * 
 * @param Astro - Astro global object
 */
export function requireGuest(Astro: AstroGlobal): void {
  if (Astro.locals.user) {
    return Astro.redirect("/");
  }
}

/**
 * Gets the authenticated user from Astro.locals.
 * Returns null if not authenticated.
 * 
 * Usage:
 * ```astro
 * ---
 * import { getUser } from "@/lib/auth-helpers";
 * const user = getUser(Astro);
 * ---
 * ```
 * 
 * @param Astro - Astro global object
 * @returns UserDTO or null
 */
export function getUser(Astro: AstroGlobal) {
  return Astro.locals.user;
}
