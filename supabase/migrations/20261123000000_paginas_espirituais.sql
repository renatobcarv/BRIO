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
