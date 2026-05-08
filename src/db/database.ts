import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

const sqlite = SQLite.openDatabaseSync('forge.db');
export const db = drizzle(sqlite, { schema });

export const runMigrations = async () => {
  sqlite.execSync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      sex TEXT NOT NULL,
      height_cm REAL NOT NULL,
      weight_kg REAL NOT NULL,
      activity_level TEXT NOT NULL,
      goals TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      primary_muscles TEXT NOT NULL DEFAULT '[]',
      secondary_muscles TEXT NOT NULL DEFAULT '[]',
      equipment TEXT NOT NULL,
      movement_pattern TEXT NOT NULL,
      instructions TEXT NOT NULL DEFAULT '',
      is_custom INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      template_id TEXT,
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      duration_seconds INTEGER,
      notes TEXT,
      total_volume_kg REAL
    );

    CREATE TABLE IF NOT EXISTS workout_exercises (
      id TEXT PRIMARY KEY,
      workout_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      rest_seconds INTEGER NOT NULL DEFAULT 90,
      superset_group_id TEXT,
      notes TEXT,
      "order" INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS workout_sets (
      id TEXT PRIMARY KEY,
      workout_exercise_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      weight_kg REAL NOT NULL DEFAULT 0,
      reps INTEGER NOT NULL DEFAULT 0,
      rpe REAL,
      is_warmup INTEGER NOT NULL DEFAULT 0,
      completed_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      is_preloaded INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS template_exercises (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      default_sets INTEGER NOT NULL DEFAULT 3,
      default_reps INTEGER NOT NULL DEFAULT 10,
      default_weight_kg REAL,
      rest_seconds INTEGER NOT NULL DEFAULT 90,
      "order" INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS health_metrics (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      value REAL NOT NULL,
      unit TEXT NOT NULL,
      recorded_at INTEGER NOT NULL,
      source TEXT NOT NULL DEFAULT 'manual',
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS sleep_logs (
      id TEXT PRIMARY KEY,
      bedtime INTEGER NOT NULL,
      wake_time INTEGER NOT NULL,
      total_minutes INTEGER NOT NULL,
      efficiency REAL,
      deep_minutes INTEGER,
      rem_minutes INTEGER,
      light_minutes INTEGER,
      awake_minutes INTEGER,
      source TEXT NOT NULL DEFAULT 'manual',
      recorded_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS food_logs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      calories REAL NOT NULL,
      protein_g REAL NOT NULL DEFAULT 0,
      carbs_g REAL NOT NULL DEFAULT 0,
      fat_g REAL NOT NULL DEFAULT 0,
      serving_size REAL NOT NULL DEFAULT 1,
      serving_unit TEXT NOT NULL DEFAULT 'serving',
      logged_at INTEGER NOT NULL,
      meal_type TEXT NOT NULL DEFAULT 'snack'
    );

    CREATE TABLE IF NOT EXISTS mood_logs (
      id TEXT PRIMARY KEY,
      mood INTEGER NOT NULL,
      energy INTEGER NOT NULL,
      stress INTEGER NOT NULL,
      notes TEXT,
      logged_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      frequency TEXT NOT NULL DEFAULT 'daily',
      days_of_week TEXT NOT NULL DEFAULT '[]',
      times_per_week INTEGER,
      category TEXT NOT NULL,
      target REAL,
      target_unit TEXT,
      stack_group_id TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS habit_logs (
      id TEXT PRIMARY KEY,
      habit_id TEXT NOT NULL,
      date TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      skipped INTEGER NOT NULL DEFAULT 0,
      value REAL,
      completed_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      target_value REAL NOT NULL,
      current_value REAL NOT NULL DEFAULT 0,
      unit TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      linked_metric_type TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS goal_milestones (
      id TEXT PRIMARY KEY,
      goal_id TEXT NOT NULL,
      title TEXT NOT NULL,
      target_value REAL NOT NULL,
      completed_at INTEGER,
      "order" INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS goal_reflections (
      id TEXT PRIMARY KEY,
      goal_id TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      week_number INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      due_date TEXT,
      priority TEXT NOT NULL DEFAULT 'medium',
      category TEXT,
      goal_id TEXT,
      is_recurring INTEGER NOT NULL DEFAULT 0,
      recurring_days TEXT NOT NULL DEFAULT '[]',
      completed_at INTEGER,
      created_at INTEGER NOT NULL
    );
  `);
};

export const seedExercises = async () => {
  const { EXERCISE_LIBRARY, WORKOUT_TEMPLATES } = await import('../constants/exercises');
  const now = Date.now();

  const existing = sqlite.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM exercises');
  if (existing && existing.count > 0) return;

  for (const ex of EXERCISE_LIBRARY) {
    sqlite.runSync(
      `INSERT OR IGNORE INTO exercises (id, name, primary_muscles, secondary_muscles, equipment, movement_pattern, instructions, is_custom, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [
        ex.id, ex.name,
        JSON.stringify(ex.primaryMuscles),
        JSON.stringify(ex.secondaryMuscles),
        ex.equipment, ex.movementPattern, ex.instructions, now,
      ]
    );
  }

  for (const tpl of WORKOUT_TEMPLATES) {
    sqlite.runSync(
      `INSERT OR IGNORE INTO workout_templates (id, name, description, is_preloaded, created_at) VALUES (?, ?, ?, 1, ?)`,
      [tpl.id, tpl.name, tpl.description ?? '', now]
    );
    tpl.exercises.forEach((ex, idx) => {
      sqlite.runSync(
        `INSERT OR IGNORE INTO template_exercises (id, template_id, exercise_id, default_sets, default_reps, rest_seconds, "order") VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [`${tpl.id}-${ex.exerciseId}`, tpl.id, ex.exerciseId, ex.defaultSets, ex.defaultReps, ex.restSeconds, idx]
      );
    });
  }
};
