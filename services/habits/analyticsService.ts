import { Habit, AnalyticsData } from '@/types/habit';
import { getLocalDateString, DAY_NAMES_SHORT_ES, DAY_NAMES_FULL_ES } from '@/utils/dateUtils';
import { isHabitScheduledForDate } from './streakCalculator';

const CATEGORY_COLORS_MAP: Record<string, string> = {
  Salud: '#10B981',
  Estudio: '#3B82F6',
  Deporte: '#F59E0B',
  Productividad: '#8B5CF6',
  Otro: '#EC4899',
};

/**
 * Calcula las métricas analíticas avanzadas para el usuario (100% offline).
 */
export const calculateAnalyticsData = (habits: Habit[]): AnalyticsData => {
  const today = new Date();

  // 1. Tendencia semanal (últimos 7 días)
  const weeklyTrend: AnalyticsData['weeklyTrend'] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = getLocalDateString(d);
    const dayLabel = DAY_NAMES_SHORT_ES[d.getDay()];

    let scheduledCount = 0;
    let completedCount = 0;

    habits.forEach((h) => {
      if (isHabitScheduledForDate(h, dateStr)) {
        scheduledCount++;
        if (h.completedDates.includes(dateStr)) {
          completedCount++;
        }
      }
    });

    const percentage = scheduledCount > 0 ? Math.round((completedCount / scheduledCount) * 100) : 0;
    weeklyTrend.push({ dayLabel, dateStr, percentage });
  }

  // 2. Estadísticas por día de la semana (Lunes a Domingo)
  const weekdayStatsMap = Array(7)
    .fill(0)
    .map(() => ({ scheduled: 0, completed: 0 }));

  habits.forEach((h) => {
    h.completedDates.forEach((dateStr) => {
      const date = new Date(dateStr + 'T00:00:00');
      const dayIdx = date.getDay(); // 0 = Dom, 1 = Lun, etc.
      weekdayStatsMap[dayIdx].completed++;
    });
  });

  const maxCompletedDay = weekdayStatsMap.reduce(
    (maxIdx, curr, idx, arr) => (curr.completed > arr[maxIdx].completed ? idx : maxIdx),
    1
  );

  // Ordenamos de Lunes (1) a Domingo (0)
  const weekdayStats: AnalyticsData['weekdayStats'] = [1, 2, 3, 4, 5, 6, 0].map((dayIdx) => {
    const completed = weekdayStatsMap[dayIdx].completed;
    const percentage =
      habits.length > 0 ? Math.min(100, Math.round((completed / (habits.length * 4 || 1)) * 100)) : 0;
    return {
      dayName: DAY_NAMES_FULL_ES[dayIdx].slice(0, 3),
      percentage,
    };
  });

  // 3. Distribución por categoría
  const categoryCounts: Record<string, number> = {};
  const totalHabitCount = habits.length;

  habits.forEach((h) => {
    categoryCounts[h.category] = (categoryCounts[h.category] || 0) + 1;
  });

  const categoryDistribution: AnalyticsData['categoryDistribution'] = Object.keys(categoryCounts).map(
    (cat) => ({
      category: cat,
      count: categoryCounts[cat],
      percentage: totalHabitCount > 0 ? Math.round((categoryCounts[cat] / totalHabitCount) * 100) : 0,
      color: CATEGORY_COLORS_MAP[cat] || '#6366F1',
    })
  );

  // 4. Insight inteligente generado automáticamente
  let smartInsight = 'Tus hábitos están listos. ¡Completa tus metas de hoy para ver tus estadísticas crecer!';
  if (habits.length > 0) {
    const topDayName = DAY_NAMES_FULL_ES[maxCompletedDay];
    const avgWeeklyPct = Math.round(
      weeklyTrend.reduce((acc, curr) => acc + curr.percentage, 0) / 7
    );

    smartInsight = `Tu día de mayor consistencia es el ${topDayName}. Tu promedio de efectividad semanal actual es del ${avgWeeklyPct}%.`;
  }

  return {
    weeklyTrend,
    weekdayStats,
    categoryDistribution,
    smartInsight,
  };
};
