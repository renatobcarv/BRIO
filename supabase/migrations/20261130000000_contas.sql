-- Contas: cada pessoa configura o seu BRIO.
-- partner_name: nome da "pessoa especial" (card na Home e nos Sonhos). Vazio = card escondido.
-- prefs: preferências livres (módulos ligados/desligados e ajustes futuros), sem precisar de nova migração.
alter table settings add column if not exists partner_name text check (partner_name is null or char_length(partner_name) <= 60);
alter table settings add column if not exists prefs jsonb not null default '{}'::jsonb;
