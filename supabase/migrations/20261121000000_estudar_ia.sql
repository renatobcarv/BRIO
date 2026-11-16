-- BRIO v13: Estudar com IA, Base de Conhecimento, Build Lab e evidências de domínio.
-- Reaproveita study_tracks / study_items (trilhas e etapas). Pode rodar mais de uma vez.

create table if not exists ai_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null check (char_length(title) between 1 and 160),
  subject text, goal text, level text, outcome text,
  mode text not null default 'ensinar' check (mode in ('ensinar','investigar','socratico','praticar','construir','avaliar','revisar')),
  provider text not null default 'claude' check (provider in ('claude','gemini')),
  track_id uuid references study_tracks on delete set null,
  item_id uuid references study_items on delete set null,
  project_id uuid,
  summary text,
  stage text,
  status text not null default 'ativa' check (status in ('ativa','encerrada'))
);

create table if not exists ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  session_id uuid not null references ai_sessions on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null check (char_length(content) <= 60000),
  mode text, provider text, model text,
  tokens_in int, tokens_out int
);

create table if not exists study_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  title text not null check (char_length(title) between 1 and 160),
  goal text, skills text,
  steps jsonb not null default '[]'::jsonb,
  deliverables text, difficulties text, result text, learnings text,
  track_id uuid references study_tracks on delete set null,
  status text not null default 'planejando' check (status in ('planejando','construindo','concluido','pausado')),
  finished_at date
);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'ai_sessions_project_fk') then
    alter table ai_sessions add constraint ai_sessions_project_fk foreign key (project_id) references study_projects on delete set null;
  end if;
end $$;

create table if not exists study_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  kind text not null default 'conceito' check (kind in ('conceito','definicao','exemplo','insight','resumo','referencia','pergunta','erro')),
  title text not null check (char_length(title) between 1 and 200),
  body text not null default '' check (char_length(body) <= 20000),
  track_id uuid references study_tracks on delete set null,
  session_id uuid references ai_sessions on delete set null,
  project_id uuid references study_projects on delete set null,
  in_review boolean not null default true,
  review_at date, interval_days int not null default 0, ease numeric not null default 2.5,
  hits int not null default 0, misses int not null default 0, last_reviewed date,
  mastery text not null default 'contato' check (mastery in ('nao_estudado','contato','compreensao','pratica','dominado','revisar'))
);

-- Evidências de aprendizagem: a base do domínio e do XP de estudo (nada de "tempo com a página aberta").
create table if not exists study_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  date date not null,
  kind text not null check (kind in ('avaliacao','explicacao','desafio','revisao','projeto')),
  topic text not null check (char_length(topic) between 1 and 200),
  level int not null check (level between 0 and 5),
  score int check (score between 0 and 100),
  justification text,
  session_id uuid references ai_sessions on delete set null,
  note_id uuid references study_notes on delete set null,
  project_id uuid references study_projects on delete set null,
  track_id uuid references study_tracks on delete set null
);

create index if not exists ai_sessions_user on ai_sessions (user_id, updated_at desc);
create index if not exists ai_messages_session on ai_messages (session_id, created_at);
create index if not exists study_notes_review on study_notes (user_id, in_review, review_at);
create index if not exists study_evidence_date on study_evidence (user_id, date);

do $$
declare t text;
begin
  foreach t in array array['ai_sessions','ai_messages','study_projects','study_notes','study_evidence'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "dono" on %I', t);
    execute format('create policy "dono" on %I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;
