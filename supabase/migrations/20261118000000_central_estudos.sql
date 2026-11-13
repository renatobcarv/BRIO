-- BRIO v12: Central de Estudos. Rode no SQL Editor. Pode rodar mais de uma vez.
create table if not exists study_tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  title text not null check (char_length(title) between 1 and 120),
  why text, weakness text, deadline date,
  color text not null default '#bf5af2',
  daily_min int not null default 30,
  status text not null default 'ativo' check (status in ('ativo','pausado','concluido')),
  finished_at date
);
create table if not exists study_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  track_id uuid not null references study_tracks on delete cascade,
  module text not null default 'Geral',
  title text not null check (char_length(title) between 1 and 200),
  position int not null default 0,
  est_min int,
  status text not null default 'afazer' check (status in ('afazer','estudando','revisar','dominado')),
  weak boolean not null default false,
  confidence int check (confidence between 1 and 5),
  link text, notes text,
  review_at date, review_step int not null default 0,
  done_at date
);
create table if not exists study_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  date date not null,
  track_id uuid references study_tracks on delete cascade,
  item_id uuid references study_items on delete set null,
  minutes int not null check (minutes between 1 and 600),
  kind text not null default 'estudo' check (kind in ('estudo','revisao','exercicios'))
);
create index if not exists study_items_track on study_items (user_id, track_id, position);
create index if not exists study_logs_date on study_logs (user_id, date);
do $$
declare t text;
begin
  foreach t in array array['study_tracks','study_items','study_logs'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "dono" on %I', t);
    execute format('create policy "dono" on %I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;
