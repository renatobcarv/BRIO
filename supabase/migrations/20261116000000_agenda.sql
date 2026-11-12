-- BRIO v10: Agenda + assinatura de calendário (.ics). Rode no SQL Editor. Pode rodar mais de uma vez.
create table if not exists calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null check (char_length(title) between 1 and 120),
  date date not null,
  start_time time,
  end_time time,
  category text not null default 'pessoal',
  location text,
  notes text,
  remind_min int
);
create index if not exists calendar_events_user_date on calendar_events (user_id, date);
alter table calendar_events enable row level security;
drop policy if exists "dono" on calendar_events;
create policy "dono" on calendar_events for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Token secreto do link de assinatura
alter table settings add column if not exists calendar_token text;

-- Feed do calendário: devolve só os eventos do dono do token (sem expor nada além disso).
create or replace function calendar_feed(p_token text)
returns table (id uuid, title text, date date, start_time time, end_time time, category text, location text, notes text, remind_min int, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select e.id, e.title, e.date, e.start_time, e.end_time, e.category, e.location, e.notes, e.remind_min, e.updated_at
  from calendar_events e
  join settings s on s.user_id = e.user_id
  where p_token is not null and length(p_token) >= 32 and s.calendar_token = p_token
    and e.date >= current_date - 90
  order by e.date, e.start_time nulls first
  limit 2000;
$$;
revoke all on function calendar_feed(text) from public;
grant execute on function calendar_feed(text) to anon, authenticated;
