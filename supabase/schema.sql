-- ============================================================
-- HelpDash — Full Database Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable PostGIS for geospatial queries (if available)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  avatar_url text,
  role text CHECK (role IN ('client', 'provider', 'both')) NOT NULL DEFAULT 'client',
  barangay text,
  city text DEFAULT 'Quezon City',
  lat float,
  lng float,
  gcash_number text,
  created_at timestamptz DEFAULT now(),
  last_active timestamptz DEFAULT now()
);

-- ============================================================
-- PROVIDERS (extends users)
-- ============================================================
CREATE TABLE IF NOT EXISTS providers (
  id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio text,
  video_intro_url text,
  skills text[] DEFAULT '{}',
  service_radius_km float DEFAULT 2,
  id_photo_url text,
  id_parsed_name text,
  id_parsed_address text,
  id_verified bool DEFAULT false,
  rating_avg float DEFAULT 0,
  total_jobs int DEFAULT 0,
  no_show_count int DEFAULT 0,
  is_available bool DEFAULT true,
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
  subscription_expires_at timestamptz,
  last_seen timestamptz DEFAULT now(),
  hourly_rate int,
  flat_rate int
);

-- ============================================================
-- JOBS
-- ============================================================
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  lat float NOT NULL,
  lng float NOT NULL,
  address_text text NOT NULL,
  barangay text NOT NULL,
  budget_min int,
  budget_max int,
  urgency text CHECK (urgency IN ('asap', 'scheduled')) DEFAULT 'asap',
  scheduled_at timestamptz,
  photos text[] DEFAULT '{}',
  voice_note_url text,
  status text DEFAULT 'open' CHECK (status IN ('open','matched','in_progress','completed','disputed','cancelled')),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours'),
  visible_to_free_at timestamptz
);

-- ============================================================
-- BOOKINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES providers(id) ON DELETE CASCADE,
  client_id uuid REFERENCES users(id) ON DELETE CASCADE,
  agreed_price int,
  status text DEFAULT 'pending' CHECK (status IN ('pending','accepted','en_route','arrived','in_progress','done','no_show','disputed','cancelled')),
  provider_eta_minutes int,
  started_at timestamptz,
  completed_at timestamptz,
  client_confirmed bool DEFAULT false,
  auto_confirm_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  amount int NOT NULL,
  method text CHECK (method IN ('gcash', 'cash')) NOT NULL,
  status text CHECK (status IN ('success', 'failed')) NOT NULL,
  gcash_reference_id text,
  recorded_at timestamptz DEFAULT now()
);

-- ============================================================
-- RATINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  from_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  to_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  score int CHECK (score BETWEEN 1 AND 5) NOT NULL,
  comment text,
  would_rehire bool,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- DISPUTES
-- ============================================================
CREATE TABLE IF NOT EXISTS disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  raised_by_id uuid REFERENCES users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  evidence_photos text[] DEFAULT '{}',
  status text DEFAULT 'open' CHECK (status IN ('open','resolved','closed')),
  resolution_note text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  is_read bool DEFAULT false,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES providers(id) ON DELETE CASCADE,
  plan text DEFAULT 'premium',
  amount_paid int DEFAULT 99,
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  payment_method text CHECK (payment_method IN ('gcash', 'cash')),
  payment_status text CHECK (payment_status IN ('success', 'failed'))
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_job_id ON bookings(job_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_providers_is_available ON providers(is_available);
CREATE INDEX IF NOT EXISTS idx_providers_subscription_tier ON providers(subscription_tier);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users: can read own profile, providers are publicly readable for discovery
CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Providers are publicly readable" ON users FOR SELECT USING (role IN ('provider', 'both'));

-- Providers: own profile management + public read
CREATE POLICY "Providers can manage own profile" ON providers FOR ALL USING (auth.uid() = id);
CREATE POLICY "Providers are publicly readable" ON providers FOR SELECT USING (true);

-- Jobs: clients post, providers read open jobs
CREATE POLICY "Clients can create jobs" ON jobs FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Clients can manage own jobs" ON jobs FOR ALL USING (auth.uid() = client_id);
CREATE POLICY "Open jobs are publicly visible" ON jobs FOR SELECT USING (status = 'open');

-- Bookings: participants can read
CREATE POLICY "Booking participants can read" ON bookings FOR SELECT USING (auth.uid() = client_id OR auth.uid() = provider_id);
CREATE POLICY "Providers can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "Booking participants can update" ON bookings FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = provider_id);

-- Payments: booking participants can read/write
CREATE POLICY "Payment participants can read" ON payments FOR SELECT USING (
  booking_id IN (SELECT id FROM bookings WHERE client_id = auth.uid() OR provider_id = auth.uid())
);
CREATE POLICY "Payment participants can record" ON payments FOR INSERT WITH CHECK (
  booking_id IN (SELECT id FROM bookings WHERE client_id = auth.uid() OR provider_id = auth.uid())
);

-- Ratings: public read, authenticated write
CREATE POLICY "Ratings are publicly readable" ON ratings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can rate" ON ratings FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- Notifications: own only
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- Disputes: participants only
CREATE POLICY "Dispute participants can read" ON disputes FOR SELECT USING (auth.uid() = raised_by_id);
CREATE POLICY "Authenticated users can raise disputes" ON disputes FOR INSERT WITH CHECK (auth.uid() = raised_by_id);

-- Subscriptions: own only
CREATE POLICY "Providers manage own subscriptions" ON subscriptions FOR ALL USING (auth.uid() = provider_id);

-- ============================================================
-- CHAT MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_booking_id ON chat_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat participants can read" ON chat_messages FOR SELECT USING (
  booking_id IN (SELECT id FROM bookings WHERE client_id = auth.uid() OR provider_id = auth.uid())
);

CREATE POLICY "Chat participants can send" ON chat_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  booking_id IN (SELECT id FROM bookings WHERE client_id = auth.uid() OR provider_id = auth.uid())
);

-- ============================================================
-- TRIGGER: auto-update provider rating_avg on new rating
-- ============================================================
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE providers
  SET rating_avg = (
    SELECT AVG(score)::float FROM ratings WHERE to_user_id = NEW.to_user_id
  ),
  total_jobs = (
    SELECT COUNT(*) FROM bookings
    WHERE provider_id = NEW.to_user_id
      AND status = 'done'
      AND client_confirmed = true
  )
  WHERE id = NEW.to_user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_rating
AFTER INSERT ON ratings
FOR EACH ROW EXECUTE FUNCTION update_provider_rating();

-- ============================================================
-- TRIGGER: auto-set provider unavailable on booking accept
-- ============================================================
CREATE OR REPLACE FUNCTION auto_toggle_provider_availability()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    UPDATE providers SET is_available = false WHERE id = NEW.provider_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_booking_accepted
AFTER UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION auto_toggle_provider_availability();
