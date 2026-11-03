-- BRIO — valores padrão. Rode DEPOIS de criar seu usuário em Authentication → Users.
-- Troque o e-mail abaixo se necessário.
do $$
declare uid uuid := (select id from auth.users where email = 'renato.bcarvalho7@gmail.com');
begin
  if uid is null then raise exception 'Usuário não encontrado. Crie-o antes em Authentication → Users.'; end if;

  insert into settings (user_id, checklist, workout_split, partner_phrase)
  values (uid,
    '[
      {"key":"oracao_estudo","label":"Oração da manhã + estudo pessoal (30 min)","primary":true},
      {"key":"biblia","label":"Leitura da Bíblia"},
      {"key":"faculdade","label":"Faculdade"},
      {"key":"treino","label":"Treino ou cardio feito"},
      {"key":"agua","label":"Meta de água batida"},
      {"key":"refeicoes","label":"4 refeições / proteína batida"},
      {"key":"sono","label":"Dormi 7h+"}
    ]'::jsonb,
    '[
      {"dow":1,"label":"D1","focus":"Costas / Ombro / Abs"},
      {"dow":2,"label":"D2","focus":"Perna"},
      {"dow":3,"label":"Off","focus":"Cardio 20–30 min"},
      {"dow":4,"label":"D3","focus":"Costas / Ombro / Abs"},
      {"dow":5,"label":"Off","focus":"Cardio 20–30 min"},
      {"dow":6,"label":"D4","focus":"Peito / Tríceps / Abs"},
      {"dow":0,"label":"Off","focus":"Descanso total"}
    ]'::jsonb,
    'Escreva aqui a frase dela.')
  on conflict (user_id) do nothing;

  insert into streaks (user_id) values (uid) on conflict (user_id) do nothing;
  insert into pioneer_week_plan (user_id) values (uid) on conflict (user_id) do nothing;
  insert into weight_logs (user_id, date, kg) values (uid, current_date, 86) on conflict do nothing;

  if not exists (select 1 from finance_items where user_id = uid) then
    insert into finance_items (user_id, month, kind, name, amount) values
      (uid, date_trunc('month', current_date), 'variavel', 'Ofertas (Congregação)', 0);
  end if;

  if not exists (select 1 from objectives where user_id = uid) then
    insert into objectives (user_id, title, area, description)
    values (uid, 'Manter o pioneiro regular com estabilidade financeira', 'espiritual', null);
  end if;
end $$;
