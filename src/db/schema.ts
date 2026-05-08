import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  age: integer('age').notNull(),
  sex: text('sex').notNull(),
  heightCm: real('height_cm').notNull(),
  weightKg: real('weight_kg').notNull(),
  activityLevel: text('activity_level').notNull(),
  goals: text('goals').notNull().default('[]'),
  createdAt: integer('created_at').notNull(),
});

export const exercises = sqliteTable('exercises', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  primaryMuscles: text('primary_muscles').notNull().default('[]'),
  secondaryMuscles: text('secondary_muscles').notNull().default('[]'),
  equipment: text('equipment').notNull(),
  movementPattern: text('movement_pattern').notNull(),
  instructions: text('instructions').notNull().default(''),
  isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull(),
});

export const workouts = sqliteTable('workouts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  templateId: text('template_id'),
  startedAt: integer('started_at').notNull(),
  completedAt: integer('completed_at'),
  durationSeconds: integer('duration_seconds'),
  notes: text('notes'),
  totalVolumeKg: real('total_volume_kg'),
});

export const workoutExercises = sqliteTable('workout_exercises', {
  id: text('id').primaryKey(),
  workoutId: text('workout_id').notNull(),
  exerciseId: text('exercise_id').notNull(),
  restSeconds: integer('rest_seconds').notNull().default(90),
  supersetGroupId: text('superset_group_id'),
  notes: text('notes'),
  order: integer('order').notNull().default(0),
});

export const workoutSets = sqliteTable('workout_sets', {
  id: text('id').primaryKey(),
  workoutExerciseId: text('workout_exercise_id').notNull(),
  exerciseId: text('exercise_id').notNull(),
  weightKg: real('weight_kg').notNull().default(0),
  reps: integer('reps').notNull().default(0),
  rpe: real('rpe'),
  isWarmup: integer('is_warmup', { mode: 'boolean' }).notNull().default(false),
  completedAt: integer('completed_at').notNull(),
});

export const workoutTemplates = sqliteTable('workout_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  isPreloaded: integer('is_preloaded', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull(),
});

export const templateExercises = sqliteTable('template_exercises', {
  id: text('id').primaryKey(),
  templateId: text('template_id').notNull(),
  exerciseId: text('exercise_id').notNull(),
  defaultSets: integer('default_sets').notNull().default(3),
  defaultReps: integer('default_reps').notNull().default(10),
  defaultWeightKg: real('default_weight_kg'),
  restSeconds: integer('rest_seconds').notNull().default(90),
  order: integer('order').notNull().default(0),
});

export const healthMetrics = sqliteTable('health_metrics', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  value: real('value').notNull(),
  unit: text('unit').notNull(),
  recordedAt: integer('recorded_at').notNull(),
  source: text('source').notNull().default('manual'),
  notes: text('notes'),
});

export const sleepLogs = sqliteTable('sleep_logs', {
  id: text('id').primaryKey(),
  bedtime: integer('bedtime').notNull(),
  wakeTime: integer('wake_time').notNull(),
  totalMinutes: integer('total_minutes').notNull(),
  efficiency: real('efficiency'),
  deepMinutes: integer('deep_minutes'),
  remMinutes: integer('rem_minutes'),
  lightMinutes: integer('light_minutes'),
  awakeMinutes: integer('awake_minutes'),
  source: text('source').notNull().default('manual'),
  recordedAt: integer('recorded_at').notNull(),
});

export const foodLogs = sqliteTable('food_logs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  calories: real('calories').notNull(),
  proteinG: real('protein_g').notNull().default(0),
  carbsG: real('carbs_g').notNull().default(0),
  fatG: real('fat_g').notNull().default(0),
  servingSize: real('serving_size').notNull().default(1),
  servingUnit: text('serving_unit').notNull().default('serving'),
  loggedAt: integer('logged_at').notNull(),
  mealType: text('meal_type').notNull().default('snack'),
});

export const moodLogs = sqliteTable('mood_logs', {
  id: text('id').primaryKey(),
  mood: integer('mood').notNull(),
  energy: integer('energy').notNull(),
  stress: integer('stress').notNull(),
  notes: text('notes'),
  loggedAt: integer('logged_at').notNull(),
});

export const habits = sqliteTable('habits', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  frequency: text('frequency').notNull().default('daily'),
  daysOfWeek: text('days_of_week').notNull().default('[]'),
  timesPerWeek: integer('times_per_week'),
  category: text('category').notNull(),
  target: real('target'),
  targetUnit: text('target_unit'),
  stackGroupId: text('stack_group_id'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at').notNull(),
});

export const habitLogs = sqliteTable('habit_logs', {
  id: text('id').primaryKey(),
  habitId: text('habit_id').notNull(),
  date: text('date').notNull(),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  skipped: integer('skipped', { mode: 'boolean' }).notNull().default(false),
  value: real('value'),
  completedAt: integer('completed_at'),
});

export const goals = sqliteTable('goals', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  targetValue: real('target_value').notNull(),
  currentValue: real('current_value').notNull().default(0),
  unit: text('unit').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  status: text('status').notNull().default('active'),
  linkedMetricType: text('linked_metric_type'),
  createdAt: integer('created_at').notNull(),
});

export const goalMilestones = sqliteTable('goal_milestones', {
  id: text('id').primaryKey(),
  goalId: text('goal_id').notNull(),
  title: text('title').notNull(),
  targetValue: real('target_value').notNull(),
  completedAt: integer('completed_at'),
  order: integer('order').notNull().default(0),
});

export const goalReflections = sqliteTable('goal_reflections', {
  id: text('id').primaryKey(),
  goalId: text('goal_id').notNull(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  weekNumber: integer('week_number').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  dueDate: text('due_date'),
  priority: text('priority').notNull().default('medium'),
  category: text('category'),
  goalId: text('goal_id'),
  isRecurring: integer('is_recurring', { mode: 'boolean' }).notNull().default(false),
  recurringDays: text('recurring_days').notNull().default('[]'),
  completedAt: integer('completed_at'),
  createdAt: integer('created_at').notNull(),
});
