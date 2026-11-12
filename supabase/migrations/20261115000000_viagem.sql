-- Modo viagem: períodos em que os eventos ficam pausados (sem prêmio e sem cicatriz).
alter table settings add column if not exists travel jsonb not null default '[]';
