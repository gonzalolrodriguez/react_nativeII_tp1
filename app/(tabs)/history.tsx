import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Platform, Dimensions, RefreshControl, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { habitsService, Habit, Achievement, getLocalDateString, isHabitScheduledForDate } from '@/services/habitsService';

export default function HistoryScreen() {
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
        return <View style={[styles.dayDot, { backgroundColor: '#30D158' }]} />;
      case 'partial':
        return <View style={[styles.dayDot, { backgroundColor: '#FF9F0A' }]} />;
      case 'zero':
        return <View style={[styles.dayDot, { backgroundColor: '#FF453A' }]} />;
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
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0A84FF" />
        <Text style={styles.loadingText}>Cargando historial...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#0A84FF"
            />
          }
        >
          <View style={styles.header}>
            <Text style={styles.subtitleText}>Progreso y medallas</Text>
            <Text style={styles.titleText}>Historial</Text>
          </View>

          {/* Resumen General */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.01)']}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.statValue}>{totalCompletedCount}</Text>
              <Text style={styles.statLabel} numberOfLines={1}>Completados</Text>
            </View>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.01)']}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.statValue}>🔥 {activeStreak}</Text>
              <Text style={styles.statLabel} numberOfLines={1}>Racha Max Hoy</Text>
            </View>
          </View>

          {/* Calendario Mensual */}
          <View style={styles.sectionCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.01)']}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle} numberOfLines={1}>Consistencia de {getMonthName()}</Text>
              <Ionicons name="calendar-outline" size={20} color="#8E8E93" />
            </View>

            {/* Días de la semana */}
            <View style={styles.weekLabelsContainer}>
              {weekdayLabels.map((label, index) => (
                <Text key={index} style={[styles.weekLabel, { width: COLUMN_WIDTH }]}>
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
                    <View style={[styles.dayNumberContainer, isToday && styles.todayContainer]}>
                      <Text style={[styles.dayNumber, isToday && styles.todayText]}>
                        {dayNum}
                      </Text>
                    </View>
                    {renderDayDot(status)}
                  </View>
                );
              })}
            </View>

            {/* Leyenda */}
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#30D158' }]} />
                <Text style={styles.legendText} numberOfLines={1}>Todo listo</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FF9F0A' }]} />
                <Text style={styles.legendText} numberOfLines={1}>Parcial</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FF453A' }]} />
                <Text style={styles.legendText} numberOfLines={1}>Sin hacer</Text>
              </View>
            </View>
          </View>

          {/* Sección de Logros */}
          <Text style={styles.sectionTitleOutside}>Logros Destacados</Text>
          <View style={isTabletOrWeb ? styles.achievementsGrid : styles.achievementsContainer}>
            {achievements.map((ach) => (
              <View
                key={ach.id}
                style={[
                  styles.achievementCard,
                  !ach.unlocked && styles.achievementCardLocked,
                  isTabletOrWeb && styles.achievementCardGridItem,
                ]}
              >
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.01)']}
                  style={StyleSheet.absoluteFillObject}
                />
                <View
                  style={[
                    styles.achievementIconContainer,
                    ach.unlocked ? styles.achievementIconUnlocked : styles.achievementIconLocked,
                  ]}
                >
                  <Text style={styles.achievementIcon}>{ach.icon}</Text>
                </View>
                <View style={styles.achievementInfo}>
                  <Text style={styles.achievementTitle} numberOfLines={1}>{ach.title}</Text>
                  <Text style={styles.achievementDescription} numberOfLines={2}>{ach.description}</Text>
                </View>
                <View style={styles.achievementStatus}>
                  {ach.unlocked ? (
                    <Ionicons name="checkmark-circle" size={24} color="#30D158" />
                  ) : (
                    <Ionicons name="lock-closed" size={20} color="#AEAEB2" />
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
    backgroundColor: '#0B0B0E',
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 1024,
    alignSelf: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 24 : 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  subtitleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 20, // Apple Squircle
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 8 },
        backgroundColor: 'rgba(15, 15, 20, 0.75)',
      },
      android: {
        elevation: 2,
        backgroundColor: 'rgba(15, 15, 20, 0.75)',
      },
      web: {
        backdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.2)',
      } as any,
    }),
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8E8E93',
  },
  sectionCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 8 },
        backgroundColor: 'rgba(15, 15, 20, 0.75)',
      },
      android: {
        elevation: 2,
        backgroundColor: 'rgba(15, 15, 20, 0.75)',
      },
      web: {
        backdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.2)',
      } as any,
    }),
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
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  weekLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  weekLabel: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  dayNumberContainer: {
    width: 24,
    height: 24,
    borderRadius: 12, // Standard circle
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  todayContainer: {
    backgroundColor: '#0A84FF',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  todayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 12,
    marginTop: 12,
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
    color: '#8E8E93',
    fontWeight: '400',
  },
  sectionTitleOutside: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: -0.4,
  },
  achievementsContainer: {
    gap: 12,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  achievementCardGridItem: {
    width: '48.5%', // Ocupa casi la mitad para dos columnas con gap
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20, // Apple Squircle
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 8 },
        backgroundColor: 'rgba(15, 15, 20, 0.75)',
      },
      android: {
        elevation: 2,
        backgroundColor: 'rgba(15, 15, 20, 0.75)',
      },
      web: {
        backdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.2)',
      } as any,
    }),
  },
  achievementCardLocked: {
    opacity: 0.4,
  },
  achievementIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12, // Squircle para controles internos
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  achievementIconUnlocked: {
    backgroundColor: 'rgba(255, 159, 10, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 10, 0.3)',
  },
  achievementIconLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  achievementIcon: {
    fontSize: 22,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 16,
  },
  achievementStatus: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0B0E',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
});
