/** Ordem respeita as chaves estrangeiras (objetivos antes de metas, treinos antes de séries). */
export const TABLES = [
  "settings", "streaks", "daily_checks", "study_entries", "bible_reading", "journal_entries",
  "pioneer_entries", "pioneer_month_goals", "pioneer_week_plan", "weight_logs", "water_logs", "meals",
  "foods", "meal_items", "training_programs", "workouts", "workout_sets", "sleep_logs", "finance_items", "investments", "investment_moves", "savings_boxes",
  "net_worth_items", "objectives", "goals", "books", "book_notes", "reading_sessions", "finance_chat_messages", "finance_chat_proposals", "clean_marks",
] as const;
/** Tabelas com uma linha por usuário. */
export const SINGLETONS = new Set(["settings", "streaks", "pioneer_week_plan"]);
