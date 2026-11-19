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

-- Coleção por sorteio: 10 espécies com raridades, 5 sorteios por mês; repetidos viram essência bônus.
alter table pets drop constraint if exists pets_species_check;
alter table pets add constraint pets_species_check check (species in ('lobo','coruja','urso','aguia','tubarao','serpente','leao','pantera','fenix','dragao','onca'));
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
