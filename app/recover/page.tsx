import { Header, Footer } from '../components/Studio';
import AuthForm from '../components/AuthForm';
import { authConfigured } from '@/lib/supabase/server';
export default function Recover() { return <><Header /><main className="auth-page"><div className="auth-box"><h1 className="display">LET’S GET<br /><em>YOU BACK IN.</em></h1><p>Enter your account email. We’ll send a link to choose a new password.</p><AuthForm mode="recover" configured={authConfigured()} /><a className="text-link" href="/login">Back to sign in</a></div></main><Footer /></>; }
