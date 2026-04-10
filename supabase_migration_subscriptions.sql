-- Subscriptions table migration
-- Run this in the Supabase SQL editor for your project:
-- https://supabase.com/dashboard/project/nexhipiqbdcoynjmpdfs/editor

create table if not exists subscriptions (
  id              text        primary key,
  name            text        not null,
  amount          numeric(10,2) not null default 0,
  frequency       text        not null default 'monthly'  check (frequency in ('monthly','annual')),
  renewal_day     integer     not null default 1,         -- 1-30 (monthly day) or 1-12 (annual month)
  free_trial      boolean     not null default false,
  trial_expiration date,
  category        text        not null default 'other'
                              check (category in ('streaming','software','fitness','news','gaming','utilities','food','shopping','finance','other')),
  status          text        not null default 'active'   check (status in ('active','paused','cancelled')),
  sort_order      integer     not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Enable Row Level Security (open policy — same pattern as other tables in this project)
alter table subscriptions enable row level security;

drop policy if exists "Allow all on subscriptions" on subscriptions;
create policy "Allow all on subscriptions"
  on subscriptions for all
  using (true)
  with check (true);
