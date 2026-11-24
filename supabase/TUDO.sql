-- BRIO · todas as migrações em ordem. Seguro rodar mais de uma vez (só cria o que falta).
-- Supabase → SQL Editor → New query → cole tudo → Run.

-- ════════ 20261103000000_init.sql ════════
-- BRIO — schema completo. Rode inteiro no SQL Editor do Supabase.
-- Toda tabela: id, user_id (default auth.uid()), created_at, RLS com user_id = auth.uid().
-- Horas sempre em minutos (inteiros).

create extension if not exists pgcrypto;

-- ── Configurações (uma linha por usuário) ─────────────────────────
create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade unique,
  created_at timestamptz not null default now(),
  pioneer_goal_minutes int not null default 3000,
  water_goal_ml int not null default 3000,
  kcal_goal int not null default 2480,
  protein_goal_g int not null default 203,
  weight_start_kg numeric(5,2) not null default 86,
  weight_goal_kg numeric(5,2) not null default 80,
  weight_rate_kg_week numeric(4,2) not null default 0.5,
  checklist jsonb not null default '[]',
  workout_split jsonb not null default '[]',
  partner_phrase text,
  partner_photo_path text,
  daily_text text,
  daily_text_date date
);

create table if not exists daily_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  date date not null, item_key text not null, done boolean not null default true,
  unique (user_id, date, item_key)
);

create table if not exists streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade unique,
  created_at timestamptz not null default now(),
  count int not null default 0, best int not null default 0, last_date date,
  excused_dates date[] not null default '{}'
);

-- ── Espiritual ───────────────────────────────────────────────────
create table if not exists study_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  date date not null,
  type text not null check (type in ('biblia','publicacao','meio_semana','sentinela','pesquisa','outro')),
  material text, minutes int not null default 0 check (minutes >= 0), takeaway text
);

create table if not exists bible_reading (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  book smallint not null check (book between 1 and 66),
  chapter smallint not null check (chapter > 0),
  date_read date not null,
  unique (user_id, book, chapter)
);

create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  date date not null,
  kind text not null check (kind in ('oracao','gratidao','reflexao')),
  text text not null
);

-- ── Pioneiro ─────────────────────────────────────────────────────
create table if not exists pioneer_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  date date not null,
  category text not null check (category in ('campo','publico','assembleia','obra')),
  minutes int not null check (minutes > 0)
);

create table if not exists pioneer_month_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  month date not null, goal_minutes int not null check (goal_minutes >= 0),
  unique (user_id, month)
);

create table if not exists pioneer_week_plan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade unique,
  created_at timestamptz not null default now(),
  minutes_by_day int[] not null default '{0,0,0,0,0,0,0}' check (array_length(minutes_by_day,1) = 7)
);

-- ── Corpo ────────────────────────────────────────────────────────
create table if not exists weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  date date not null, kg numeric(5,2) not null check (kg > 0),
  unique (user_id, date)
);

create table if not exists water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  date date not null, ml int not null
);

create table if not exists meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  date date not null,
  slot text not null check (slot in ('cafe','almoco','lanche','jantar')),
  kcal int, protein_g int, done boolean not null default false,
  unique (user_id, date, slot)
);

create table if not exists workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  date date not null, split_label text, notes text
);

create table if not exists workout_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  workout_id uuid not null references workouts on delete cascade,
  exercise text not null, set_no smallint not null, reps smallint not null, kg numeric(6,2) not null default 0
);

create table if not exists sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  date date not null, hours numeric(4,2) not null check (hours between 0 and 24),
  unique (user_id, date)
);

-- ── Finanças ─────────────────────────────────────────────────────
create table if not exists finance_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  month date not null,
  kind text not null check (kind in ('receita','fixo','variavel')),
  name text not null, amount numeric(12,2) not null default 0
);

create table if not exists investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  name text not null, amount numeric(14,2) not null default 0, rate_aa numeric(6,3) not null default 0
);

create table if not exists savings_boxes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  name text not null, target numeric(14,2) not null, monthly numeric(12,2) not null default 0,
  saved numeric(14,2) not null default 0, color text default '#d9c49a'
);

