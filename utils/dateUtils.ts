/**
 * Utilidades puras para manejo de fechas, horarios y cálculos de intervalos
 */

// Obtiene la fecha local en formato YYYY-MM-DD
export const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Genera un rango inclusivo de fechas en formato YYYY-MM-DD
export const getDatesInRange = (startDateStr: string, endDateStr: string): string[] => {
  const dates: string[] = [];
  const start = new Date(startDateStr + 'T00:00:00');
  const end = new Date(endDateStr + 'T00:00:00');

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(getLocalDateString(new Date(d)));
  }
  return dates;
};

// Convierte 'HH:MM' a minutos desde la medianoche
export const timeToMinutes = (timeStr: string): number => {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
};

// Convierte minutos desde la medianoche a formato 'HH:MM'
export const minutesToTime = (totalMinutes: number): string => {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// Genera slots de horarios de 24hs en intervalos de minutos (default 15 mins)
export const generateTimeSlots = (intervalMinutes: number = 15): string[] => {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    const hStr = String(h).padStart(2, '0');
    for (let m = 0; m < 60; m += intervalMinutes) {
      const mStr = String(m).padStart(2, '0');
      slots.push(`${hStr}:${mStr}`);
    }
  }
  return slots;
};

export const TIME_SLOTS_15 = generateTimeSlots(15);

// Genera opciones para la hora de fin con duración relativa respecto a la hora de inicio (estilo Google Calendar)
export const generateEndTimeOptions = (
  startStr: string,
  slots: string[] = TIME_SLOTS_15
): { time: string; label: string }[] => {
  const startMins = timeToMinutes(startStr);
  return slots.map((slot) => {
    let diff = timeToMinutes(slot) - startMins;
    if (diff <= 0) {
      diff += 1440; // Día siguiente si es menor o igual
    }
    let durText = '';
    if (diff < 60) {
      durText = ` (${diff} min)`;
    } else {
      const hours = Math.floor(diff / 60);
      const remainingMins = diff % 60;
      durText = remainingMins === 0 ? ` (${hours} h)` : ` (${hours} h ${remainingMins} min)`;
    }
    return {
      time: slot,
      label: `${slot}${durText}`,
    };
  });
};

export const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const DAY_NAMES_SHORT_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const DAY_NAMES_FULL_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/**
 * Infiere el momento del día a partir de una hora en formato 'HH:MM'
 * - Mañana: 05:00 a 11:59
 * - Tarde: 12:00 a 18:59
 * - Noche: 19:00 a 04:59
 */
export const getTimeOfDayFromTime = (
  timeStr?: string
): 'mañana' | 'tarde' | 'noche' | 'cualquiera' => {
  if (!timeStr || !timeStr.includes(':')) return 'cualquiera';
  const hour = parseInt(timeStr.split(':')[0], 10);
  if (isNaN(hour)) return 'cualquiera';
  if (hour >= 5 && hour < 12) return 'mañana';
  if (hour >= 12 && hour < 19) return 'tarde';
  return 'noche';
};

/**
 * Obtiene el momento del día efectivo para un hábito:
 * Prioriza la asignación manual explícita (mañana, tarde, noche);
 * si es 'cualquiera' o indefinido pero tiene horario, lo deduce automáticamente por la hora.
 */
export const getEffectiveTimeOfDay = (habit: {
  timeOfDay?: string;
  reminderTime?: string;
}): 'mañana' | 'tarde' | 'noche' | 'cualquiera' => {
  if (habit.timeOfDay && habit.timeOfDay !== 'cualquiera') {
    return habit.timeOfDay as 'mañana' | 'tarde' | 'noche' | 'cualquiera';
  }
  if (habit.reminderTime) {
    return getTimeOfDayFromTime(habit.reminderTime);
  }
  return 'cualquiera';
};
