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