create table if not exists net_worth_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  month date not null,
  kind text not null check (kind in ('ativo','passivo')),
  name text not null, amount numeric(14,2) not null default 0
);

-- ── Metas e objetivos ────────────────────────────────────────────
create table if not exists objectives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  title text not null,
  area text not null check (area in ('espiritual','financeira','fisica','carreira','pessoal')),
  description text
);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  objective_id uuid references objectives on delete set null,
  title text not null,
  area text not null check (area in ('espiritual','financeira','fisica','carreira','pessoal')),
  unit text not null default '',
  target numeric(14,2) not null, current numeric(14,2) not null default 0,
  start_value numeric(14,2) not null default 0,
  deadline date,
  featured boolean not null default false,
  auto_source text check (auto_source in ('pioneer_month','weight','savings_box','bible_chapters')),
  auto_ref uuid
);

-- ── Índices ──────────────────────────────────────────────────────
create index if not exists daily_checks_user_date on daily_checks (user_id, date);
create index if not exists study_user_date on study_entries (user_id, date);
create index if not exists journal_user_date on journal_entries (user_id, date);
create index if not exists pioneer_user_date on pioneer_entries (user_id, date);
create index if not exists water_user_date on water_logs (user_id, date);
create index if not exists meals_user_date on meals (user_id, date);
create index if not exists workouts_user_date on workouts (user_id, date);
create index if not exists workout_sets_workout on workout_sets (workout_id);
create index if not exists finance_user_month on finance_items (user_id, month);
create index if not exists networth_user_month on net_worth_items (user_id, month);
create index if not exists goals_user on goals (user_id);

-- ── RLS em TODAS as tabelas ──────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'settings','daily_checks','streaks','study_entries','bible_reading','journal_entries',
    'pioneer_entries','pioneer_month_goals','pioneer_week_plan','weight_logs','water_logs','meals',
    'workouts','workout_sets','sleep_logs','finance_items','investments','savings_boxes',
    'net_worth_items','objectives','goals'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "dono" on %I', t);
    execute format('create policy "dono" on %I for all to authenticated
                    using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

-- ── Storage: bucket privado ──────────────────────────────────────
insert into storage.buckets (id, name, public) values ('privado', 'privado', false)
on conflict (id) do update set public = false;

drop policy if exists "privado dono" on storage.objects;
create policy "privado dono" on storage.objects for all to authenticated
  using (bucket_id = 'privado' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'privado' and (storage.foldername(name))[1] = auth.uid()::text);

-- ════════ 20261104000000_v2.sql ════════
-- BRIO v2 — alimentação completa, plano de treino, finanças com categorias.
-- Rode no SQL Editor DEPOIS do schema inicial. Pode rodar mais de uma vez.

-- Configurações novas
alter table settings add column if not exists meal_slots jsonb not null default
  '[{"key":"cafe","label":"Café da manhã"},{"key":"almoco","label":"Almoço"},{"key":"lanche","label":"Lanche"},{"key":"jantar","label":"Jantar"}]';
alter table settings add column if not exists carbs_goal_g int not null default 250;
alter table settings add column if not exists fat_goal_g int not null default 70;
alter table settings add column if not exists workout_plan jsonb not null default '{}';
alter table settings add column if not exists finance_categories jsonb not null default '[]';
update settings set partner_phrase = 'Tijolo por tijolinho'
  where partner_phrase is null or partner_phrase = 'Escreva aqui a frase dela.';

-- Refeições com nomes livres
alter table meals drop constraint if exists meals_slot_check;

-- Alimentos favoritos
create table if not exists foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  name text not null, portion text,
  kcal int not null default 0, protein_g numeric(6,1) not null default 0,
  carbs_g numeric(6,1) not null default 0, fat_g numeric(6,1) not null default 0
);

-- Itens de cada refeição
create table if not exists meal_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  date date not null, slot text not null, name text not null,
  kcal int not null default 0, protein_g numeric(6,1) not null default 0,
  carbs_g numeric(6,1) not null default 0, fat_g numeric(6,1) not null default 0
);
create index if not exists meal_items_user_date on meal_items (user_id, date);

-- Treino: duração da sessão
alter table workouts add column if not exists duration_min int;

