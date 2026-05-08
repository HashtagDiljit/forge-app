import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '../types';
import { format, isToday, isTomorrow, parseISO, isBefore, addDays } from 'date-fns';

interface TasksState {
  tasks: Task[];

  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  uncompleteTask: (id: string) => void;

  getTodayTasks: () => Task[];
  getUpcomingTasks: () => Task[];
  getAllActiveTasks: () => Task[];
  getOverdueTasks: () => Task[];
  clearAll: () => void;
}

export const useTasksStore = create<TasksState>()(
  persist(
    (set, get) => ({
      tasks: [],

      addTask: (task) => set((s) => ({ tasks: [...s.tasks, task] })),

      updateTask: (id, updates) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),

      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      completeTask: (id) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, completedAt: Date.now() } : t)) })),

      uncompleteTask: (id) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, completedAt: undefined } : t)) })),

      getTodayTasks: () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        return get().tasks.filter(
          (t) => !t.completedAt && (t.dueDate === today || (!t.dueDate && isToday(new Date(t.createdAt))))
        );
      },

      getUpcomingTasks: () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');
        return get().tasks.filter(
          (t) => !t.completedAt && t.dueDate && t.dueDate > today && t.dueDate <= nextWeek
        );
      },

      getAllActiveTasks: () => get().tasks.filter((t) => !t.completedAt),

      getOverdueTasks: () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        return get().tasks.filter((t) => !t.completedAt && t.dueDate && t.dueDate < today);
      },

      clearAll: () => set({ tasks: [] }),
    }),
    {
      name: 'forge-tasks',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
