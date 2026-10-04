# Super Snap Studio — features and current limitations

## Public website

- Home, Work, Services, About, Contact, individual demonstration studies, published client portfolios, and image credits.
- Photography, Videography, Live Streaming, and Passport Photos service content.
- Oversized editorial typography, GSAP scroll scenes, Lenis smooth scrolling, expanding hero imagery, pinned horizontal desktop gallery, parallax, loading transition, and reduced-motion/mobile fallbacks.
- Enquiry form stores name, email, phone, requested service, preferred date, location, and message. It has validation, a honeypot, and basic request-rate limiting.
- Enquiries are requests, not confirmed bookings. There is no live availability calendar or automatic appointment scheduling.
- Business phone/email and social links; selectable demonstration projects are clearly labelled. Replace them with real studio work.

## Owner dashboard — /admin

- Authenticated owner access and overview counts.
- Add client names/emails; client identity links on the client's first verified sign-in.
- Create/edit projects, assign the initial client, set session date/service/description, and track planning/scheduled/editing/delivered stages. Existing project reassignment is not supported by the backend.
- Add images/videos to projects at any time; upload progress and retry failed uploads.
- Set gallery cover and image order; inspect client favourites and submitted selections.
- Keep galleries private, allow/disallow client downloads, or explicitly publish the entire project to the public portfolio.
- Track enquiry status: new, contacted, booked, closed.
- Create invoice line items, quantities, currency, tax, deposit and due date; download server-generated PDFs; see paid/remaining/refunded balances.
- Send project messages immediately. Provider-based outbound email, incoming email, and signatures need their service configuration.
- Request a document signature from a prepared DocuSeal template; view confirmed signed PDF/audit links.
- Edit studio/about copy, contact details, social links, and real showreel URL.
- View integration configuration status. “Configured” means required variables exist, not that an account-level payment/email test has passed.

## Client dashboard — /client

- Supabase email/password sign-in with a confirmed email matching the client assigned by the owner.
- View only assigned projects, images and videos; gallery lightbox and navigation.
- Mark favourites, submit selections, and download files when allowed.
- View assigned invoices/PDFs and pay deposits or remaining balances using Square after connection.
- View/review signing requests and confirmed signed documents.
- Read/send project messages with the studio.

## Storage and access

Supabase Postgres stores clients, enquiries, project/media metadata, favourites, invoices, payment records, checkout attempts, documents, messages, settings, webhook event IDs, and audit entries. Supabase Storage stores uploaded original media bytes. Private media and invoice routes authorize requests on the server. Client data and uploaded media are not part of the GitHub repository.

Allowed uploads: JPEG, PNG, WebP, MP4, WebM, up to 25 MB each. No transcoding, thumbnail generation pipeline, bulk ZIP downloads, or deletion/retention UI is implemented. Download controls cannot prevent screenshots. This is a small-studio implementation; large catalogues need pagination/query tuning and operational monitoring before a scale claim is appropriate.

## Connections and remaining setup

- Square: checkout/payment/refund adapter implemented; credentials and Sandbox/live acceptance tests outstanding. No Stripe checkout remains.
- Resend: manual outgoing email, receiving/delivery webhook adapter implemented; API key, verified sender domain, receiving configuration and tests outstanding. This is not a Gmail inbox integration.
- DocuSeal: template-based signing adapter implemented; API key, HMAC secret, template and tests outstanding.
- Owner email notifications for new enquiries, client messages, Square payments/refunds, signed documents, and incoming Resend email require `STUDIO_NOTIFICATION_EMAIL`, `RESEND_API_KEY`, and a verified `EMAIL_FROM`. Notification failure is logged and never undoes the saved event; the dashboard remains the source of record. Automatic client invitation, invoice, gallery-ready, and reminder emails are not implemented.
- Live Streaming is a service offered by the studio, not a streaming/video-call platform implemented inside this website.
- Passport Photos is a service enquiry, not an automated passport-photo crop/compliance checker.
- Vercel deployment protection must allow the production webhook URLs to be reached by the configured providers.
- Set OWNER_EMAIL to the actual studio owner for handover. Provide genuine portfolio media, showreel and final business/tax details.

This repository uses standard Next.js on Vercel and Supabase for database, email/password authentication and private storage. Follow README.md for one-time SQL/Auth setup and environment variables. Existing hosted data is not automatically migrated.