-- Finanças: lançamentos completos
alter table finance_items add column if not exists category text;
alter table finance_items add column if not exists date date;
alter table finance_items add column if not exists paid boolean not null default true;
alter table finance_items add column if not exists recurring boolean not null default false;
alter table finance_items add column if not exists note text;
update finance_items set date = month where date is null;
update finance_items set recurring = true where kind = 'fixo' and recurring = false and category is null;

-- RLS nas tabelas novas
do $$
declare t text;
begin
  foreach t in array array['foods','meal_items'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "dono" on %I', t);
    execute format('create policy "dono" on %I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

-- ════════ 20261105000000_livros.sql ════════
-- BRIO v3 — Livros. Rode no SQL Editor. Pode rodar mais de uma vez.

alter table settings add column if not exists books_goal_year int not null default 24;

create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  title text not null,
  authors text,
  cover_url text,
  isbn text,
  publisher text,
  year int,
  pages int check (pages is null or pages >= 0),
  description text,
  categories text[] not null default '{}',
  tags text[] not null default '{}',
  status text not null default 'quero_ler' check (status in ('quero_ler','lendo','lido','abandonado')),
  rating smallint check (rating is null or rating between 1 and 5),
  favorite boolean not null default false,
  format text not null default 'fisico' check (format in ('fisico','ebook','audio')),
  current_page int not null default 0 check (current_page >= 0),
  started_at date,
  finished_at date,
  summary text,
  lessons text,
  application text,
  source_id text
);

create table if not exists book_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  book_id uuid not null references books on delete cascade,
  kind text not null default 'anotacao' check (kind in ('citacao','anotacao','reflexao')),
  page int,
  text text not null
);

create table if not exists reading_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  book_id uuid not null references books on delete cascade,
  date date not null,
  from_page int not null default 0,
  to_page int not null default 0,
  minutes int
);

create index if not exists books_user_status on books (user_id, status);
create index if not exists book_notes_book on book_notes (book_id);
create index if not exists reading_sessions_user_date on reading_sessions (user_id, date);
create index if not exists reading_sessions_book on reading_sessions (book_id);

do $$
declare t text;
begin
  foreach t in array array['books','book_notes','reading_sessions'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "dono" on %I', t);
    execute format('create policy "dono" on %I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

-- Meta automática: livros lidos no ano
alter table goals drop constraint if exists goals_auto_source_check;
alter table goals add constraint goals_auto_source_check check (auto_source in ('pioneer_month','weight','savings_box','bible_chapters','books_year'));

-- ════════ 20261106000000_periodizacao.sql ════════
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

-- ════════ 20261107000000_investimentos.sql ════════
-- BRIO v5 — Investimentos completos. Rode no SQL Editor. Pode rodar mais de uma vez.

alter table investments add column if not exists type text not null default 'renda_fixa';
alter table investments add column if not exists institution text;
alter table investments add column if not exists invested numeric(14,2);
alter table investments add column if not exists monthly numeric(12,2) not null default 0;
alter table investments add column if not exists liquidity text not null default 'diaria';
alter table investments add column if not exists maturity date;
alter table investments add column if not exists notes text;
alter table investments add column if not exists is_reserve boolean not null default false;
update investments set invested = amount where invested is null;

create table if not exists investment_moves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  investment_id uuid not null references investments on delete cascade,
  date date not null,
  kind text not null check (kind in ('aporte','resgate','atualizacao')),
  amount numeric(14,2) not null,
  balance_after numeric(14,2) not null
);
create index if not exists investment_moves_user_date on investment_moves (user_id, date);

alter table investment_moves enable row level security;
drop policy if exists "dono" on investment_moves;
create policy "dono" on investment_moves for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ════════ 20261112000000_assistente.sql ════════
-- BRIO v6 — Assistente financeiro. Rode no SQL Editor. Pode rodar mais de uma vez.

create table if not exists finance_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  role text not null check (role in ('user','assistant')),
  content text not null
);
create index if not exists finance_chat_messages_user on finance_chat_messages (user_id, created_at);

-- Alterações propostas pelo assistente: só são aplicadas quando você toca em "Confirmar".
create table if not exists finance_chat_proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('budget','goal','recategorize')),
  payload jsonb not null,
  summary text not null,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled'))
);

