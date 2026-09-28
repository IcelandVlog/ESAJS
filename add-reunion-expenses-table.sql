-- Supabase Dashboard -> SQL Editor -> paste -> Run
-- Run this BEFORE deploying the new code (reunion finance dashboard: tracks money
-- spent per reunion, alongside fees collected). Safe to run more than once.

CREATE TABLE IF NOT EXISTS reunion_expenses (
  id serial PRIMARY KEY,
  reunion_token_id integer NOT NULL REFERENCES reunion_tokens(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  amount integer NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT now()
);
