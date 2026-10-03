# Super Snap Studio

Photography website and owner/client platform built with standard Next.js, React, Supabase Database/Auth/Storage, and Square payments. Deploy this repository to Vercel. Email and password sign-in is at `/login`; the owner dashboard is `/admin`, and client galleries are at `/client`.

## 1. Create Supabase (one time)

1. Create a new project at https://supabase.com/dashboard.
2. Open **SQL Editor → New query**, paste the entire contents of [`supabase/setup.sql`](supabase/setup.sql), and click **Run** once. This creates tables, protected database functions, and the private `studio-media` bucket. Do not run it against an existing unrelated database. API keys alone cannot create this schema.
3. Developers using Supabase CLI can instead apply the identical migration in `supabase/migrations/` (do not apply both methods).
4. In **Authentication → Providers → Email**, enable email/password and keep email confirmation enabled.
5. In **Authentication → Users → Add user → Create new user**, enter the studio owner's email and a strong password (12+ characters). Enable **Auto Confirm User** for this owner you are creating. Set `OWNER_EMAIL` to exactly that address. Passwords are stored by Supabase Auth; there is no `ADMIN_PASSWORD` environment variable.
6. Configure custom SMTP in Supabase Auth before inviting real clients or using password resets. Supabase's default mail service is restricted and is not a production email sender. Resend SMTP is one option; configuring the website's `RESEND_API_KEY` alone does not configure Supabase Auth email.

## 2. Add environment variables in Vercel

Open your Vercel project → **Settings → Environment Variables**. Use the exact variable names below, with values from the same Supabase project. Add them to Production; add Preview separately if needed.

| Variable | Where to get the value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project Connect dialog / Settings → API: Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase Settings → API Keys: publishable key |
| `SUPABASE_SECRET_KEY` | Supabase Settings → API Keys: secret key; server only |
| `OWNER_EMAIL` | Email of the confirmed owner user created above |
| `SITE_URL` | Final HTTPS Vercel or custom domain, e.g. `https://your-studio.vercel.app` |

Legacy projects may use `NEXT_PUBLIC_SUPABASE_ANON_KEY` instead of the publishable key, and `SUPABASE_SERVICE_ROLE_KEY` instead of the secret key. Use one matching pair. Never put the secret/service-role key in a `NEXT_PUBLIC_` variable, client code, or GitHub. No database connection string is needed by this app.

Copy the optional Square, Resend and DocuSeal names from [`.env.example`](.env.example). Missing optional credentials disable the corresponding action with a setup message. Real payments require the studio's Square account and production credentials; see [`docs/SQUARE-SETUP.md`](docs/SQUARE-SETUP.md).

## 3. Fix Vercel build settings and deploy

- Import `ZameerHP/SNAP-STUDIO-`, branch `main`.
- Root Directory: repository root (`.`).
- Framework Preset: **Next.js**.
- Build Command: **`pnpm build`**.
- Output Directory: **`.next`** (or the Next.js default; remove any old custom `dist` override).
- Install Command: default package-manager detection / `pnpm install --frozen-lockfile`.
- Use Node.js 22 or 24.
- Deploy again after saving environment variables. If the old failed build was cached, redeploy without the existing build cache.

`vercel.json` sets the framework, build command and output directory. The previous adapter build did not create Next.js's `.next/routes-manifest.json`; this repository now runs `next build` and produces normal Next.js output. There are no Cloudflare runtime, D1/R2, Wrangler or trusted-header login requirements.

## 4. Finish authentication URLs

In Supabase **Authentication → URL Configuration**:

- Site URL: the same final URL as `SITE_URL`.
- Redirect URLs: `https://YOUR-DOMAIN/auth/callback**` and, for local testing, `http://localhost:3000/auth/callback**`.
- Add any Preview domain you intentionally use for Auth; never use a broad production wildcard for unrelated domains.

Open `/admin` and sign in with the owner's email and password. Clients create an account through `/login`, confirm their email, then sign in. Add a client record with the same email in the owner dashboard and assign its projects. Unassigned clients see an empty account, not other clients' projects.

Default confirmation/reset links use the PKCE callback and should be opened in the browser that requested them. For cross-device links with custom SMTP/templates, the app also supports `/auth/confirm?token_hash={{ .TokenHash }}&type=signup` (confirmation), `type=recovery` (password reset), and `type=invite` (invitation). Recovery/invite links lead to the password form. Use your fixed trusted site origin for these template links.

## Development and validation

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
# Fill your own development project keys in .env.local
pnpm dev
pnpm typecheck
pnpm test
pnpm build
```

The test suite executes the actual SQL schema and functions in local PostgreSQL-compatible PGlite, verifies database access restrictions and payment idempotency, and checks auth redirect/payment/media rules. It does not connect to a real provider account. Before handover, verify owner login, a separate client login, private gallery access, upload/download, password reset, and Square Sandbox payment/refund webhooks in your deployed environment.

## Features and data

See [`docs/FEATURES.md`](docs/FEATURES.md), [`docs/STORAGE.md`](docs/STORAGE.md), and [`docs/SQUARE-SETUP.md`](docs/SQUARE-SETUP.md). Supabase stores data independently of Vercel deployments. Redeploying the website does not recreate or erase your Supabase project.

This repository contains source code and demonstration assets, not live client records or private uploaded media. Data from the previous hosted database is not automatically copied into your new Supabase project; existing records/media require a separate export/import if you have used that database. No provider credentials or production payment tests are included.
