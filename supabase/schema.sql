-- ==============================================================================
-- SUPER SNAP STUDIO — PRODUCTION SUPABASE SQL SCHEMA & ROW LEVEL SECURITY (RLS)
-- London, Ontario Professional Photography, Cinema Videography & Broadcast
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. USERS TABLE (Staff, Directors, Clients)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'CLIENT' CHECK (role IN ('ADMIN', 'DIRECTOR', 'PRODUCER', 'CLIENT')),
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- ------------------------------------------------------------------------------
-- 2. CLIENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);

-- ------------------------------------------------------------------------------
-- 3. INQUIRIES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inquiries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  service_type TEXT,
  message TEXT,
  budget TEXT,
  location TEXT,
  date TEXT,
  time_slot TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'quoted', 'confirmed', 'closed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON public.inquiries(created_at DESC);

-- ------------------------------------------------------------------------------
-- 4. SERVICES & PACKAGES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.services (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  starting_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.packages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  service_id TEXT NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price TEXT NOT NULL,
  duration TEXT,
  features TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_packages_service_id ON public.packages(service_id);

-- ------------------------------------------------------------------------------
-- 5. OPERATING HOURS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.operating_hours (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  day_of_week INT UNIQUE NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_open BOOLEAN NOT NULL DEFAULT TRUE,
  open_time TEXT NOT NULL DEFAULT '09:00',
  close_time TEXT NOT NULL DEFAULT '18:00',
  slot_duration_minutes INT NOT NULL DEFAULT 60
);

-- ------------------------------------------------------------------------------
-- 6. INSTRUCTORS & PHOTOGRAPHERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.instructors (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.instructor_availability (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  instructor_id TEXT NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TEXT NOT NULL DEFAULT '09:00',
  end_time TEXT NOT NULL DEFAULT '18:00'
);

CREATE INDEX IF NOT EXISTS idx_instructor_avail_inst ON public.instructor_availability(instructor_id);

CREATE TABLE IF NOT EXISTS public.instructor_days_off (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  instructor_id TEXT NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- YYYY-MM-DD
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_instructor_date UNIQUE (instructor_id, date)
);

CREATE INDEX IF NOT EXISTS idx_instructor_days_off_date ON public.instructor_days_off(date);

-- ------------------------------------------------------------------------------
-- 7. STUDIO-WIDE CLOSURES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.studio_closures (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  date TEXT UNIQUE NOT NULL, -- YYYY-MM-DD
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_studio_closures_date ON public.studio_closures(date);

-- ------------------------------------------------------------------------------
-- 8. BOOKINGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  service_id TEXT REFERENCES public.services(id) ON DELETE SET NULL,
  instructor_id TEXT REFERENCES public.instructors(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_date TEXT, -- YYYY-MM-DD
  time_slot TEXT, -- HH:MM
  location TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('inquiry', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON public.bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event_date ON public.bookings(event_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- ------------------------------------------------------------------------------
-- 9. INVOICES & PAYMENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  booking_id TEXT REFERENCES public.bookings(id) ON DELETE SET NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Studio Production Retainer',
  amount NUMERIC(10, 2) NOT NULL,
  deposit_required NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  line_items TEXT, -- JSON string
  square_invoice_id TEXT,
  square_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.invoices(invoice_number);

CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  invoice_id TEXT NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  provider TEXT NOT NULL DEFAULT 'square',
  provider_tx_id TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- ------------------------------------------------------------------------------
-- 10. CONTRACTS & SIGNATURES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contracts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  booking_id TEXT REFERENCES public.bookings(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Production Service Agreement',
  content TEXT NOT NULL,
  file_url TEXT,
  signed BOOLEAN NOT NULL DEFAULT FALSE,
  signed_at TIMESTAMPTZ,
  signer_name TEXT,
  signer_ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON public.contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_signed ON public.contracts(signed);

CREATE TABLE IF NOT EXISTS public.signatures (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  contract_id TEXT NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signatures_contract_id ON public.signatures(contract_id);

-- ------------------------------------------------------------------------------
-- 11. GALLERIES, ASSETS, FAVORITES & RETOUCHING NOTES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.galleries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  booking_id TEXT REFERENCES public.bookings(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  access_code TEXT,
  downloads_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_galleries_client_id ON public.galleries(client_id);

CREATE TABLE IF NOT EXISTS public.gallery_assets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  gallery_id TEXT NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INT,
  file_type TEXT NOT NULL DEFAULT 'image',
  is_downloadable BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gallery_assets_gallery_id ON public.gallery_assets(gallery_id);

CREATE TABLE IF NOT EXISTS public.photo_favorites (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  photo_id TEXT NOT NULL REFERENCES public.gallery_assets(id) ON DELETE CASCADE,
  gallery_id TEXT NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_photo_client_favorite UNIQUE (photo_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_photo_favorites_gallery ON public.photo_favorites(gallery_id);
CREATE INDEX IF NOT EXISTS idx_photo_favorites_client ON public.photo_favorites(client_id);

CREATE TABLE IF NOT EXISTS public.retouching_notes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  photo_id TEXT NOT NULL REFERENCES public.gallery_assets(id) ON DELETE CASCADE,
  gallery_id TEXT NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_photo_client_note UNIQUE (photo_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_retouching_notes_gallery ON public.retouching_notes(gallery_id);

-- ------------------------------------------------------------------------------
-- 12. LIVESTREAMS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.livestreams (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  booking_id TEXT REFERENCES public.bookings(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Live Event Broadcast',
  stream_url TEXT NOT NULL,
  is_live BOOLEAN NOT NULL DEFAULT FALSE,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_livestreams_client_id ON public.livestreams(client_id);

-- ------------------------------------------------------------------------------
-- 13. REAL EMAIL OTP VERIFICATION
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_otps (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_otps_lookup ON public.email_otps(email, code);

-- ------------------------------------------------------------------------------
-- 14. NOTIFICATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- ------------------------------------------------------------------------------
-- 15. PORTFOLIO ITEMS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  client TEXT,
  year TEXT,
  image TEXT NOT NULL,
  camera TEXT,
  lens TEXT,
  lighting TEXT,
  brief TEXT,
  deliverables TEXT,
  stats TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Helper functions for JWT claims check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    coalesce(auth.jwt() ->> 'role', '') IN ('ADMIN', 'DIRECTOR', 'PRODUCER') OR
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') IN ('ADMIN', 'DIRECTOR', 'PRODUCER') OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE email = auth.jwt() ->> 'email'
      AND role IN ('ADMIN', 'DIRECTOR', 'PRODUCER')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_client_id()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT id FROM public.clients
    WHERE email = auth.jwt() ->> 'email'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operating_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_days_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retouching_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livestreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

-- 1. USERS: Admins manage all; Users read their own profile
CREATE POLICY "Admins full access to users" ON public.users FOR ALL USING (public.is_admin());
CREATE POLICY "Users read own profile" ON public.users FOR SELECT USING (auth.uid()::text = id OR email = auth.jwt() ->> 'email');

-- 2. CLIENTS: Admins manage all; Client reads own record
CREATE POLICY "Admins full access to clients" ON public.clients FOR ALL USING (public.is_admin());
CREATE POLICY "Clients read own record" ON public.clients FOR SELECT USING (email = auth.jwt() ->> 'email' OR id = public.current_client_id());

-- 3. INQUIRIES: Anyone can insert inquiry; Admins manage all
CREATE POLICY "Public insert inquiry" ON public.inquiries FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admins full access to inquiries" ON public.inquiries FOR ALL USING (public.is_admin());

-- 4. SERVICES & PACKAGES: Public can read active; Admins manage
CREATE POLICY "Public read active services" ON public.services FOR SELECT USING (active = TRUE OR public.is_admin());
CREATE POLICY "Admins manage services" ON public.services FOR ALL USING (public.is_admin());
CREATE POLICY "Public read active packages" ON public.packages FOR SELECT USING (active = TRUE OR public.is_admin());
CREATE POLICY "Admins manage packages" ON public.packages FOR ALL USING (public.is_admin());

-- 5. OPERATING HOURS & AVAILABILITY: Public can read; Admins manage
CREATE POLICY "Public read operating hours" ON public.operating_hours FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage operating hours" ON public.operating_hours FOR ALL USING (public.is_admin());
CREATE POLICY "Public read closures" ON public.studio_closures FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage closures" ON public.studio_closures FOR ALL USING (public.is_admin());
CREATE POLICY "Public read active instructors" ON public.instructors FOR SELECT USING (active = TRUE OR public.is_admin());
CREATE POLICY "Admins manage instructors" ON public.instructors FOR ALL USING (public.is_admin());
CREATE POLICY "Public read instructor days off" ON public.instructor_days_off FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage instructor days off" ON public.instructor_days_off FOR ALL USING (public.is_admin());

-- 6. BOOKINGS: Admins manage all; Client sees only own bookings
CREATE POLICY "Admins full access to bookings" ON public.bookings FOR ALL USING (public.is_admin());
CREATE POLICY "Clients read own bookings" ON public.bookings FOR SELECT USING (client_id = public.current_client_id());

-- 7. INVOICES & PAYMENTS: Admins manage all; Client sees only own invoices
CREATE POLICY "Admins full access to invoices" ON public.invoices FOR ALL USING (public.is_admin());
CREATE POLICY "Clients read own invoices" ON public.invoices FOR SELECT USING (client_id = public.current_client_id());
CREATE POLICY "Admins full access to payments" ON public.payments FOR ALL USING (public.is_admin());
CREATE POLICY "Clients read own payments" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = payments.invoice_id AND invoices.client_id = public.current_client_id())
);

-- 8. CONTRACTS & SIGNATURES: Admins manage all; Client views and signs own contract
CREATE POLICY "Admins full access to contracts" ON public.contracts FOR ALL USING (public.is_admin());
CREATE POLICY "Clients read own contracts" ON public.contracts FOR SELECT USING (client_id = public.current_client_id());
CREATE POLICY "Clients sign own contracts" ON public.contracts FOR UPDATE USING (client_id = public.current_client_id());
CREATE POLICY "Clients insert signature" ON public.signatures FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.contracts WHERE contracts.id = signatures.contract_id AND contracts.client_id = public.current_client_id())
  OR public.is_admin()
);
CREATE POLICY "Admins full access to signatures" ON public.signatures FOR ALL USING (public.is_admin());

-- 9. GALLERIES & MEDIA: Admins manage; Clients read own published galleries
CREATE POLICY "Admins full access to galleries" ON public.galleries FOR ALL USING (public.is_admin());
CREATE POLICY "Clients read own galleries" ON public.galleries FOR SELECT USING (client_id = public.current_client_id() AND is_published = TRUE);
CREATE POLICY "Admins full access to assets" ON public.gallery_assets FOR ALL USING (public.is_admin());
CREATE POLICY "Clients read own assets" ON public.gallery_assets FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.galleries WHERE galleries.id = gallery_assets.gallery_id AND galleries.client_id = public.current_client_id() AND galleries.is_published = TRUE)
);

-- 10. PHOTO FAVORITES & RETOUCHING NOTES: Clients manage their own; Admins read all
CREATE POLICY "Admins full access to favorites" ON public.photo_favorites FOR ALL USING (public.is_admin());
CREATE POLICY "Clients manage own favorites" ON public.photo_favorites FOR ALL USING (client_id = public.current_client_id());
CREATE POLICY "Admins full access to notes" ON public.retouching_notes FOR ALL USING (public.is_admin());
CREATE POLICY "Clients manage own notes" ON public.retouching_notes FOR ALL USING (client_id = public.current_client_id());

-- 11. LIVESTREAMS: Admins manage; Clients read own assigned stream
CREATE POLICY "Admins full access to livestreams" ON public.livestreams FOR ALL USING (public.is_admin());
CREATE POLICY "Clients read own livestream" ON public.livestreams FOR SELECT USING (client_id = public.current_client_id());

-- 12. EMAIL OTPS: System service-role access only for verification
CREATE POLICY "Admins manage otps" ON public.email_otps FOR ALL USING (public.is_admin());

-- 13. NOTIFICATIONS: Admins read all; Users read own
CREATE POLICY "Admins manage notifications" ON public.notifications FOR ALL USING (public.is_admin());
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid()::text);

-- 14. PORTFOLIO ITEMS: Public read published; Admins manage
CREATE POLICY "Public read published portfolio" ON public.portfolio_items FOR SELECT USING (is_published = TRUE OR public.is_admin());
CREATE POLICY "Admins manage portfolio" ON public.portfolio_items FOR ALL USING (public.is_admin());
