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
