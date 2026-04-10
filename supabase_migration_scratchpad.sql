-- Scratchpad notes table migration
-- Run this in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/nexhipiqbdcoynjmpdfs/editor

create table if not exists scratchpad_notes (
  id         text        primary key,
  title      text        not null default '',
  content    text        not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security (open policy — same pattern as other tables in this project)
alter table scratchpad_notes enable row level security;

drop policy if exists "Allow all on scratchpad_notes" on scratchpad_notes;
create policy "Allow all on scratchpad_notes"
  on scratchpad_notes for all
  using (true)
  with check (true);
