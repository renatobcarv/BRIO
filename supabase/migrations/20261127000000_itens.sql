-- Itens do mascote: o que está equipado em cada espaço ({"forca": {"id": "manopla", "at": "2026-11-23"}}).
alter table pets add column if not exists equipped jsonb not null default '{}'::jsonb;
-- Loja e evolução: itens comprados com Ouro de caça, nível de cada item e Ouro já gasto.
alter table pets add column if not exists bought jsonb not null default '[]'::jsonb;
alter table pets add column if not exists levels jsonb not null default '{}'::jsonb;
alter table pets add column if not exists spent int not null default 0 check (spent >= 0);
-- Fera domada ativa (acompanha você e dá bônus no atributo dela).
alter table pets add column if not exists active_beast text;
-- Minigame de domar: resultado de cada oportunidade (uma tentativa só).
alter table pets add column if not exists tame_tries jsonb not null default '{}'::jsonb;
