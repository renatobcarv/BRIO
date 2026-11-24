-- Missões do dia: tarefas da agenda podem ser marcadas como feitas na Home.
alter table calendar_events add column if not exists done boolean not null default false;
alter table calendar_events add column if not exists kind text not null default 'evento' check (kind in ('evento','tarefa'));
