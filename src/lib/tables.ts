/** Ordem respeita as chaves estrangeiras (objetivos antes de metas, treinos antes de séries). */
export const TABLES = [
  "settings", "streaks", "daily_checks", "study_entries", "bible_reading", "journal_entries",
  "pioneer_entries", "pioneer_month_goals", "pioneer_week_plan", "weight_logs", "water_logs", "meals",
  "workouts", "workout_sets", "sleep_logs", "finance_items", "investments", "savings_boxes",
  "net_worth_items", "objectives", "goals",
] as const;
/** Tabelas com uma linha por usuário. */
export const SINGLETONS = new Set(["settings", "streaks", "pioneer_week_plan"]);
