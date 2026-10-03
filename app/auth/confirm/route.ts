import { NextResponse } from 'next/server';
import { authClient } from '@/lib/supabase/server';
export async function GET(req: Request) {
  const url = new URL(req.url), token_hash = url.searchParams.get('token_hash'), type = url.searchParams.get('type');
  if (token_hash && ['signup','recovery','invite','email'].includes(type || '')) {
    const client = await authClient();
    const { error } = await client.auth.verifyOtp({ token_hash, type: type as 'signup' | 'recovery' | 'invite' | 'email' });
    if (!error) return NextResponse.redirect(new URL(type === 'recovery' || type === 'invite' ? '/reset-password' : '/client', url.origin));
  }
  return NextResponse.redirect(new URL('/login?error=link-expired', url.origin));
}
