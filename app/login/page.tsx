import { redirect } from 'next/navigation';
import { Header, Footer } from '../components/Studio';
import { getStudioUser } from '@/lib/auth';
import { isOwner } from '@/lib/studio-server';
import { authConfigured } from '@/lib/supabase/server';
import AuthForm from '../components/AuthForm';
export const dynamic = 'force-dynamic';
export default async function Login({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const p = await searchParams;
  const user = await getStudioUser(), studio = p.next === '/admin';
  if (user && !studio) redirect(isOwner(user.email) ? '/admin' : '/client');
  if (user && studio && isOwner(user.email)) redirect('/admin');
  return <><Header /><main className="auth-page"><div className="auth-box"><span className="eyebrow">{studio ? 'STUDIO OWNER ACCESS' : 'YOUR PRIVATE STUDIO SPACE'}</span><h1 className="display">GOOD TO<br /><em>SEE YOU.</em></h1><p>{studio ? 'Sign in with the studio owner email and password to open the admin workspace.' : 'Sign in with your email and password to view your galleries, invoices, and documents.'}</p><AuthForm next={p.next} configured={authConfigured()} allowSignup={!studio} initialMessage={p.error ? 'This link has expired or could not be verified. Request a fresh link.' : p.message === 'password-updated' ? 'Password updated. Sign in with your new password.' : ''} /><p className="fine">{studio ? 'Only the owner email configured in Vercel can enter studio access.' : 'Use the email address you shared with the studio. Your projects are assigned personally to you.'}</p></div></main><Footer /></>;
}
