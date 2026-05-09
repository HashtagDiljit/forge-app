// ─── User & Settings ──────────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  name: string;
  age: number;
  sex: 'male' | 'female' | 'other';
  heightCm: number;
  weightKg: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goals: string[];
  createdAt: number;
}

export type UnitSystem = 'metric' | 'imperial';

// ─── Exercise & Workout ───────────────────────────────────────────────────────
export type MuscleGroup =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps'
  | 'forearms' | 'core' | 'quads' | 'hamstrings' | 'glutes'
  | 'calves' | 'full_body' | 'cardio';

export type EquipmentType =
  | 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight'
  | 'kettlebell' | 'band' | 'smith' | 'other';

export type MovementPattern =
  | 'push' | 'pull' | 'hinge' | 'squat' | 'carry' | 'rotation' | 'cardio';

export interface Exercise {
  id: string;
  name: string;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  equipment: EquipmentType;
  movementPattern: MovementPattern;
  instructions: string;
  isCustom: boolean;
  createdAt: number;
}

export interface WorkoutSet {
  id: string;
  exerciseId: string;
  weightKg: number;
  reps: number;
  rpe?: number;
  isWarmup: boolean;
  completedAt: number;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exercise?: Exercise;
  sets: WorkoutSet[];
  restSeconds: number;
  supersetGroupId?: string;
  notes?: string;
}

export interface Workout {
  id: string;
  name: string;
  templateId?: string;
  exercises: WorkoutExercise[];
  startedAt: number;
  completedAt?: number;
  durationSeconds?: number;
  notes?: string;
  totalVolumeKg?: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  exercises: TemplateExercise[];
  isPreloaded: boolean;
  createdAt: number;
}

export interface TemplateExercise {
  id: string;
  exerciseId: string;
  exercise?: Exercise;
  defaultSets: number;
  defaultReps: number;
  defaultWeightKg?: number;
  restSeconds: number;
  order: number;
}

export interface PersonalRecord {
  exerciseId: string;
  weightKg: number;
  reps: number;
  e1rm: number;
  achievedAt: number;
  workoutId: string;
}

// ─── Health Metrics ───────────────────────────────────────────────────────────
export interface HealthMetric {
  id: string;
  type: HealthMetricType;
  value: number;
  unit: string;
  recordedAt: number;
  source: 'manual' | 'health_connect';
  notes?: string;
}

export type HealthMetricType =
  | 'weight' | 'body_fat' | 'muscle_mass'
  | 'steps' | 'heart_rate_resting' | 'heart_rate'
  | 'sleep_duration' | 'calories_active' | 'calories_total'
  | 'distance' | 'spo2' | 'blood_pressure_systolic' | 'blood_pressure_diastolic'
  | 'hydration' | 'vo2max' | 'hrv'
  | 'neck' | 'chest' | 'waist' | 'hips' | 'biceps' | 'thighs' | 'calves';

export interface SleepLog {
  id: string;
  bedtime: number;
  wakeTime: number;
  totalMinutes: number;
  efficiency?: number;
  deepMinutes?: number;
  remMinutes?: number;
  lightMinutes?: number;
  awakeMinutes?: number;
  source: 'manual' | 'health_connect';
  recordedAt: number;
}

export interface FoodLog {
  id: string;
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  servingSize: number;
  servingUnit: string;
  loggedAt: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface MoodLog {
  id: string;
  mood: 1 | 2 | 3 | 4 | 5;
  energy: number;
  stress: number;
  notes?: string;
  loggedAt: number;
}

// ─── Habits ───────────────────────────────────────────────────────────────────
export type HabitFrequency = 'daily' | 'specific_days' | 'x_per_week';
export type HabitCategory = 'health' | 'fitness' | 'mindfulness' | 'learning' | 'productivity';

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: HabitFrequency;
  daysOfWeek?: number[];
  timesPerWeek?: number;
  category: HabitCategory;
  target?: number;
  targetUnit?: string;
  stackGroupId?: string;
  isActive: boolean;
  createdAt: number;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
  skipped: boolean;
  value?: number;
  completedAt?: number;
}

export interface HabitStreak {
  habitId: string;
  current: number;
  longest: number;
  lastCompletedDate?: string;
}

// ─── Goals ────────────────────────────────────────────────────────────────────
export type GoalCategory = 'fitness' | 'health' | 'learning' | 'career' | 'finance' | 'personal';
export type GoalStatus = 'active' | 'completed' | 'archived' | 'paused';

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: string;
  endDate: string;
  status: GoalStatus;
  linkedMetricType?: HealthMetricType;
  milestones: GoalMilestone[];
  reflections: GoalReflection[];
  createdAt: number;
}

export interface GoalMilestone {
  id: string;
  goalId: string;
  title: string;
  targetValue: number;
  completedAt?: number;
  order: number;
}

export interface GoalReflection {
  id: string;
  goalId: string;
  question: string;
  answer: string;
  weekNumber: number;
  createdAt: number;
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskView = 'today' | 'upcoming' | 'all';

export interface Task {
  id: string;
  title: string;
  dueDate?: string;
  priority: TaskPriority;
  category?: string;
  goalId?: string;
  isRecurring: boolean;
  recurringDays?: number[];
  completedAt?: number;
  createdAt: number;
}

// ─── Nutrition ────────────────────────────────────────────────────────────────
export interface NutritionTargets {
  calorieTarget: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  waterMl: number;
}
