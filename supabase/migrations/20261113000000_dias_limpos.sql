-- BRIO v7 — Dias limpos. Rode no SQL Editor. Pode rodar mais de uma vez.
create table if not exists clean_marks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  date date not null,
  kind text not null check (kind in ('limpo','recaida')),
  unique (user_id, date)
);
alter table clean_marks enable row level security;
drop policy if exists "dono" on clean_marks;
create policy "dono" on clean_marks for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
