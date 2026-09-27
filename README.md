# Super Snap Studio

React + TypeScript photography studio website and management workspace.

## Run

Use the package manager in pnpm-lock.yaml. Install dependencies, then run `pnpm dev`. Build with `pnpm build`. Typecheck with `pnpm exec tsc --noEmit`.

## Storage and auth

The Sites manifest declares D1 DB and R2 BUCKET. The schema is in db/schema.ts; generated schema-only migrations are in drizzle/. Sites applies migrations when publishing. Private galleries authorize every request using dispatcher-authenticated user identity. The owner is selected by the server-only OWNER_EMAIL. Clients are assigned by email, then linked to stable authenticated user IDs.

No shared admin credentials. Never trust user-controlled role fields. Media publishing is explicit at the project level. Files are limited to validated JPEG, PNG, WebP, MP4, and WebM under 25 MB.

## Connections

See public/setup-guide.txt and .env.example for configuration, callback URLs, and limitations. Square, Resend, and DocuSeal require credentials and acceptance testing before live use. This Site remains private until its owner explicitly changes its audience. External callbacks cannot reach an owner-private Site.

## Demonstration content

Six licensed photographs are credited in public/image-credits.txt. No invented client work, reviews, business statistics or prices are included.

## Scope and remaining setup

Implemented: cinematic public routes, enquiries, client/project management, persistent private media galleries, selections, download controls, public portfolio publishing, invoices/PDFs, project messaging, content editing, and provider adapters with verified callbacks.

Provider credentials, verified email domain, real studio portfolio and showreel, currency/tax decisions, and studio-owner handover remain to be supplied. Authentication uses ChatGPT sign-in rather than a separate password database. Outgoing emails currently require an explicit owner action; automated invitation/gallery/invoice/reminder emails are not enabled. Videos are uploaded as original files; transcoding is not included.

## Square payments

Stripe was replaced by Square. See [Square connection guide](docs/SQUARE-SETUP.md) for credentials, callbacks, seller-account ownership, and test steps. Local checks: `node --experimental-vm-modules tests/square.test.mjs`.

## Feature and storage guide

See [Features and current limitations](docs/FEATURES.md) and [Storage allowances](docs/STORAGE.md).

## Hosting portability

This repository is the complete application source and static assets, not a database backup. Production client data and uploaded private media are not committed. The current deployment uses Sites' Cloudflare Worker runtime, D1, R2, and trusted ChatGPT identity headers. Merely importing this repository into Vercel will not provision storage or reproduce authentication. Do not expose the Worker directly on another host with the current header-based auth: outside the Sites dispatcher, replace it with independently verified sessions/OIDC and provision the database/storage bindings first.

Environment variables in `.env.example` are placeholders; actual credentials belong in hosting secrets. A local `.env` does not configure production. Deploy again after changing hosted environment variables. Keep the Site owner-private until the owner deliberately enables the audience needed for client access and provider callbacks.
