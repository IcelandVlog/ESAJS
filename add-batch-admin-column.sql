-- Supabase Dashboard -> SQL Editor -> paste -> Run
-- Run this BEFORE deploying the new code (the new code reads this column on every admin login).
-- Safe to run more than once. Existing admin(s) keep batch = NULL and stay the main admin.
ALTER TABLE admins ADD COLUMN IF NOT EXISTS batch text;
