import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase browser client — uses anon key.
 * Safe to use in client components.
 * NEVER use this for operations requiring the service role key.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
