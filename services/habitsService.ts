import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Habit {
  id: string;
  name: string;
  category: 'Salud' | 'Estudio' | 'Deporte' | 'Productividad' | 'Otro';
  frequency: 'daily' | 'weekly' | 'custom';
  customDays?: number[]; // 0 = Domingo, 1 = Lunes, etc.
  color?: string;
  icon?: string;
  createdAt: string; // ISO Date String
  completedDates: string[]; // ['YYYY-MM-DD', ...]
  currentStreak: number;
  maxStreak: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  icon: string; // Emoji o nombre de icono
  condition: (habits: Habit[]) => boolean;
}

const STORAGE_KEY = '@habits_data';

// Helper para obtener fecha local en formato YYYY-MM-DD
export const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Genera un rango de fechas en formato YYYY-MM-DD
const getDatesInRange = (startDateStr: string, endDateStr: string): string[] => {
  const dates: string[] = [];
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(getLocalDateString(new Date(d)));
  }
  return dates;
};

// Verifica si un hábito está programado para una fecha específica
export const isHabitScheduledForDate = (habit: Habit, dateStr: string): boolean => {
  const date = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Lunes, etc.
  
  if (habit.frequency === 'daily') {
    return true;
  }
  
  if (habit.frequency === 'weekly') {
    // Para semanal, por defecto es el mismo día de la semana que se creó
    const createdDay = new Date(habit.createdAt).getDay();
    return dayOfWeek === createdDay;
  }
  
  if (habit.frequency === 'custom' && habit.customDays) {
    return habit.customDays.includes(dayOfWeek);
  }
  
  return false;
};

// Retorna todas las fechas en las que un hábito estuvo activo/programado desde su creación hasta hoy
export const getScheduledDates = (habit: Habit, limitDateStr: string = getLocalDateString()): string[] => {
  const createdDateStr = habit.createdAt.split('T')[0];
  const allDates = getDatesInRange(createdDateStr, limitDateStr);
  return allDates.filter(d => isHabitScheduledForDate(habit, d));
};

// Recalcula la racha actual y máxima de un hábito
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
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  // Crear un hábito ficticio para reusar getScheduledDates
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

  // Obtener fechas programadas hasta hoy
  const scheduledDates = getScheduledDates(tempHabit, todayStr);
  
  if (scheduledDates.length === 0) {
    return { currentStreak: 0, maxStreak: 0 };
  }

  const completedSet = new Set(completedDates);
  
  // Calcular racha actual recorriendo hacia atrás
  let currentStreak = 0;
  let isStreakBroken = false;
  
  // Empezamos desde el final (hoy o el último día programado antes de hoy)
  for (let i = scheduledDates.length - 1; i >= 0; i--) {
    const dateStr = scheduledDates[i];
    const isCompleted = completedSet.has(dateStr);
    
    if (isCompleted) {
      currentStreak++;
    } else {
      // Si no está completado hoy, y hoy está programado, la racha aún no se rompe (el usuario tiene tiempo de completarlo hoy)
      if (dateStr === todayStr) {
        continue;
      }
      // Si no es hoy y no está completado, la racha se rompió
      isStreakBroken = true;
      break;
    }
  }
  
  // Calcular racha máxima recorriendo hacia adelante
  let maxStreak = 0;
  let runningStreak = 0;
  
  for (let i = 0; i < scheduledDates.length; i++) {
    const dateStr = scheduledDates[i];
    const isCompleted = completedSet.has(dateStr);
    
    if (isCompleted) {
      runningStreak++;
      if (runningStreak > maxStreak) {
        maxStreak = runningStreak;
      }
    } else {
      // Hoy sin completar no debería romper la racha máxima registrada previamente
      if (dateStr !== todayStr) {
        runningStreak = 0;
      }
    }
  }
  
  return { currentStreak, maxStreak };
};

