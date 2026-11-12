-- BRIO v11: Google Agenda em 2 vias. Rode no SQL Editor. Pode rodar mais de uma vez.
create table if not exists google_calendar (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  refresh_token text not null,
  email text,
  calendar_id text not null default 'primary',
  connected_at timestamptz not null default now()
);
alter table google_calendar enable row level security;
drop policy if exists "dono" on google_calendar;
create policy "dono" on google_calendar for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table calendar_events add column if not exists google_id text;
