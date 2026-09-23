-- Supabase Dashboard -> SQL Editor -> paste -> Run
ALTER TABLE students ADD COLUMN IF NOT EXISTS batch text DEFAULT '';
ALTER TABLE students ADD COLUMN IF NOT EXISTS date_of_birth text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS blood_group text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT true;
ALTER TABLE students ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS reset_code text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS reset_code_expires timestamp;
