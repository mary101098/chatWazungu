/*
# Chat Wazungu Registration Portal Schema

## Overview
Creates the full schema for the Chat Wazungu registration portal — a recruitment/registration
app for Kenyan applicants who pay a refundable KSh 150 fee via M-Pesa STK Push and then wait
for admin review. Auth is handled by Supabase Auth (auth.users), so we do NOT create a custom
users auth table; instead `profiles` extends auth.users with applicant metadata.

## Tables
1. `admins` — admin role flag table linked to auth.users (created first, referenced by others).
2. `profiles` — applicant profile info (full_name, phone, status) linked 1:1 to auth.users.
3. `personal_info` — detailed personal data (DOB, gender, county, languages, occupation, etc.).
4. `withdrawal_accounts` — M-Pesa or bank withdrawal details.
5. `payments` — M-Pesa STK Push payment records with Daraja callback fields.
6. `application_status` — admin review decisions (approved/rejected/pending) + notes.
7. `email_logs` — record of notification emails sent.
8. `activity_logs` — audit trail of user actions.

## Security
- RLS enabled on every table.
- Applicants can CRUD only their own rows (auth.uid() = user_id).
- Admins can read all applicant data and update application_status.
- Payment status is only set to 'success' server-side via the Daraja callback edge function
  (service role key), never trusted from the client.
*/

-- ============ admins (created first; referenced by other policies) ============
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_admin" ON admins;
CREATE POLICY "select_own_admin" ON admins FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- ============ profiles ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  status text NOT NULL DEFAULT 'incomplete',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "admin_select_all_profiles" ON profiles;
CREATE POLICY "admin_select_all_profiles" ON profiles FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

-- ============ personal_info ============
CREATE TABLE IF NOT EXISTS personal_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date_of_birth date,
  gender text,
  county text,
  sub_county text,
  languages text[],
  occupation text,
  education text,
  bio text,
  profile_photo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE personal_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_personal_info" ON personal_info;
CREATE POLICY "select_own_personal_info" ON personal_info FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_personal_info" ON personal_info;
CREATE POLICY "insert_own_personal_info" ON personal_info FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_personal_info" ON personal_info;
CREATE POLICY "update_own_personal_info" ON personal_info FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_select_all_personal_info" ON personal_info;
CREATE POLICY "admin_select_all_personal_info" ON personal_info FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

-- ============ withdrawal_accounts ============
CREATE TABLE IF NOT EXISTS withdrawal_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method text NOT NULL,
  mpesa_number text,
  bank_name text,
  account_number text,
  branch text,
  account_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE withdrawal_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_withdrawal" ON withdrawal_accounts;
CREATE POLICY "select_own_withdrawal" ON withdrawal_accounts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_withdrawal" ON withdrawal_accounts;
CREATE POLICY "insert_own_withdrawal" ON withdrawal_accounts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_withdrawal" ON withdrawal_accounts;
CREATE POLICY "update_own_withdrawal" ON withdrawal_accounts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_select_all_withdrawal" ON withdrawal_accounts;
CREATE POLICY "admin_select_all_withdrawal" ON withdrawal_accounts FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

-- ============ payments ============
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text NOT NULL,
  amount numeric(10,2) NOT NULL DEFAULT 150.00,
  currency text NOT NULL DEFAULT 'KES',
  merchant_request_id text,
  checkout_request_id text,
  mpesa_receipt text,
  transaction_date timestamptz,
  status text NOT NULL DEFAULT 'pending',
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_payments" ON payments;
CREATE POLICY "select_own_payments" ON payments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_payments" ON payments;
CREATE POLICY "insert_own_payments" ON payments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_payments" ON payments;
CREATE POLICY "update_own_payments" ON payments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_select_all_payments" ON payments;
CREATE POLICY "admin_select_all_payments" ON payments FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "admin_update_all_payments" ON payments;
CREATE POLICY "admin_update_all_payments" ON payments FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

-- ============ application_status ============
CREATE TABLE IF NOT EXISTS application_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  review_notes text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE application_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_application" ON application_status;
CREATE POLICY "select_own_application" ON application_status FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_application" ON application_status;
CREATE POLICY "insert_own_application" ON application_status FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_all_application" ON application_status;
CREATE POLICY "admin_all_application" ON application_status FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "admin_update_application" ON application_status;
CREATE POLICY "admin_update_application" ON application_status FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

-- ============ email_logs ============
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type text NOT NULL,
  status text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_email_logs" ON email_logs;
CREATE POLICY "select_own_email_logs" ON email_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_select_all_email_logs" ON email_logs;
CREATE POLICY "admin_select_all_email_logs" ON email_logs FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

-- ============ activity_logs ============
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_activity" ON activity_logs;
CREATE POLICY "select_own_activity" ON activity_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_activity" ON activity_logs;
CREATE POLICY "insert_own_activity" ON activity_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_select_all_activity" ON activity_logs;
CREATE POLICY "admin_select_all_activity" ON activity_logs FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

-- ============ Indexes ============
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_application_status_user_id ON application_status(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_personal_info_user_id ON personal_info(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_accounts_user_id ON withdrawal_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);

-- ============ updated_at triggers ============
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_personal_info_updated_at ON personal_info;
CREATE TRIGGER trg_personal_info_updated_at BEFORE UPDATE ON personal_info
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_withdrawal_accounts_updated_at ON withdrawal_accounts;
CREATE TRIGGER trg_withdrawal_accounts_updated_at BEFORE UPDATE ON withdrawal_accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_application_status_updated_at ON application_status;
CREATE TRIGGER trg_application_status_updated_at BEFORE UPDATE ON application_status
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();