import { Habit, Achievement, AnalyticsData } from '@/types/habit';
import { getLocalDateString } from '@/utils/dateUtils';
import {
  isHabitScheduledForDate,
  getScheduledDates,
  recalculateStreaks,
} from './habits/streakCalculator';
import { evaluateAchievements } from './habits/achievementsService';
import { calculateAnalyticsData } from './habits/analyticsService';
import { habitStorage } from './storage/habitStorage';
import { notificationService } from './notifications/notificationService';

// Re-exportar tipos para compatibilidad total con el código existente
export type { Habit, Achievement, AnalyticsData };
export { getLocalDateString, isHabitScheduledForDate, getScheduledDates, recalculateStreaks };

const simulateLatency = async (ms: number = 100) => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * FAÇADE PATTERN: Punto de entrada unificado para operaciones sobre hábitos.
 * Coordina almacenamiento (Storage), lógica de dominio (Streaks & Analytics) y Notificaciones nativas.
 */
export const habitsService = {
  fetchHabits: async (): Promise<Habit[]> => {
    await simulateLatency();
    return await habitStorage.loadHabits();
  },

  getHabitById: async (id: string): Promise<Habit | undefined> => {
    const habits = await habitsService.fetchHabits();
    return habits.find((h) => h.id === id);
  },

  createHabit: async (
    habitData: Omit<Habit, 'id' | 'createdAt' | 'completedDates' | 'currentStreak' | 'maxStreak'>
  ): Promise<Habit> => {
    await simulateLatency();
    try {
      const habits = await habitsService.fetchHabits();
      const newHabit: Habit = {
        ...habitData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        completedDates: [],
        currentStreak: 0,
        maxStreak: 0,
        unitProgress: {},
        notes: {},
      };

      const updated = [newHabit, ...habits];
      await habitStorage.saveHabits(updated);

      // Programar recordatorio local offline si tiene horario configurado
      if (newHabit.reminderTime) {
        try {
          await notificationService.scheduleHabitReminder(newHabit);
        } catch (notifErr) {
          console.warn('Recordatorio no programado:', notifErr);
        }
      }

      return newHabit;
    } catch (e) {
      console.error('Error al crear hábito en habitsService', e);
      throw e;
    }
  },

  updateHabit: async (id: string, habitData: Partial<Habit>): Promise<Habit> => {
    await simulateLatency();
    try {
      const habits = await habitsService.fetchHabits();
      let updatedHabit!: Habit;

      const updated = habits.map((h) => {
        if (h.id === id) {
          updatedHabit = { ...h, ...habitData };
          return updatedHabit;
        }
        return h;
      });

      await habitStorage.saveHabits(updated);

      // Sincronizar recordatorio local en el dispositivo
      try {
        if (updatedHabit.reminderTime) {
          await notificationService.scheduleHabitReminder(updatedHabit);
        } else {
          await notificationService.cancelHabitReminder(id);
        }
      } catch (notifErr) {
        console.warn('Error sincronizando recordatorio:', notifErr);
      }

      return updatedHabit;
    } catch (e) {
      console.error('Error al actualizar hábito en habitsService', e);
      throw e;
    }
  },

  deleteHabit: async (id: string): Promise<void> => {
    await simulateLatency();
    try {
      const habits = await habitsService.fetchHabits();
      const filtered = habits.filter((h) => h.id !== id);
      await habitStorage.saveHabits(filtered);

      // Cancelar recordatorios asociados en el sistema operativo
      try {
        await notificationService.cancelHabitReminder(id);
      } catch (notifErr) {
        console.warn('Error cancelando recordatorio:', notifErr);
      }
    } catch (e) {
      console.error('Error al eliminar hábito en habitsService', e);
      throw e;
    }
  },

  toggleHabitCompletion: async (id: string, dateStr: string): Promise<Habit> => {
    await simulateLatency();
    try {
      const habits = await habitsService.fetchHabits();
      let updatedHabit!: Habit;

      const updated = habits.map((h) => {
        if (h.id === id) {
          const completedSet = new Set(h.completedDates);
          const isCurrentlyCompleted = completedSet.has(dateStr);

          if (isCurrentlyCompleted) {
            completedSet.delete(dateStr);
          } else {
            completedSet.add(dateStr);
          }

          const completedDates = Array.from(completedSet);
          const { currentStreak, maxStreak } = recalculateStreaks(
            completedDates,
            h.frequency,
            h.customDays,
            h.createdAt
          );

          // Si es cuantitativo y se marca como completado, llenar el unitProgress al objetivo
          const unitProgress = { ...(h.unitProgress || {}) };
          if (h.isQuantitative && h.targetValue) {
            unitProgress[dateStr] = !isCurrentlyCompleted ? h.targetValue : 0;
          }

          updatedHabit = {
            ...h,
            completedDates,
            currentStreak,
            maxStreak,
            unitProgress,
          };
          return updatedHabit;
        }
        return h;
      });

      await habitStorage.saveHabits(updated);
      return updatedHabit;
    } catch (e) {
      console.error('Error al cambiar completado de hábito', e);
      throw e;
    }
  },

  updateQuantitativeProgress: async (id: string, dateStr: string, delta: number): Promise<Habit> => {
    await simulateLatency();
    try {
      const habits = await habitsService.fetchHabits();
      let updatedHabit!: Habit;

      const updated = habits.map((h) => {
        if (h.id === id) {
          const target = h.targetValue || 100;
          const currentVal = (h.unitProgress && h.unitProgress[dateStr]) || 0;
          const newVal = Math.max(0, currentVal + delta);

          const unitProgress = { ...(h.unitProgress || {}), [dateStr]: newVal };
          const completedSet = new Set(h.completedDates);

          if (newVal >= target) {
            completedSet.add(dateStr);
          } else {
            completedSet.delete(dateStr);
          }

          const completedDates = Array.from(completedSet);
          const { currentStreak, maxStreak } = recalculateStreaks(
            completedDates,
            h.frequency,
            h.customDays,
            h.createdAt
          );

          updatedHabit = {
            ...h,
            unitProgress,
            completedDates,
            currentStreak,
            maxStreak,
          };
          return updatedHabit;
        }
        return h;
      });

      await habitStorage.saveHabits(updated);
      return updatedHabit;
    } catch (e) {
      console.error('Error al actualizar progreso cuantitativo', e);
      throw e;
    }
  },

  saveHabitNote: async (id: string, dateStr: string, noteText: string): Promise<Habit> => {
    await simulateLatency();
    try {
      const habits = await habitsService.fetchHabits();
      let updatedHabit!: Habit;

      const updated = habits.map((h) => {
        if (h.id === id) {
          const notes = { ...(h.notes || {}), [dateStr]: noteText.trim() };
          updatedHabit = { ...h, notes };
          return updatedHabit;
        }
        return h;
      });

      await habitStorage.saveHabits(updated);
      return updatedHabit;
    } catch (e) {
      console.error('Error al guardar nota del hábito', e);
      throw e;
    }
  },

  getAchievements: async (): Promise<Achievement[]> => {
    try {
      const habits = await habitsService.fetchHabits();
      return evaluateAchievements(habits);
    } catch (e) {
      console.error('Error al evaluar logros', e);
      return [];
    }
  },

  getAnalyticsData: async (): Promise<AnalyticsData> => {
    const habits = await habitsService.fetchHabits();
    return calculateAnalyticsData(habits);
  },

  exportBackupJSON: async (): Promise<string> => {
    return await habitStorage.exportBackupJSON();
  },

  importBackupJSON: async (jsonString: string): Promise<boolean> => {
    const success = await habitStorage.importBackupJSON(jsonString);
    if (success) {
      // Sincronizar recordatorios de los hábitos recién importados
      const habits = await habitStorage.loadHabits();
      await notificationService.syncAllHabitReminders(habits);
    }
    return success;
  },
};
