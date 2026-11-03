-- BRIO v4 — Periodização (Base). Rode no SQL Editor. Pode rodar mais de uma vez.

create table if not exists training_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  name text not null,
  goal text not null default 'hipertrofia' check (goal in ('forca','hipertrofia','powerbuilding','emagrecimento','condicionamento','recomposicao')),
  start_date date not null,
  phases jsonb not null default '[]',   -- [{id,name,kind,weeks,notes,days:{dow:[exercício planejado]}}]
  notes text,
  active boolean not null default false,
  archived boolean not null default false
);
create index if not exists training_programs_user on training_programs (user_id, active);

-- Sessões ligadas ao programa, com o planejado congelado no momento do treino
alter table workouts add column if not exists program_id uuid references training_programs on delete set null;
alter table workouts add column if not exists week_no int;
alter table workouts add column if not exists phase text;
alter table workouts add column if not exists planned jsonb;

-- Esforço por série
alter table workout_sets add column if not exists rpe numeric(3,1) check (rpe is null or rpe between 1 and 10);
alter table workout_sets add column if not exists rir smallint check (rir is null or rir between 0 and 10);

-- Grupo muscular de cada exercício (personalizável)
alter table settings add column if not exists exercise_muscles jsonb not null default '{}';

alter table training_programs enable row level security;
drop policy if exists "dono" on training_programs;
create policy "dono" on training_programs for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
