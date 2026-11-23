-- Itens do mascote: o que está equipado em cada espaço ({"forca": {"id": "manopla", "at": "2026-11-23"}}).
alter table pets add column if not exists equipped jsonb not null default '{}'::jsonb;
