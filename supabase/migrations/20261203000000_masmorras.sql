-- Masmorras: vida do mascote, Ouro das masmorras, melhor andar e entradas por dia.
alter table pets add column if not exists hp int;
alter table pets add column if not exists hp_at timestamptz;
alter table pets add column if not exists dungeon_gold int not null default 0 check (dungeon_gold >= 0);
alter table pets add column if not exists dungeon_best int not null default 0;
alter table pets add column if not exists dungeon_runs jsonb not null default '{}'::jsonb;