do $$
declare t text;
begin
  foreach t in array array['finance_chat_messages','finance_chat_proposals'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "dono" on %I', t);
    execute format('create policy "dono" on %I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

-- ════════ 20261113000000_dias_limpos.sql ════════
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

-- ════════ 20261114000000_campo.sql ════════
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

-- ════════ 20261115000000_viagem.sql ════════
-- Modo viagem: períodos em que os eventos ficam pausados (sem prêmio e sem cicatriz).
alter table settings add column if not exists travel jsonb not null default '[]';

-- ════════ 20261116000000_agenda.sql ════════
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

-- ════════ 20261117000000_google_agenda.sql ════════
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

-- ════════ 20261118000000_central_estudos.sql ════════
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

-- ════════ 20261119000000_parcelas.sql ════════
-- BRIO v13: compras parceladas. Rode no SQL Editor. Pode rodar mais de uma vez.
alter table finance_items add column if not exists inst_group uuid;
alter table finance_items add column if not exists inst_no int;
alter table finance_items add column if not exists inst_total int;
alter table finance_items add column if not exists inst_amount numeric(12,2);
create index if not exists finance_items_inst on finance_items (user_id, inst_group);

-- ════════ 20261120000000_sonhos.sql ════════
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

-- ════════ 20261121000000_estudar_ia.sql ════════
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

-- ════════ 20261122000000_certificados.sql ════════
-- BRIO v14: certificados externos indexados (cursos, faculdade, eventos). Arquivo no bucket privado. Pode rodar mais de uma vez.
create table if not exists study_certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  title text not null check (char_length(title) between 1 and 200),
  issuer text, issued_at date, expires_at date, hours numeric,
  credential_id text, url text, skills text, notes text,
  file_path text,
  kind text not null default 'curso' check (kind in ('curso','graduacao','pos','idioma','evento','certificacao','outro')),
  track_id uuid references study_tracks on delete set null
);
create index if not exists study_certificates_user on study_certificates (user_id, issued_at desc);
alter table study_certificates enable row level security;
drop policy if exists "dono" on study_certificates;
create policy "dono" on study_certificates for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ════════ 20261123000000_paginas_espirituais.sql ════════
-- BRIO v15: páginas espirituais estilo caderno (capa, imagens, texto formatado), ligadas opcionalmente a um capítulo da Bíblia.
create table if not exists spirit_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null default 'Sem título' check (char_length(title) between 1 and 200),
  kind text not null default 'estudo' check (kind in ('estudo','historia','capitulo','diario','pregacao')),
  cover_path text,
  content text not null default '' check (char_length(content) <= 100000),
  bible_book int check (bible_book between 1 and 66),
  bible_chapter int check (bible_chapter between 1 and 150),
  pinned boolean not null default false
);
create index if not exists spirit_pages_user on spirit_pages (user_id, updated_at desc);
create index if not exists spirit_pages_bible on spirit_pages (user_id, bible_book, bible_chapter);
alter table spirit_pages enable row level security;
drop policy if exists "dono" on spirit_pages;
create policy "dono" on spirit_pages for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ════════ 20261124000000_plano_dieta.sql ════════
-- BRIO v16: plano alimentar (um por usuário) com refeições, suplementos, remédios e água; marcações diárias de suplemento/remédio.
create table if not exists diet_plans (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  updated_at timestamptz not null default now(),
  goal text not null default 'manter' check (goal in ('perder','manter','ganhar','recomp')),
  profile jsonb not null default '{}'::jsonb,      -- sexo, idade, altura, peso, atividade, restrições, preferências
  kcal int not null, protein_g int not null, carbs_g int not null, fat_g int not null,
  water_ml int not null default 2500,
  meals jsonb not null default '[]'::jsonb,        -- [{ key, label, time, items: [{ name, qty, kcal, p, c, g }] }]
  supplements jsonb not null default '[]'::jsonb,  -- [{ name, dose, time }]
  meds jsonb not null default '[]'::jsonb,         -- [{ name, dose, time, notes }]
  follow_phase boolean not null default true,       -- ajusta calorias pela fase da campanha de treino
  notes text
);
create table if not exists diet_intakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  date date not null,
  kind text not null check (kind in ('suplemento','remedio')),
  name text not null check (char_length(name) between 1 and 120),
  unique (user_id, date, kind, name)
);
alter table diet_plans enable row level security;
alter table diet_intakes enable row level security;
drop policy if exists "dono" on diet_plans;
create policy "dono" on diet_plans for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "dono" on diet_intakes;
create policy "dono" on diet_intakes for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ════════ 20261125000000_mascote.sql ════════
-- BRIO v17: mascote que cresce com as suas ações. Um por usuário. Pode rodar mais de uma vez.
create table if not exists pets (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 30),
  species text not null default 'pantera' check (species in ('pantera','onca','lobo','aguia')),
  adopted_on date not null default current_date
);
alter table pets enable row level security;
drop policy if exists "dono" on pets;
create policy "dono" on pets for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Coleção por sorteio: 14 espécies com raridades, 5 sorteios por mês; repetidos viram essência bônus.
alter table pets drop constraint if exists pets_species_check;
alter table public.pets add constraint pets_species_check check (species in (
    'lobo', 'coruja', 'urso', 'aguia', 'tubarao', 'serpente', 'leao',
    'pantera', 'fenix', 'dragao', 'onca', 'kitsune', 'qilin', 'grifo', 'genbu'
  ));
