export type HabitCategory = 'Salud' | 'Estudio' | 'Deporte' | 'Productividad' | 'Otro';

export type HabitFrequency = 'daily' | 'weekly' | 'custom';

export type TimeOfDay = 'mañana' | 'tarde' | 'noche' | 'cualquiera';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  customDays?: number[]; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  color?: string;
  icon?: string;
  createdAt: string; // ISO Date String
  completedDates: string[]; // ['YYYY-MM-DD', ...]
  currentStreak: number;
  maxStreak: number;
  // Funcionalidades offline avanzadas
  isQuantitative?: boolean;
  targetValue?: number;
  unit?: string;
  unitProgress?: { [date: string]: number }; // { '2026-08-21': 1500 }
  timeOfDay?: TimeOfDay;
  reminderTime?: string; // 'HH:MM' (inicio)
  reminderEndTime?: string; // 'HH:MM' (fin opcional)
  notes?: { [date: string]: string }; // { '2026-08-21': 'Gran sesión hoy' }
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  icon: string;
  condition: (habits: Habit[]) => boolean;
}

export interface AnalyticsTrendItem {
  dayLabel: string;
  dateStr: string;
  percentage: number;
}

export interface AnalyticsWeekdayItem {
  dayName: string;
  percentage: number;
}

export interface AnalyticsCategoryItem {
  category: string;
  count: number;
  percentage: number;
  color: string;
}

export interface AnalyticsData {
  weeklyTrend: AnalyticsTrendItem[];
  weekdayStats: AnalyticsWeekdayItem[];
  categoryDistribution: AnalyticsCategoryItem[];
  smartInsight: string;
}

export interface HabitFormData {
  name: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  customDays: number[];
  color: string;
  icon: string;
  isQuantitative: boolean;
  targetValue: number;
  unit: string;
  timeOfDay: TimeOfDay;
  reminderTime: string;
  reminderEndTime: string;
}
