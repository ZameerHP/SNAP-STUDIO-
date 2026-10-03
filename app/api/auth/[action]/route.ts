import { authClient } from '@/lib/supabase/server';
import { getStudioUser } from '@/lib/auth';
import { safeNext } from '@/lib/auth-rules';
import { body, email, failure, HttpError, isOwner, json, sameOrigin } from '@/lib/studio-server';
export async function POST(req: Request, { params }: { params: Promise<{ action: string }> }) {
  try {
    sameOrigin(req);
    const { action } = await params, input = await body(req), auth = await authClient();
    const origin = process.env.SITE_URL ? new URL(process.env.SITE_URL).origin : new URL(req.url).origin;
    if (action === 'logout') { const { error } = await auth.auth.signOut(); if (error) throw new HttpError('Unable to sign out. Please retry.'); return json({ ok: true, next: '/login' }); }
    if (action === 'recover') {
      const { error } = await auth.auth.resetPasswordForEmail(email(input.email), { redirectTo: origin + '/auth/callback?next=/reset-password' });
      if (error && error.status === 429) throw new HttpError('Too many attempts. Please try again later.', 429);
      if (error) throw new HttpError('Password reset is unavailable. Please contact the studio.', 503);
      return json({ ok: true, message: 'If this account exists, a password-reset email will arrive shortly.' });
    }
    if (!['login', 'signup', 'password'].includes(action)) throw new HttpError('Action not found.', 404);
    if (typeof input.password !== 'string' || input.password.length > 128 || input.password.length < (action === 'login' ? 1 : 12)) throw new HttpError('Use a password with at least 12 characters.');
    if (action === 'password') {
      if (!await getStudioUser()) throw new HttpError('Open a valid reset link or sign in first.', 401);
      const { error } = await auth.auth.updateUser({ password: input.password });
      if (error) throw new HttpError('Unable to update password. Please use a new reset link or a different password.');
      await auth.auth.signOut();
      return json({ ok: true, next: '/login?message=password-updated' });
    }
    const mail = email(input.email);
    if (action === 'signup') {
      const { error } = await auth.auth.signUp({ email: mail, password: input.password, options: { emailRedirectTo: origin + '/auth/callback?next=/client' } });
      if (error) throw new HttpError('Unable to create an account. Try signing in or contact the studio.', error.status === 429 ? 429 : 400);
      return json({ ok: true, message: 'Check your email to confirm your account, then sign in. Galleries appear once the studio assigns them.' });
    }
    const { data, error } = await auth.auth.signInWithPassword({ email: mail, password: input.password });
    if (error || !data.user?.email_confirmed_at) throw new HttpError('Email or password is incorrect, or your email still needs confirmation.', error?.status === 429 ? 429 : 401);
    const owner = isOwner(data.user.email || '');
    const next = safeNext(input.next, owner ? '/admin' : '/client');
    return json({ ok: true, next: !owner && next.startsWith('/admin') ? '/client' : next });
  } catch (e) { return failure(e); }
}
