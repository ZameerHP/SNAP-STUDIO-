import { NextResponse } from 'next/server';
import { authClient } from '@/lib/supabase/server';
import { safeNext } from '@/lib/auth-rules';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const next = safeNext(url.searchParams.get('next'));

  if (token_hash && ['signup','recovery','invite','email'].includes(type || '')) {
    const client = await authClient();
    const { error } = await client.auth.verifyOtp({
      token_hash,
      type: type as 'signup' | 'recovery' | 'invite' | 'email',
    });

    if (!error) {
      const destination = type === 'recovery' || type === 'invite' ? '/reset-password' : next;
      return NextResponse.redirect(new URL(destination, url.origin));
    }
  }

  return NextResponse.redirect(new URL('/login?error=link-expired', url.origin));
}
