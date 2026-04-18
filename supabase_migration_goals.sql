-- Goals table migration
-- Run this in the Supabase SQL editor.

create table if not exists goals (
  id                   text        primary key,
  name                 text        not null,
  type                 text        not null default 'savings'
                                   check (type in ('savings','payoff','retirement','emergency','custom')),
  target_amount        numeric(12,2) not null default 0,
  current_amount       numeric(12,2) not null default 0,
  monthly_contribution numeric(12,2) not null default 0,
  target_date          date,
  notes                text        not null default '',
  sort_order           integer     not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table goals enable row level security;

drop policy if exists "Allow all on goals" on goals;
create policy "Allow all on goals"
  on goals for all
  using (true)
  with check (true);
