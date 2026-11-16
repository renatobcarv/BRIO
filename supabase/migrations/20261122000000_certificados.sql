-- BRIO v14: certificados externos indexados (cursos, faculdade, eventos). Arquivo no bucket privado. Pode rodar mais de uma vez.
create table if not exists study_certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  title text not null check (char_length(title) between 1 and 200),
  issuer text, issued_at date, expires_at date, hours numeric,
  credential_id text, url text, skills text, notes text,
  file_path text,
  kind text not null default 'curso' check (kind in ('curso','graduacao','pos','idioma','evento','certificacao','outro')),
  track_id uuid references study_tracks on delete set null
);
create index if not exists study_certificates_user on study_certificates (user_id, issued_at desc);
alter table study_certificates enable row level security;
drop policy if exists "dono" on study_certificates;
create policy "dono" on study_certificates for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
