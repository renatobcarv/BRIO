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
