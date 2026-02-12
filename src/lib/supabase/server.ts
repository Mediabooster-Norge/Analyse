import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { fetch as nativeFetch } from 'undici';

/**
 * Creates a Supabase server client using undici's native fetch.
 * This bypasses Next.js 16's patched fetch which has intermittent
 * connection timeout issues in the dev server.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
      global: {
        fetch: nativeFetch as unknown as typeof globalThis.fetch,
      },
    }
  );
}
