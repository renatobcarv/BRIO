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
