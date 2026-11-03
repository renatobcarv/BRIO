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
