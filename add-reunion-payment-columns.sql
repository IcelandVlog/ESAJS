-- Supabase Dashboard -> SQL Editor -> paste -> Run
-- Run this BEFORE deploying the new code (reunion payment feature: fee amount +
-- online/offline payment tracking on registrations). Safe to run more than once.

ALTER TABLE reunion_tokens ADD COLUMN IF NOT EXISTS fee_amount integer NOT NULL DEFAULT 0;

ALTER TABLE reunion_registrations ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid';
ALTER TABLE reunion_registrations ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT '';
ALTER TABLE reunion_registrations ADD COLUMN IF NOT EXISTS transaction_id text NOT NULL DEFAULT '';
ALTER TABLE reunion_registrations ADD COLUMN IF NOT EXISTS sender_number text NOT NULL DEFAULT '';
ALTER TABLE reunion_registrations ADD COLUMN IF NOT EXISTS amount_paid integer NOT NULL DEFAULT 0;
ALTER TABLE reunion_registrations ADD COLUMN IF NOT EXISTS val_id text NOT NULL DEFAULT '';
ALTER TABLE reunion_registrations ADD COLUMN IF NOT EXISTS paid_at timestamp;
