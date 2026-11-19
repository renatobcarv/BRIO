-- Amplia a coleção sem reclassificar mascotes existentes.
alter table public.pets
  drop constraint if exists pets_species_check,
  add constraint pets_species_check check (species in (
    'lobo', 'coruja', 'urso', 'aguia', 'tubarao', 'serpente', 'leao',
    'pantera', 'fenix', 'dragao', 'onca', 'kitsune', 'qilin', 'grifo', 'genbu'
  ));