// Generar mock de fechas para que el historial tenga contenido inicial atractivo
const generateMockCompletions = (daysAgo: number, frequency: Habit['frequency'], customDays?: number[], completionRate = 0.7): string[] => {
  const dates: string[] = [];
  const today = new Date();
  
  // Creamos un hábito mock temporal para usar las funciones de programación
  const mockHabit: Habit = {
    id: '',
    name: '',
    category: 'Otro',
    frequency,
    customDays,
    createdAt: new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    completedDates: [],
    currentStreak: 0,
    maxStreak: 0
  };
  
  const scheduled = getScheduledDates(mockHabit);
  
  scheduled.forEach((dateStr, idx) => {
    // Asegurar que completamos los últimos 3 días programados para simular una racha activa
    const isLastThree = idx >= scheduled.length - 3;
    const shouldComplete = isLastThree || Math.random() < completionRate;
    
    if (shouldComplete && dateStr !== getLocalDateString()) {
      dates.push(dateStr);
    }
  });
  
  return dates;
};

// Datos iniciales
const INITIAL_HABITS: Habit[] = [
  {
    id: 'habit-1',
    name: 'Meditar 10 minutos',
    category: 'Salud',
    frequency: 'daily',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 días atrás
    completedDates: [], // Se llenará abajo
    currentStreak: 0,
    maxStreak: 0
  },
  {
    id: 'habit-2',
    name: 'Estudiar React Native',
    category: 'Estudio',
    frequency: 'custom',
    customDays: [1, 3, 5], // Lunes, Miércoles, Viernes
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 días atrás
    completedDates: [],
    currentStreak: 0,
    maxStreak: 0
  },
  {
    id: 'habit-3',
    name: 'Ir al Gimnasio',
    category: 'Deporte',
    frequency: 'custom',
    customDays: [1, 2, 4, 5], // Lunes, Martes, Jueves, Viernes
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 días atrás
    completedDates: [],
    currentStreak: 0,
    maxStreak: 0
  }
];

// Inicializar fechas completadas para los mocks
INITIAL_HABITS[0].completedDates = generateMockCompletions(15, 'daily', undefined, 0.8);
INITIAL_HABITS[1].completedDates = generateMockCompletions(12, 'custom', [1, 3, 5], 0.9);
INITIAL_HABITS[2].completedDates = generateMockCompletions(20, 'custom', [1, 2, 4, 5], 0.6);

// Calcular rachas iniciales
INITIAL_HABITS.forEach(h => {
  const { currentStreak, maxStreak } = recalculateStreaks(h.completedDates, h.frequency, h.customDays, h.createdAt);
  h.currentStreak = currentStreak;
  h.maxStreak = maxStreak;
});

// Definición de logros del sistema
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach-1',
    title: 'Primer Paso',
    description: 'Crea tu primer hábito en el sistema',
    unlocked: false,
    icon: '🌱',
    condition: (habits) => habits.length > 0,
  },
  {
    id: 'ach-2',
    title: 'Constancia de Bronce',
    description: 'Alcanza una racha de 3 días en cualquier hábito',
    unlocked: false,
    icon: '🥉',
    condition: (habits) => habits.some(h => h.currentStreak >= 3),
  },
  {
    id: 'ach-3',
    title: 'Constancia de Plata',
    description: 'Alcanza una racha de 7 días en cualquier hábito',
    unlocked: false,
    icon: '🥈',
    condition: (habits) => habits.some(h => h.currentStreak >= 7),
  },
  {
    id: 'ach-4',
    title: 'Constancia de Oro',
    description: 'Alcanza una racha de 14 días en cualquier hábito',
    unlocked: false,
    icon: '🥇',
    condition: (habits) => habits.some(h => h.currentStreak >= 14),
  },
  {
    id: 'ach-5',
    title: 'Multidisciplinario',
    description: 'Ten al menos 3 hábitos activos al mismo tiempo',
    unlocked: false,
    icon: '⚡',
    condition: (habits) => habits.length >= 3,
  },
];

// Helper para delay de latencia artificial (500ms a 1000ms)
const simulateLatency = () => {
  const delay = Math.floor(Math.random() * (1000 - 500 + 1)) + 500;
  return new Promise(resolve => setTimeout(resolve, delay));
};

