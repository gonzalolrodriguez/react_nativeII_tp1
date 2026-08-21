import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Platform, RefreshControl, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { habitsService, Habit, Achievement, getLocalDateString, isHabitScheduledForDate } from '@/services/habitsService';
import { useTheme } from '@/context/ThemeContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function HistoryScreen() {
  const { colors } = useTheme();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Obtener dimensiones de la ventana para comportamiento responsivo
  const { width } = useWindowDimensions();
  const isTabletOrWeb = width > 768;
  const COLUMN_WIDTH = (Math.min(width, 1024) - (isTabletOrWeb ? 48 : 32) - 24) / 7;

  const loadData = useCallback(async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) setLoading(true);
    try {
      const allHabits = await habitsService.fetchHabits();
      const allAchievements = await habitsService.getAchievements();
      setHabits(allHabits);
      setAchievements(allAchievements);
    } catch (error) {
      console.error('Error loading history data', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData(habits.length === 0);
    }, [loadData, habits.length])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(false);
  };

  // Obtener los días del mes actual
  const getDaysInCurrentMonth = (): Date[] => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const numDays = new Date(year, month + 1, 0).getDate();

    const days: Date[] = [];
    for (let i = 1; i <= numDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getMonthName = () => {
    const today = new Date();
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[today.getMonth()];
  };

  const daysInMonth = getDaysInCurrentMonth();
  const weekdayLabels = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

  // Calcular el estado de un día determinado para todos los hábitos
  const getDayStatus = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const todayStr = getLocalDateString();
    
    if (dateStr > todayStr) {
      return { scheduled: 0, completed: 0, status: 'future' };
    }

    let scheduled = 0;
    let completed = 0;

    habits.forEach(h => {
      const habitCreatedStr = h.createdAt.split('T')[0];
      if (habitCreatedStr <= dateStr) {
        const isScheduled = isHabitScheduledForDate(h, dateStr);
        if (isScheduled) {
          scheduled++;
          if (h.completedDates.includes(dateStr)) {
            completed++;
          }
        }
      }
    });

    if (scheduled === 0) return { scheduled, completed, status: 'none' };
    if (completed === scheduled) return { scheduled, completed, status: 'full' };
    if (completed > 0) return { scheduled, completed, status: 'partial' };
    return { scheduled, completed, status: 'zero' };
  };

  const renderDayDot = (status: string) => {
    switch (status) {
      case 'full':
        return <View style={[styles.dayDot, { backgroundColor: colors.success }]} />;
      case 'partial':
        return <View style={[styles.dayDot, { backgroundColor: colors.warning }]} />;
      case 'zero':
        return <View style={[styles.dayDot, { backgroundColor: colors.danger }]} />;
      default:
        return <View style={[styles.dayDot, { backgroundColor: 'transparent' }]} />;
    }
  };

  const firstDayOfMonthIndex = new Date(
    daysInMonth[0].getFullYear(),
    daysInMonth[0].getMonth(),
    1
  ).getDay();

  const emptyCells = Array(firstDayOfMonthIndex).fill(null);

  // Estadísticas globales básicas
  const totalCompletedCount = habits.reduce((acc, h) => acc + h.completedDates.length, 0);
  const activeStreak = habits.length > 0 ? Math.max(...habits.map(h => h.currentStreak)) : 0;

  if (loading && habits.length === 0) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Cargando historial...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.contentWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
            />
          }
        >
          <View style={styles.header}>
            <View>
              <Text style={[styles.subtitleText, { color: colors.textMuted }]}>Progreso y medallas</Text>
              <Text style={[styles.titleText, { color: colors.textPrimary }]}>Historial</Text>
            </View>
            <ThemeToggle />
          </View>

          {/* Resumen General */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <LinearGradient
                colors={[colors.accent + '15', colors.cardBg]}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{totalCompletedCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]} numberOfLines={1}>Completados</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <LinearGradient
                colors={['#F59E0B15', colors.cardBg]}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>🔥 {activeStreak}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]} numberOfLines={1}>Racha Máx Hoy</Text>
            </View>
          </View>

          {/* Calendario Mensual */}
          <View style={[styles.sectionCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                Consistencia de {getMonthName()}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
            </View>

            {/* Días de la semana */}
            <View style={styles.weekLabelsContainer}>
              {weekdayLabels.map((label, index) => (
                <Text key={index} style={[styles.weekLabel, { width: COLUMN_WIDTH, color: colors.textMuted }]}>
                  {label}
                </Text>
              ))}
            </View>

            {/* Grilla del calendario */}
            <View style={styles.gridContainer}>
              {emptyCells.map((_, index) => (
                <View key={`empty-${index}`} style={[styles.dayCell, { width: COLUMN_WIDTH }]} />
              ))}
              {daysInMonth.map((day) => {
                const dayNum = day.getDate();
                const { status } = getDayStatus(day);
                const isToday = day.toDateString() === new Date().toDateString();

                return (
                  <View key={`day-${dayNum}`} style={[styles.dayCell, { width: COLUMN_WIDTH }]}>
                    <View
                      style={[
                        styles.dayNumberContainer,
                        isToday && { backgroundColor: colors.accent },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayNumber,
                          { color: isToday ? '#FFFFFF' : colors.textPrimary },
                        ]}
                      >
                        {dayNum}
                      </Text>
                    </View>
                    {renderDayDot(status)}
                  </View>
                );
              })}
            </View>

            {/* Leyenda */}
            <View style={[styles.legendContainer, { borderTopColor: colors.cardBorder }]}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.legendText, { color: colors.textMuted }]} numberOfLines={1}>Todo listo</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
                <Text style={[styles.legendText, { color: colors.textMuted }]} numberOfLines={1}>Parcial</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
                <Text style={[styles.legendText, { color: colors.textMuted }]} numberOfLines={1}>Sin hacer</Text>
              </View>
            </View>
          </View>

          {/* Sección de Logros */}
          <View style={styles.achievementsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Logros e Insignias</Text>
            <Text style={[styles.achievementsCount, { color: colors.accent }]}>
              {achievements.filter(a => a.unlocked).length} de {achievements.length}
            </Text>
          </View>

          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => (
              <View
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: achievement.unlocked ? colors.accent + '60' : colors.cardBorder,
                    opacity: achievement.unlocked ? 1 : 0.6,
                  },
                ]}
              >
                <View
                  style={[
                    styles.achievementIconBg,
                    {
                      backgroundColor: achievement.unlocked ? colors.accent + '20' : colors.chipBg,
                    },
                  ]}
                >
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                </View>
                <View style={styles.achievementInfo}>
                  <Text style={[styles.achievementTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                    {achievement.title}
                  </Text>
                  <Text style={[styles.achievementDesc, { color: colors.textMuted }]} numberOfLines={2}>
                    {achievement.description}
                  </Text>
                  {achievement.unlocked && achievement.unlockedAt && (
                    <Text style={[styles.unlockedDate, { color: colors.success }]} numberOfLines={1}>
                      ✓ Desbloqueado {achievement.unlockedAt}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 1024,
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 24 : 16,
    paddingBottom: 16,
  },
  subtitleText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  titleText: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  sectionCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  weekLabelsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekLabel: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: '600',
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  achievementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  achievementsCount: {
    fontSize: 14,
    fontWeight: '700',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    width: '48%',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
  },
  achievementIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  achievementIcon: {
    fontSize: 22,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  achievementDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 6,
  },
  unlockedDate: {
    fontSize: 11,
    fontWeight: '600',
  },
});
