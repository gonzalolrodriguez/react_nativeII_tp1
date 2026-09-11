import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit } from '@/types/habit';
import { getLocalDateString } from '@/utils/dateUtils';

const STORAGE_KEY = '@habits_data';

// Mocks iniciales de cortesía en caso de que el usuario inicie la app por primera vez
export const INITIAL_HABITS: Habit[] = [
  {
    id: '1',
    name: 'Tomar 2000 ml de agua',
    category: 'Salud',
    frequency: 'daily',
    color: '#06B6D4',
    icon: 'water',
    createdAt: '2026-08-01T08:00:00.000Z',
    completedDates: ['2026-08-15', '2026-08-16', '2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20'],
    currentStreak: 6,
    maxStreak: 12,
    isQuantitative: true,
    targetValue: 2000,
    unit: 'ml',
    unitProgress: { [getLocalDateString()]: 1250 },
    timeOfDay: 'mañana',
    reminderTime: '08:00',
    reminderEndTime: '09:00',
  },
  {
    id: '2',
    name: 'Leer 20 páginas de un libro',
    category: 'Estudio',
    frequency: 'daily',
    color: '#3B82F6',
    icon: 'book',
    createdAt: '2026-08-01T08:00:00.000Z',
    completedDates: ['2026-08-18', '2026-08-19', '2026-08-20'],
    currentStreak: 3,
    maxStreak: 8,
    isQuantitative: true,
    targetValue: 20,
    unit: 'págs',
    unitProgress: { [getLocalDateString()]: 10 },
    timeOfDay: 'noche',
    reminderTime: '21:30',
    reminderEndTime: '22:15',
  },
  {
    id: '3',
    name: 'Rutina de ejercicio 30 min',
    category: 'Deporte',
    frequency: 'daily',
    color: '#F59E0B',
    icon: 'fitness',
    createdAt: '2026-08-01T08:00:00.000Z',
    completedDates: ['2026-08-19', '2026-08-20'],
    currentStreak: 2,
    maxStreak: 5,
    isQuantitative: false,
    timeOfDay: 'tarde',
    reminderTime: '18:00',
    reminderEndTime: '18:45',
  },
];

/**
 * Repositorio de persistencia local en AsyncStorage (Patrón Repository)
 */
export const habitStorage = {
  loadHabits: async (): Promise<Habit[]> => {
    try {
      const rawData = await AsyncStorage.getItem(STORAGE_KEY);
      if (rawData) {
        return JSON.parse(rawData);
      }
      // Inicializar con hábitos mock si el storage está vacío
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_HABITS));
      return INITIAL_HABITS;
    } catch (error) {
      console.error('Error al cargar hábitos desde AsyncStorage', error);
      return INITIAL_HABITS;
    }
  },

  saveHabits: async (habits: Habit[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
    } catch (error) {
      console.error('Error al guardar hábitos en AsyncStorage', error);
      throw error;
    }
  },

  exportBackupJSON: async (): Promise<string> => {
    const habits = await habitStorage.loadHabits();
    return JSON.stringify(habits, null, 2);
  },

  importBackupJSON: async (jsonString: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al importar backup JSON', error);
      return false;
    }
  },

  clearAllHabits: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error al vaciar almacenamiento', error);
    }
  },
};
