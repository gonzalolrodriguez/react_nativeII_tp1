import { Habit, Achievement } from '@/types/habit';

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_step',
    title: 'Primer Paso',
    description: 'Completa tu primer hábito registrado.',
    icon: '🌱',
    unlocked: false,
    condition: (habits) => habits.some((h) => h.completedDates.length > 0),
  },
  {
    id: 'streak_7',
    title: 'En Racha (7 Días)',
    description: 'Consigue una racha de 7 días seguidos.',
    icon: '🔥',
    unlocked: false,
    condition: (habits) => habits.some((h) => h.currentStreak >= 7 || h.maxStreak >= 7),
  },
  {
    id: 'master',
    title: 'Maestro de la Rutina',
    description: 'Mantén 3 o más hábitos activos.',
    icon: '🏆',
    unlocked: false,
    condition: (habits) => habits.length >= 3,
  },
  {
    id: 'unbeatable',
    title: 'Invencible (30 Días)',
    description: 'Alcanza una racha de 30 días seguidos.',
    icon: '⚡',
    unlocked: false,
    condition: (habits) => habits.some((h) => h.maxStreak >= 30),
  },
];

/**
 * Evalúa los logros en función del estado actual de los hábitos.
 */
export const evaluateAchievements = (habits: Habit[]): Achievement[] => {
  return INITIAL_ACHIEVEMENTS.map((ach) => {
    const isUnlocked = ach.condition(habits);
    return {
      ...ach,
      unlocked: isUnlocked,
      unlockedAt: isUnlocked ? new Date().toISOString() : undefined,
    };
  });
};
