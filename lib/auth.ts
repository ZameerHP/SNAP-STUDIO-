import 'server-only';
import { redirect } from 'next/navigation';
import { authClient, authConfigured } from './supabase/server';
export async function getStudioUser() {
  if (!authConfigured()) return null;
  const client = await authClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user?.email || !data.user.email_confirmed_at) return null;
  return { userId: data.user.id, email: data.user.email.toLowerCase(), displayName: data.user.email };
}
export async function requireStudioUser(path: string) {
  const user = await getStudioUser();
  if (!user) redirect('/login?next=' + encodeURIComponent(path));
  return user;
}
