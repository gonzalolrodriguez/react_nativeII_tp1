import { Habit } from '@/types/habit';
import { getLocalDateString, getDatesInRange } from '@/utils/dateUtils';

/**
 * Verifica si un hábito está programado para una fecha específica.
 */
export const isHabitScheduledForDate = (habit: Habit, dateStr: string): boolean => {
  const date = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado

  if (habit.frequency === 'daily') {
    return true;
  }

  if (habit.frequency === 'weekly') {
    const createdDay = new Date(habit.createdAt).getDay();
    return dayOfWeek === createdDay;
  }

  if (habit.frequency === 'custom' && habit.customDays) {
    return habit.customDays.includes(dayOfWeek);
  }

  return false;
};

/**
 * Retorna todas las fechas en las que un hábito estuvo programado desde su creación hasta limitDateStr.
 */
export const getScheduledDates = (
  habit: Habit,
  limitDateStr: string = getLocalDateString()
): string[] => {
  const createdDateStr = habit.createdAt.split('T')[0];
  const allDates = getDatesInRange(createdDateStr, limitDateStr);
  return allDates.filter((d) => isHabitScheduledForDate(habit, d));
};

/**
 * Recalcula la racha actual y máxima de un hábito evaluando únicamente
 * los días en los que efectivamente estuvo programado.
 */
export const recalculateStreaks = (
  completedDates: string[],
  frequency: Habit['frequency'],
  customDays?: number[],
  createdAtStr?: string
): { currentStreak: number; maxStreak: number } => {
  if (completedDates.length === 0) {
    return { currentStreak: 0, maxStreak: 0 };
  }

  const todayStr = getLocalDateString();
  const tempHabit: Habit = {
    id: '',
    name: '',
    category: 'Otro',
    frequency,
    customDays,
    createdAt: createdAtStr || new Date().toISOString(),
    completedDates,
    currentStreak: 0,
    maxStreak: 0,
  };

  const scheduledDates = getScheduledDates(tempHabit, todayStr);

  if (scheduledDates.length === 0) {
    return { currentStreak: 0, maxStreak: 0 };
  }

  const completedSet = new Set(completedDates);
  let currentStreak = 0;

  // Evaluar racha actual hacia atrás desde el último día programado
  for (let i = scheduledDates.length - 1; i >= 0; i--) {
    const dateStr = scheduledDates[i];
    const isCompleted = completedSet.has(dateStr);

    if (isCompleted) {
      currentStreak++;
    } else {
      // Si el día no completado es hoy, la racha de días anteriores todavía no se rompe
      if (dateStr === todayStr) {
        continue;
      }
      break;
    }
  }

  // Evaluar racha máxima histórica hacia adelante
  let maxStreak = 0;
  let runningStreak = 0;

  for (let i = 0; i < scheduledDates.length; i++) {
    const dateStr = scheduledDates[i];
    if (completedSet.has(dateStr)) {
      runningStreak++;
      if (runningStreak > maxStreak) {
        maxStreak = runningStreak;
      }
    } else {
      runningStreak = 0;
    }
  }

  return { currentStreak, maxStreak };
};
