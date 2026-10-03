import { requireStudioUser } from '@/lib/auth';
import AuthForm from '../components/AuthForm';
export const dynamic = 'force-dynamic';
export default async function ResetPassword() { await requireStudioUser('/reset-password'); return <main className="auth-page"><div className="auth-box"><h1 className="display">A FRESH<br /><em>START.</em></h1><p>Choose your new studio account password.</p><AuthForm mode="password" /></div></main>; }
