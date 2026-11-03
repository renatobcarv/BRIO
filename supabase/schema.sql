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

-- ═══ v2 (também em migrations/20261104000000_v2.sql) ═══
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

-- ═══ v3 Livros (também em migrations/20261105000000_livros.sql) ═══
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

alter table goals drop constraint if exists goals_auto_source_check;
alter table goals add constraint goals_auto_source_check check (auto_source in ('pioneer_month','weight','savings_box','bible_chapters','books_year'));

-- ═══ v4 Periodização (também em migrations/20261106000000_periodizacao.sql) ═══
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

-- ═══ v5 Investimentos (também em migrations/20261107000000_investimentos.sql) ═══
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
