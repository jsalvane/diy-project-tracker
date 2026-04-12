-- HSA Expenses table migration
-- Run this in the Supabase SQL editor for your project:
-- https://supabase.com/dashboard/project/nexhipiqbdcoynjmpdfs/editor

create table if not exists hsa_expenses (
  id              text        primary key,
  person          text        not null check (person in ('Joe','Krysten','Jack','Daughter')),
  provider        text        not null,
  date            date        not null,
  category        text        not null default 'medical'
                              check (category in ('medical','dental','vision','prescription','mental-health','other')),
  description     text        not null default '',
  amount          numeric(10,2) not null default 0,
  reimbursed      boolean     not null default false,
  receipt_url     text,
  sort_order      integer     not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Enable Row Level Security (open policy — same pattern as other tables in this project)
alter table hsa_expenses enable row level security;

drop policy if exists "Allow all on hsa_expenses" on hsa_expenses;
create policy "Allow all on hsa_expenses"
  on hsa_expenses for all
  using (true)
  with check (true);
