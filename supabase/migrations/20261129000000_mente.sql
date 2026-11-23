-- Mente: sessões de teste/treino cognitivo (índice estimado, não QI clínico).
create table if not exists mind_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  date date not null default current_date,
  kind text not null check (kind in ('teste','treino')),
  score int check (score between 50 and 160),
  domains jsonb not null default '{}'::jsonb,
  total int not null default 0, correct int not null default 0
);
alter table mind_sessions enable row level security;
drop policy if exists "dono" on mind_sessions;
create policy "dono" on mind_sessions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
