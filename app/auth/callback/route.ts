import { NextResponse } from 'next/server';
import { authClient } from '@/lib/supabase/server';
import { safeNext } from '@/lib/auth-rules';
export async function GET(req: Request) {
  const url = new URL(req.url), code = url.searchParams.get('code');
  if (code) { const client = await authClient(); const { error } = await client.auth.exchangeCodeForSession(code); if (!error) return NextResponse.redirect(new URL(safeNext(url.searchParams.get('next')), url.origin)); }
  return NextResponse.redirect(new URL('/login?error=link-expired', url.origin));
}
