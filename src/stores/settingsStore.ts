import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, UnitSystem, NutritionTargets } from '../types';

interface SettingsState {
  hasOnboarded: boolean;
  user: UserProfile | null;
  unitSystem: UnitSystem;
  theme: 'dark' | 'light';
  nutritionTargets: NutritionTargets;
  notificationsEnabled: boolean;
  habitRemindersEnabled: boolean;
  workoutRemindersEnabled: boolean;
  waterRemindersEnabled: boolean;
  setHasOnboarded: (v: boolean) => void;
  setUser: (user: UserProfile) => void;
  updateUser: (partial: Partial<UserProfile>) => void;
  setUnitSystem: (system: UnitSystem) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setNutritionTargets: (targets: Partial<NutritionTargets>) => void;
  setNotificationsEnabled: (v: boolean) => void;
  setHabitRemindersEnabled: (v: boolean) => void;
  setWorkoutRemindersEnabled: (v: boolean) => void;
  setWaterRemindersEnabled: (v: boolean) => void;
  clearAll: () => void;
}

const defaultNutrition: NutritionTargets = {
  calorieTarget: 2200,
  proteinG: 160,
  carbsG: 220,
  fatG: 70,
  waterMl: 2500,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      hasOnboarded: false,
      user: null,
      unitSystem: 'metric',
      theme: 'dark',
      nutritionTargets: defaultNutrition,
      notificationsEnabled: true,
      habitRemindersEnabled: true,
      workoutRemindersEnabled: false,
      waterRemindersEnabled: false,

      setHasOnboarded: (v) => set({ hasOnboarded: v }),
      setUser: (user) => set({ user }),
      updateUser: (partial) => {
        const user = get().user;
        if (user) set({ user: { ...user, ...partial } });
        else set({ user: { id: `user-${Date.now()}`, name: '', age: 0, sex: 'other', heightCm: 0, weightKg: 0, activityLevel: 'moderate', goals: [], createdAt: Date.now(), ...partial } as UserProfile });
      },
      setUnitSystem: (system) => set({ unitSystem: system }),
      setTheme: (theme) => set({ theme }),
      setNutritionTargets: (targets) =>
        set((s) => ({ nutritionTargets: { ...s.nutritionTargets, ...targets } })),
      setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),
      setHabitRemindersEnabled: (v) => set({ habitRemindersEnabled: v }),
      setWorkoutRemindersEnabled: (v) => set({ workoutRemindersEnabled: v }),
      setWaterRemindersEnabled: (v) => set({ waterRemindersEnabled: v }),
      clearAll: () =>
        set({
          hasOnboarded: false,
          user: null,
          unitSystem: 'metric',
          theme: 'dark',
          nutritionTargets: defaultNutrition,
          notificationsEnabled: true,
          habitRemindersEnabled: true,
          workoutRemindersEnabled: false,
          waterRemindersEnabled: false,
        }),
    }),
    {
      name: 'forge-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
