-- Ajustes da semana feitos pelo usuário sobre a proposta do Mestre: {"5": {"days": {"1": [...]}, "note": "Semana corrida"}}.
alter table training_programs add column if not exists week_overrides jsonb not null default '{}'::jsonb;
