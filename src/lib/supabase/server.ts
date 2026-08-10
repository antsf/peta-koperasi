import { createClient } from '@supabase/supabase-js'

/**
 * Supabase server client — uses SERVICE ROLE key.
 * ONLY use in API route handlers (app/api/**).
 * NEVER import this in any file with "use client" or that is imported by a client component.
 * The service role key bypasses RLS — use with care.
 */
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

/**
 * Supabase server client — uses ANON key (RLS still applies).
 * For read-only server-side access to public data (e.g. sitemap).
 * NEVER use this for writes that require the service role key.
 */
export function createAnonServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