alter table pets add column if not exists bonus_essence int not null default 0;
create table if not exists pet_draws (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  month text not null,
  species text not null,
  duplicate boolean not null default false,
  free boolean not null default false
);
create index if not exists pet_draws_user on pet_draws (user_id, month);
alter table pet_draws enable row level security;
drop policy if exists "dono" on pet_draws;
create policy "dono" on pet_draws for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
-- Itens do mascote: o que está equipado em cada espaço ({"forca": {"id": "manopla", "at": "2026-11-23"}}).
alter table pets add column if not exists equipped jsonb not null default '{}'::jsonb;
alter table pets add column if not exists bought jsonb not null default '[]'::jsonb;
alter table pets add column if not exists levels jsonb not null default '{}'::jsonb;
alter table pets add column if not exists spent int not null default 0 check (spent >= 0);
-- Fera domada ativa (acompanha você e dá bônus no atributo dela).
alter table pets add column if not exists active_beast text;
-- Minigame de domar: resultado de cada oportunidade (uma tentativa só).
alter table pets add column if not exists tame_tries jsonb not null default '{}'::jsonb;
-- Ajustes da semana feitos pelo usuário sobre a proposta do Mestre: {"5": {"days": {"1": [...]}, "note": "Semana corrida"}}.
alter table training_programs add column if not exists week_overrides jsonb not null default '{}'::jsonb;
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
-- Contas: cada pessoa configura o seu BRIO.
-- partner_name: nome da "pessoa especial" (card na Home e nos Sonhos). Vazio = card escondido.
-- prefs: preferências livres (módulos ligados/desligados e ajustes futuros), sem precisar de nova migração.
alter table settings add column if not exists partner_name text check (partner_name is null or char_length(partner_name) <= 60);
alter table settings add column if not exists prefs jsonb not null default '{}'::jsonb;
-- Objetivo híbrido (corrida + hipertrofia) nas campanhas.
alter table training_programs drop constraint if exists training_programs_goal_check;
alter table training_programs add constraint training_programs_goal_check check (goal in ('forca','hipertrofia','powerbuilding','emagrecimento','condicionamento','recomposicao','hibrido'));
-- Missões do dia: tarefas da agenda podem ser marcadas como feitas na Home.
alter table calendar_events add column if not exists done boolean not null default false;
alter table calendar_events add column if not exists kind text not null default 'evento' check (kind in ('evento','tarefa'));
-- Masmorras: vida do mascote, Ouro das masmorras, melhor andar e entradas por dia.
alter table pets add column if not exists hp int;
alter table pets add column if not exists hp_at timestamptz;
alter table pets add column if not exists dungeon_gold int not null default 0 check (dungeon_gold >= 0);
alter table pets add column if not exists dungeon_best int not null default 0;
alter table pets add column if not exists dungeon_runs jsonb not null default '{}'::jsonb;
