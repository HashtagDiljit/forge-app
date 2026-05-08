import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Workout, WorkoutExercise, WorkoutSet, WorkoutTemplate, Exercise, PersonalRecord } from '../types';

interface ActiveWorkout {
  workout: Workout;
  activeExerciseIndex: number;
  restTimerActive: boolean;
  restTimerSeconds: number;
  restTimerRemaining: number;
}

interface WorkoutState {
  activeWorkout: ActiveWorkout | null;
  recentWorkouts: Workout[];
  templates: WorkoutTemplate[];
  personalRecords: PersonalRecord[];
  lastSetsByExercise: Record<string, WorkoutSet[]>;

  startWorkout: (name: string, templateId?: string) => void;
  addExercise: (exercise: WorkoutExercise) => void;
  removeExercise: (exerciseId: string) => void;
  logSet: (workoutExerciseId: string, set: WorkoutSet) => void;
  updateSet: (workoutExerciseId: string, setId: string, updates: Partial<WorkoutSet>) => void;
  removeSet: (workoutExerciseId: string, setId: string) => void;
  finishWorkout: () => Workout | null;
  discardWorkout: () => void;
  setActiveExercise: (index: number) => void;
  startRestTimer: (seconds: number) => void;
  tickRestTimer: () => void;
  stopRestTimer: () => void;

  addTemplate: (template: WorkoutTemplate) => void;
  updateTemplate: (id: string, updates: Partial<WorkoutTemplate>) => void;
  deleteTemplate: (id: string) => void;

  addRecentWorkout: (workout: Workout) => void;
  updatePersonalRecord: (record: PersonalRecord) => void;
  getLastSetsForExercise: (exerciseId: string) => WorkoutSet[];
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      activeWorkout: null,
      recentWorkouts: [],
      templates: [],
      personalRecords: [],
      lastSetsByExercise: {},

      startWorkout: (name, templateId) => {
        const workout: Workout = {
          id: `workout-${Date.now()}`,
          name,
          templateId,
          exercises: [],
          startedAt: Date.now(),
        };
        set({ activeWorkout: { workout, activeExerciseIndex: 0, restTimerActive: false, restTimerSeconds: 90, restTimerRemaining: 90 } });
      },

      addExercise: (exercise) =>
        set((s) => {
          if (!s.activeWorkout) return s;
          return {
            activeWorkout: {
              ...s.activeWorkout,
              workout: {
                ...s.activeWorkout.workout,
                exercises: [...s.activeWorkout.workout.exercises, exercise],
              },
            },
          };
        }),

      removeExercise: (id) =>
        set((s) => {
          if (!s.activeWorkout) return s;
          return {
            activeWorkout: {
              ...s.activeWorkout,
              workout: {
                ...s.activeWorkout.workout,
                exercises: s.activeWorkout.workout.exercises.filter((e) => e.id !== id),
              },
            },
          };
        }),

      logSet: (workoutExerciseId, newSet) =>
        set((s) => {
          if (!s.activeWorkout) return s;
          const exercises = s.activeWorkout.workout.exercises.map((ex) =>
            ex.id === workoutExerciseId
              ? { ...ex, sets: [...ex.sets, newSet] }
              : ex
          );
          return {
            activeWorkout: {
              ...s.activeWorkout,
              workout: { ...s.activeWorkout.workout, exercises },
            },
          };
        }),

      updateSet: (workoutExerciseId, setId, updates) =>
        set((s) => {
          if (!s.activeWorkout) return s;
          const exercises = s.activeWorkout.workout.exercises.map((ex) =>
            ex.id === workoutExerciseId
              ? { ...ex, sets: ex.sets.map((st) => (st.id === setId ? { ...st, ...updates } : st)) }
              : ex
          );
          return { activeWorkout: { ...s.activeWorkout, workout: { ...s.activeWorkout.workout, exercises } } };
        }),

      removeSet: (workoutExerciseId, setId) =>
        set((s) => {
          if (!s.activeWorkout) return s;
          const exercises = s.activeWorkout.workout.exercises.map((ex) =>
            ex.id === workoutExerciseId
              ? { ...ex, sets: ex.sets.filter((st) => st.id !== setId) }
              : ex
          );
          return { activeWorkout: { ...s.activeWorkout, workout: { ...s.activeWorkout.workout, exercises } } };
        }),

      finishWorkout: () => {
        const { activeWorkout } = get();
        if (!activeWorkout) return null;
        const now = Date.now();
        const workout: Workout = {
          ...activeWorkout.workout,
          completedAt: now,
          durationSeconds: Math.round((now - activeWorkout.workout.startedAt) / 1000),
          totalVolumeKg: activeWorkout.workout.exercises
            .flatMap((ex) => ex.sets)
            .reduce((sum, s) => sum + s.weightKg * s.reps, 0),
        };

        // Cache last sets per exercise
        const lastSets: Record<string, WorkoutSet[]> = { ...get().lastSetsByExercise };
        workout.exercises.forEach((ex) => {
          if (ex.sets.length > 0) lastSets[ex.exerciseId] = ex.sets;
        });

        set((s) => ({
          activeWorkout: null,
          recentWorkouts: [workout, ...s.recentWorkouts].slice(0, 100),
          lastSetsByExercise: lastSets,
        }));
        return workout;
      },

      discardWorkout: () => set({ activeWorkout: null }),

      setActiveExercise: (index) =>
        set((s) => s.activeWorkout ? { activeWorkout: { ...s.activeWorkout, activeExerciseIndex: index } } : s),

      startRestTimer: (seconds) =>
        set((s) => s.activeWorkout
          ? { activeWorkout: { ...s.activeWorkout, restTimerActive: true, restTimerSeconds: seconds, restTimerRemaining: seconds } }
          : s),

      tickRestTimer: () =>
        set((s) => {
          if (!s.activeWorkout || !s.activeWorkout.restTimerActive) return s;
          const remaining = s.activeWorkout.restTimerRemaining - 1;
          return {
            activeWorkout: {
              ...s.activeWorkout,
              restTimerRemaining: remaining,
              restTimerActive: remaining > 0,
            },
          };
        }),

      stopRestTimer: () =>
        set((s) => s.activeWorkout
          ? { activeWorkout: { ...s.activeWorkout, restTimerActive: false, restTimerRemaining: 0 } }
          : s),

      addTemplate: (template) =>
        set((s) => ({ templates: [...s.templates, template] })),

      updateTemplate: (id, updates) =>
        set((s) => ({ templates: s.templates.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),

      deleteTemplate: (id) =>
        set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),

      addRecentWorkout: (workout) =>
        set((s) => ({ recentWorkouts: [workout, ...s.recentWorkouts].slice(0, 100) })),

      updatePersonalRecord: (record) =>
        set((s) => {
          const existing = s.personalRecords.findIndex((pr) => pr.exerciseId === record.exerciseId);
          if (existing >= 0) {
            const prs = [...s.personalRecords];
            if (record.e1rm > prs[existing].e1rm) prs[existing] = record;
            return { personalRecords: prs };
          }
          return { personalRecords: [...s.personalRecords, record] };
        }),

      getLastSetsForExercise: (exerciseId) => {
        return get().lastSetsByExercise[exerciseId] ?? [];
      },
    }),
    {
      name: 'forge-workout',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        recentWorkouts: s.recentWorkouts,
        templates: s.templates,
        personalRecords: s.personalRecords,
        lastSetsByExercise: s.lastSetsByExercise,
      }),
    }
  )
);
