'use client';
import { useState } from 'react';
type Mode = 'login' | 'signup' | 'recover' | 'password';
export default function AuthForm({ mode: initial = 'login', next = '', configured = true, initialMessage = '', allowSignup = true }: { mode?: Mode; next?: string; configured?: boolean; initialMessage?: string; allowSignup?: boolean }) {
  const [mode, setMode] = useState<Mode>(initial), [busy, setBusy] = useState(false), [message, setMessage] = useState(initialMessage);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setMessage('');
    const data = Object.fromEntries(new FormData(e.currentTarget));
    if (mode !== 'login' && data.password !== undefined && data.password !== data.confirm) { setMessage('The passwords do not match.'); setBusy(false); return; }
    try {
      const response = await fetch('/api/auth/' + mode, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, next }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      if (result.next) window.location.assign(result.next); else setMessage(result.message);
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to sign in. Please try again.'); } finally { setBusy(false); }
  }
  return <><form className="auth-form" onSubmit={submit}>
    {!configured && <p role="alert">Sign-in is awaiting setup. Please contact the studio.</p>}
    {mode !== 'password' && <label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" /></label>}
    {mode !== 'recover' && <label>{mode === 'password' ? 'New password' : 'Password'}<input name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'login' ? 1 : 12} maxLength={128} required /></label>}
    {['signup','password'].includes(mode) && <label>Confirm password<input name="confirm" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /><span className="fine">Use at least 12 characters.</span></label>}
    {message && <p className="auth-message" role="status">{message}</p>}
    <button className="pill gold-pill" disabled={busy || !configured}>{busy ? 'Please wait…' : ({ login: 'Sign in', signup: 'Create account', recover: 'Send reset link', password: 'Save new password' })[mode]} ↗</button>
  </form>{initial === 'login' && <div className="auth-links">{allowSignup && <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(''); }}>{mode === 'login' ? 'New client? Create account' : 'Already have an account? Sign in'}</button>}<a href="/recover">Forgot password?</a></div>}</>;
}
