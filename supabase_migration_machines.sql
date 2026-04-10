-- Run this in your Supabase SQL editor to add the machines feature.

-- 1. Create the machines table
CREATE TABLE IF NOT EXISTS machines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  manufacturer TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  year TEXT NOT NULL DEFAULT '',
  serial_number TEXT NOT NULL DEFAULT '',
  purchase_date TEXT DEFAULT NULL,
  manual_url TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'other',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 2. Enable RLS and allow all operations (adjust to match your existing policy style)
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on machines" ON machines FOR ALL USING (true) WITH CHECK (true);

-- 3. Add machine_id column to maintenance_tasks
ALTER TABLE maintenance_tasks
  ADD COLUMN IF NOT EXISTS machine_id TEXT REFERENCES machines(id) ON DELETE SET NULL;
