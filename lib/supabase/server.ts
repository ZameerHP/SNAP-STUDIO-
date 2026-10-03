import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export function authConfigured() { return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)); }
export async function authClient() {
  if (!authConfigured()) throw new Error('Email sign-in is awaiting Supabase configuration.');
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!, {
    cookies: { getAll: () => jar.getAll(), setAll(values) { try { for (const { name, value, options } of values) jar.set(name, value, options); } catch { /* Server Components rely on proxy refresh. */ } } },
  });
}
