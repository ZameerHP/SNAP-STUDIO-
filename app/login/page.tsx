import { redirect } from 'next/navigation';
import { Header, Footer } from '../components/Studio';
import { getStudioUser } from '@/lib/auth';
import { isOwner } from '@/lib/studio-server';
import { authConfigured } from '@/lib/supabase/server';
import AuthForm from '../components/AuthForm';
export const dynamic = 'force-dynamic';
export default async function Login({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await getStudioUser(); if (user) redirect(isOwner(user.email) ? '/admin' : '/client');
  const p = await searchParams;
  return <><Header /><main className="auth-page"><div className="auth-box"><span className="eyebrow">YOUR PRIVATE STUDIO SPACE</span><h1 className="display">GOOD TO<br /><em>SEE YOU.</em></h1><p>Sign in with your email and password to view your galleries, invoices, and documents.</p><AuthForm next={p.next} configured={authConfigured()} initialMessage={p.error ? 'This link has expired or could not be verified. Request a fresh link.' : p.message === 'password-updated' ? 'Password updated. Sign in with your new password.' : ''} /><p className="fine">Use the email address you shared with the studio. Your projects are assigned personally to you.</p></div></main><Footer /></>;
}
