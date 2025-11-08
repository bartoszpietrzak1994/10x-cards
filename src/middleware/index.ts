import { defineMiddleware } from "astro:middleware";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "../db/database.types.ts";
import type { UserDTO } from "../types.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  // Create Supabase server client with cookie handling
  const supabase = createServerClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
    cookies: {
      getAll() {
        // Parse cookies from request headers
        const cookieHeader = context.request.headers.get("cookie");
        if (!cookieHeader) return [];

        return cookieHeader.split(";").map((cookie) => {
          const [name, ...valueParts] = cookie.trim().split("=");
          return {
            name: name.trim(),
            value: valueParts.join("=").trim(),
          };
        });
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          context.cookies.set(name, value, options);
        });
      },
    },
  });

  // Add supabase client to context (for backward compatibility and API endpoints)
  context.locals.supabase = supabase;

  // Verify session and get user data
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      context.locals.user = null;
      return next();
    }

    // Fetch user data from public.users table with role
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, roles(name)")
      .eq("id", session.user.id)
      .single();

    if (userError || !userData) {
      context.locals.user = null;
      return next();
    }

    // Create UserDTO
    const user: UserDTO = {
      id: userData.id,
      email: userData.email,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      role: (userData.roles as any)?.name || "user",
    };

    context.locals.user = user;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in auth middleware:", error);
    context.locals.user = null;
  }

  return next();
});