export const habitsService = {
  // Obtiene todos los hábitos
  fetchHabits: async (): Promise<Habit[]> => {
    await simulateLatency();
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) {
        // Si no hay datos guardados, inicializar con los mocks y guardarlos
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_HABITS));
        return INITIAL_HABITS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error fetching habits', e);
      return [];
    }
  },

  // Obtiene un hábito por su ID
  getHabitById: async (id: string): Promise<Habit | undefined> => {
    await simulateLatency();
    try {
      const habits = await habitsService.fetchHabits();
      return habits.find(h => h.id === id);
    } catch (e) {
      console.error('Error getting habit by id', e);
      return undefined;
    }
  },

  // Crea un nuevo hábito
  createHabit: async (habitData: Omit<Habit, 'id' | 'createdAt' | 'completedDates' | 'currentStreak' | 'maxStreak'>): Promise<Habit> => {
    await simulateLatency();
    try {
      const habits = await habitsService.fetchHabits();
      const newHabit: Habit = {
        ...habitData,
        id: `habit-${Date.now()}`,
        createdAt: new Date().toISOString(),
        completedDates: [],
        currentStreak: 0,
        maxStreak: 0
      };
      
      const updated = [...habits, newHabit];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return newHabit;
    } catch (e) {
      console.error('Error creating habit', e);
      throw e;
    }
  },

  // Actualiza un hábito existente
  updateHabit: async (id: string, updates: Partial<Omit<Habit, 'id' | 'createdAt' | 'completedDates' | 'currentStreak' | 'maxStreak'>>): Promise<Habit> => {
    await simulateLatency();
    try {
      const habits = await habitsService.fetchHabits();
      let updatedHabit!: Habit;
      
      const updated = habits.map(h => {
        if (h.id === id) {
          updatedHabit = { ...h, ...updates } as Habit;
          // Si cambia la frecuencia o días, recalculamos las rachas
          const { currentStreak, maxStreak } = recalculateStreaks(
            updatedHabit.completedDates,
            updatedHabit.frequency,
            updatedHabit.customDays,
            updatedHabit.createdAt
          );
          updatedHabit.currentStreak = currentStreak;
          updatedHabit.maxStreak = maxStreak;
          return updatedHabit;
        }
        return h;
      });
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updatedHabit;
    } catch (e) {
      console.error('Error updating habit', e);
      throw e;
    }
  },

  // Elimina un hábito
  deleteHabit: async (id: string): Promise<void> => {
    await simulateLatency();
    try {
      const habits = await habitsService.fetchHabits();
      const filtered = habits.filter(h => h.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error('Error deleting habit', e);
      throw e;
    }
  },

  // Marca/desmarca un hábito para una fecha determinada
  toggleHabitCompletion: async (id: string, dateStr: string): Promise<Habit> => {
    await simulateLatency();
    try {
      const habits = await habitsService.fetchHabits();
      let updatedHabit!: Habit;
      
      const updated = habits.map(h => {
        if (h.id === id) {
          const completedSet = new Set(h.completedDates);
          if (completedSet.has(dateStr)) {
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
          
          updatedHabit = {
            ...h,
            completedDates,
            currentStreak,
            maxStreak
          };
          return updatedHabit;
        }
        return h;
      });
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updatedHabit;
    } catch (e) {
      console.error('Error toggling habit completion', e);
      throw e;
    }
  },

  // Obtiene los logros desbloqueados y por desbloquear
  getAchievements: async (): Promise<Achievement[]> => {
    // No necesita latencia adicional ya que depende de fetchHabits que ya la tiene
    try {
      const habits = await habitsService.fetchHabits();
      return ACHIEVEMENTS.map(ach => {
        const isUnlocked = ach.condition(habits);
        return {
          ...ach,
          unlocked: isUnlocked,
          unlockedAt: isUnlocked ? new Date().toISOString() : undefined // Mock simple de fecha de desbloqueo
        };
      });
    } catch (e) {
      console.error('Error checking achievements', e);
      return ACHIEVEMENTS;
    }
  }
};
