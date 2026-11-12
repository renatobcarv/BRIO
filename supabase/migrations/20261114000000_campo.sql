-- BRIO v8 — Registro de campo detalhado e contatos para revisitar. Rode no SQL Editor. Pode rodar mais de uma vez.
alter table pioneer_entries add column if not exists start_time time;
alter table pioneer_entries add column if not exists end_time time;
alter table pioneer_entries add column if not exists return_visits int not null default 0;
alter table pioneer_entries add column if not exists notes text;

create table if not exists field_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  name text not null,
  address text,
  notes text,
  next_visit date,
  last_visit date,
  status text not null default 'revisita' check (status in ('revisita','estudo','encerrado'))
);
create index if not exists field_contacts_user on field_contacts (user_id, status, next_visit);
alter table field_contacts enable row level security;
drop policy if exists "dono" on field_contacts;
create policy "dono" on field_contacts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
