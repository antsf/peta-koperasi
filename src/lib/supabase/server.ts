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
