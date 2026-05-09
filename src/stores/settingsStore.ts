import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, UnitSystem, NutritionTargets } from '../types';

interface SettingsState {
  hasOnboarded: boolean;
  user: UserProfile | null;
  unitSystem: UnitSystem;
  nutritionTargets: NutritionTargets;
  notificationsEnabled: boolean;
  habitRemindersEnabled: boolean;
  workoutRemindersEnabled: boolean;
  waterRemindersEnabled: boolean;
  setHasOnboarded: (v: boolean) => void;
  setUser: (user: UserProfile) => void;
  updateUser: (partial: Partial<UserProfile>) => void;
  setUnitSystem: (system: UnitSystem) => void;
  setNutritionTargets: (targets: Partial<NutritionTargets>) => void;
  setNotificationsEnabled: (v: boolean) => void;
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
      },
      setUnitSystem: (system) => set({ unitSystem: system }),
      setNutritionTargets: (targets) =>
        set((s) => ({ nutritionTargets: { ...s.nutritionTargets, ...targets } })),
      setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),
      clearAll: () =>
        set({
          hasOnboarded: false,
          user: null,
          unitSystem: 'metric',
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
