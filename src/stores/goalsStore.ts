import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal, GoalMilestone, GoalReflection } from '../types';

interface GoalsState {
  goals: Goal[];

  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  completeGoal: (id: string) => void;
  archiveGoal: (id: string) => void;

  addMilestone: (goalId: string, milestone: GoalMilestone) => void;
  completeMilestone: (goalId: string, milestoneId: string) => void;
  deleteMilestone: (goalId: string, milestoneId: string) => void;

  addReflection: (goalId: string, reflection: GoalReflection) => void;

  updateProgress: (goalId: string, value: number) => void;
  getActiveGoals: () => Goal[];
  getCompletedGoals: () => Goal[];
  clearAll: () => void;
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set, get) => ({
      goals: [],

      addGoal: (goal) => set((s) => ({ goals: [...s.goals, goal] })),

      updateGoal: (id, updates) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)) })),

      deleteGoal: (id) =>
        set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      completeGoal: (id) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === id ? { ...g, status: 'completed', currentValue: g.targetValue } : g
          ),
        })),

      archiveGoal: (id) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, status: 'archived' } : g)) })),

      addMilestone: (goalId, milestone) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId ? { ...g, milestones: [...g.milestones, milestone] } : g
          ),
        })),

      completeMilestone: (goalId, milestoneId) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  milestones: g.milestones.map((m) =>
                    m.id === milestoneId ? { ...m, completedAt: Date.now() } : m
                  ),
                }
              : g
          ),
        })),

      deleteMilestone: (goalId, milestoneId) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId
              ? { ...g, milestones: g.milestones.filter((m) => m.id !== milestoneId) }
              : g
          ),
        })),

      addReflection: (goalId, reflection) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId ? { ...g, reflections: [...g.reflections, reflection] } : g
          ),
        })),

      updateProgress: (goalId, value) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId
              ? {
                  ...g,
                  currentValue: value,
                  status: value >= g.targetValue ? 'completed' : g.status,
                }
              : g
          ),
        })),

      getActiveGoals: () => get().goals.filter((g) => g.status === 'active'),

      getCompletedGoals: () => get().goals.filter((g) => g.status === 'completed'),

      clearAll: () => set({ goals: [] }),
    }),
    {
      name: 'forge-goals',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
