-- BRIO v14: Quadro de sonhos. Rode no SQL Editor. Pode rodar mais de uma vez.
create table if not exists dreams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  title text not null check (char_length(title) between 1 and 120),
  why text,
  category text not null default 'experiencia',
  target_date date,
  image_path text,
  position int not null default 0,
  done_at date
);
create index if not exists dreams_user on dreams (user_id, position);
alter table dreams enable row level security;
drop policy if exists "dono" on dreams;
create policy "dono" on dreams for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
