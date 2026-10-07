import { NextResponse } from 'next/server';
import { authClient } from '@/lib/supabase/server';
import { safeNext } from '@/lib/auth-rules';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const next = safeNext(url.searchParams.get('next'));

  const client = await authClient();

  // Supports custom Supabase email templates that send TokenHash directly
  // to this route. This does not depend on the browser that started signup.
  if (tokenHash && ['signup', 'email', 'recovery', 'invite'].includes(type || '')) {
    const { error } = await client.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'signup' | 'email' | 'recovery' | 'invite',
    });

    if (!error) {
      const destination = type === 'recovery' || type === 'invite' ? '/reset-password' : next;
      return NextResponse.redirect(new URL(destination, url.origin));
    }

    return NextResponse.redirect(new URL('/login?error=link-expired', url.origin));
  }

  if (code) {
    const { error } = await client.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }

    // Supabase can successfully confirm the email before redirecting here,
    // while PKCE exchange fails if the email app opened a different browser
    // and the original verifier cookie is unavailable. The account is still
    // confirmed, so send the client to normal password sign-in instead of
    // incorrectly telling them the confirmation link failed.
    return NextResponse.redirect(new URL('/login?message=email-confirmed&next=' + encodeURIComponent(next), url.origin));
  }

  return NextResponse.redirect(new URL('/login?error=link-expired', url.origin));
}
