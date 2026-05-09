import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit, HabitLog, HabitStreak } from '../types';
import { format, isToday, parseISO, differenceInDays, subDays } from 'date-fns';

interface HabitsState {
  habits: Habit[];
  logs: HabitLog[];
  streaks: Record<string, HabitStreak>;

  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  archiveHabit: (id: string) => void;

  logHabit: (habitId: string, date: string, completed: boolean, value?: number) => void;
  skipHabit: (habitId: string, date: string) => void;
  getLogForDate: (habitId: string, date: string) => HabitLog | undefined;
  getTodayLogs: () => HabitLog[];
  getLogsForDateRange: (habitId: string, startDate: string, endDate: string) => HabitLog[];

  computeStreak: (habitId: string) => HabitStreak;
  updateAllStreaks: () => void;

  getTodayHabits: () => Habit[];
  getCompletionRate: (habitId: string, days?: number) => number;
  clearAll: () => void;
}

const shouldShowToday = (habit: Habit): boolean => {
  if (!habit.isActive) return false;
  if (habit.frequency === 'daily') return true;
  if (habit.frequency === 'specific_days') {
    const dayOfWeek = new Date().getDay();
    return habit.daysOfWeek?.includes(dayOfWeek) ?? false;
  }
  return true;
};

export const useHabitsStore = create<HabitsState>()(
  persist(
    (set, get) => ({
      habits: [],
      logs: [],
      streaks: {},

      addHabit: (habit) => set((s) => ({ habits: [...s.habits, habit] })),

      updateHabit: (id, updates) =>
        set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)) })),

      deleteHabit: (id) =>
        set((s) => ({
          habits: s.habits.filter((h) => h.id !== id),
          logs: s.logs.filter((l) => l.habitId !== id),
        })),

      archiveHabit: (id) =>
        set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, isActive: false } : h)) })),

      logHabit: (habitId, date, completed, value) => {
        const existing = get().logs.find((l) => l.habitId === habitId && l.date === date);
        if (existing) {
          set((s) => ({
            logs: s.logs.map((l) =>
              l.habitId === habitId && l.date === date
                ? { ...l, completed, value, skipped: false, completedAt: completed ? Date.now() : undefined }
                : l
            ),
          }));
        } else {
          const log: HabitLog = {
            id: `log-${habitId}-${date}`,
            habitId,
            date,
            completed,
            skipped: false,
            value,
            completedAt: completed ? Date.now() : undefined,
          };
          set((s) => ({ logs: [...s.logs, log] }));
        }
        get().updateAllStreaks();
      },

      skipHabit: (habitId, date) => {
        const existing = get().logs.find((l) => l.habitId === habitId && l.date === date);
        if (existing) {
          set((s) => ({
            logs: s.logs.map((l) =>
              l.habitId === habitId && l.date === date
                ? { ...l, skipped: true, completed: false }
                : l
            ),
          }));
        } else {
          set((s) => ({
            logs: [
              ...s.logs,
              { id: `log-${habitId}-${date}`, habitId, date, completed: false, skipped: true },
            ],
          }));
        }
      },

      getLogForDate: (habitId, date) =>
        get().logs.find((l) => l.habitId === habitId && l.date === date),

      getTodayLogs: () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        return get().logs.filter((l) => l.date === today);
      },

      getLogsForDateRange: (habitId, startDate, endDate) =>
        get().logs.filter(
          (l) => l.habitId === habitId && l.date >= startDate && l.date <= endDate
        ),

      computeStreak: (habitId) => {
        const logs = get().logs.filter((l) => l.habitId === habitId && l.completed);
        const dateSet = new Set(logs.map((l) => l.date));

        let current = 0;
        let longest = 0;
        let lastCompletedDate: string | undefined;
        let streak = 0;
        let d = new Date();

        for (let i = 0; i < 365; i++) {
          const dateStr = format(subDays(d, i), 'yyyy-MM-dd');
          if (dateSet.has(dateStr)) {
            streak++;
            if (!lastCompletedDate) lastCompletedDate = dateStr;
            if (i === 0 || i === 1) {
              current = streak;
            }
          } else {
            if (streak > longest) longest = streak;
            if (i <= 1) current = 0;
            streak = 0;
            if (i > 1) break;
          }
        }
        if (streak > longest) longest = streak;

        return { habitId, current, longest, lastCompletedDate };
      },

      updateAllStreaks: () => {
        const habits = get().habits;
        const streaks: Record<string, HabitStreak> = {};
        habits.forEach((h) => {
          streaks[h.id] = get().computeStreak(h.id);
        });
        set({ streaks });
      },

      getTodayHabits: () => get().habits.filter(shouldShowToday),

      getCompletionRate: (habitId, days = 30) => {
        const endDate = format(new Date(), 'yyyy-MM-dd');
        const startDate = format(subDays(new Date(), days - 1), 'yyyy-MM-dd');
        const logs = get().getLogsForDateRange(habitId, startDate, endDate);
        const completed = logs.filter((l) => l.completed).length;
        return days > 0 ? completed / days : 0;
      },

      clearAll: () => set({ habits: [], logs: [], streaks: {} }),
    }),
    {
      name: 'forge-habits',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
