import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HealthMetric, HealthMetricType, SleepLog, FoodLog, MoodLog } from '../types';
import { format } from 'date-fns';

interface HealthState {
  metrics: HealthMetric[];
  sleepLogs: SleepLog[];
  foodLogs: FoodLog[];
  moodLogs: MoodLog[];
  lastSyncedAt: Record<string, number>;

  addMetric: (metric: HealthMetric) => void;
  updateMetric: (id: string, updates: Partial<HealthMetric>) => void;
  deleteMetric: (id: string) => void;
  getLatestMetric: (type: HealthMetricType) => HealthMetric | undefined;
  getMetricHistory: (type: HealthMetricType, days?: number) => HealthMetric[];

  addSleepLog: (log: SleepLog) => void;
  updateSleepLog: (id: string, updates: Partial<SleepLog>) => void;
  deleteSleepLog: (id: string) => void;
  getLastNightSleep: () => SleepLog | undefined;

  addFoodLog: (log: FoodLog) => void;
  deleteFoodLog: (id: string) => void;
  getTodayFoodLogs: () => FoodLog[];

  addMoodLog: (log: MoodLog) => void;
  updateMoodLog: (id: string, updates: Partial<MoodLog>) => void;
  getTodayMoodLog: () => MoodLog | undefined;

  setLastSynced: (type: string, timestamp: number) => void;
  clearAll: () => void;
}

export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => ({
      metrics: [],
      sleepLogs: [],
      foodLogs: [],
      moodLogs: [],
      lastSyncedAt: {},

      addMetric: (metric) =>
        set((s) => ({ metrics: [metric, ...s.metrics] })),

      updateMetric: (id, updates) =>
        set((s) => ({ metrics: s.metrics.map((m) => (m.id === id ? { ...m, ...updates } : m)) })),

      deleteMetric: (id) =>
        set((s) => ({ metrics: s.metrics.filter((m) => m.id !== id) })),

      getLatestMetric: (type) =>
        get().metrics
          .filter((m) => m.type === type)
          .sort((a, b) => b.recordedAt - a.recordedAt)[0],

      getMetricHistory: (type, days = 30) => {
        const cutoff = Date.now() - days * 86400000;
        return get()
          .metrics.filter((m) => m.type === type && m.recordedAt >= cutoff)
          .sort((a, b) => a.recordedAt - b.recordedAt);
      },

      addSleepLog: (log) =>
        set((s) => ({ sleepLogs: [log, ...s.sleepLogs] })),

      updateSleepLog: (id, updates) =>
        set((s) => ({ sleepLogs: s.sleepLogs.map((l) => (l.id === id ? { ...l, ...updates } : l)) })),

      deleteSleepLog: (id) =>
        set((s) => ({ sleepLogs: s.sleepLogs.filter((l) => l.id !== id) })),

      getLastNightSleep: () =>
        get().sleepLogs.sort((a, b) => b.recordedAt - a.recordedAt)[0],

      addFoodLog: (log) =>
        set((s) => ({ foodLogs: [log, ...s.foodLogs] })),

      deleteFoodLog: (id) =>
        set((s) => ({ foodLogs: s.foodLogs.filter((f) => f.id !== id) })),

      getTodayFoodLogs: () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        return get().foodLogs.filter((f) => format(new Date(f.loggedAt), 'yyyy-MM-dd') === today);
      },

      addMoodLog: (log) =>
        set((s) => ({ moodLogs: [log, ...s.moodLogs] })),

      updateMoodLog: (id, updates) =>
        set((s) => ({ moodLogs: s.moodLogs.map((m) => (m.id === id ? { ...m, ...updates } : m)) })),

      getTodayMoodLog: () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        return get().moodLogs.find((m) => format(new Date(m.loggedAt), 'yyyy-MM-dd') === today);
      },

      setLastSynced: (type, timestamp) =>
        set((s) => ({ lastSyncedAt: { ...s.lastSyncedAt, [type]: timestamp } })),

      clearAll: () => set({ metrics: [], sleepLogs: [], foodLogs: [], moodLogs: [], lastSyncedAt: {} }),
    }),
    {
      name: 'forge-health',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
