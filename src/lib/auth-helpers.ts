import type { AstroGlobal } from "astro";

/**
 * Checks if user is authenticated and returns boolean.
 * Does not perform redirection.
 * 
 * Usage: const isAuthenticated = checkAuth(Astro);
 * 
 * @param Astro - Astro global object
 * @returns true if user is authenticated, false otherwise
 */
export function checkAuth(Astro: AstroGlobal): boolean {
  return Astro.locals.user !== null;
}

/**
 * Requires user to be authenticated.
 * If not authenticated, redirects to login page with redirect parameter.
 * 
 * Usage in protected .astro pages:
 * ---
 * import { requireAuth } from "@/lib/auth-helpers";
 * requireAuth(Astro);
 * ---
 * 
 * @param Astro - Astro global object
 * @throws Redirects to /auth/login if user is not authenticated
 */
export function requireAuth(Astro: AstroGlobal): void {
  if (!Astro.locals.user) {
    const currentPath = Astro.url.pathname;
    return Astro.redirect(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
  }
}

/**
 * Requires user to be a guest (not authenticated).
 * If authenticated, redirects to home page.
 * 
 * Usage in auth pages (login, register):
 * ---
 * import { requireGuest } from "@/lib/auth-helpers";
 * requireGuest(Astro);
 * ---
 * 
 * @param Astro - Astro global object
 * @throws Redirects to / if user is already authenticated
 */
export function requireGuest(Astro: AstroGlobal): void {
  if (Astro.locals.user) {
    return Astro.redirect("/");
  }
}

/**
 * Gets the current authenticated user or null.
 * 
 * Usage: const user = getCurrentUser(Astro);
 * 
 * @param Astro - Astro global object
 * @returns UserDTO if authenticated, null otherwise
 */
export function getCurrentUser(Astro: AstroGlobal) {
  return Astro.locals.user;
}

