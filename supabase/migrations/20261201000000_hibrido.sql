-- Objetivo híbrido (corrida + hipertrofia) nas campanhas.
alter table training_programs drop constraint if exists training_programs_goal_check;
alter table training_programs add constraint training_programs_goal_check check (goal in ('forca','hipertrofia','powerbuilding','emagrecimento','condicionamento','recomposicao','hibrido'));
