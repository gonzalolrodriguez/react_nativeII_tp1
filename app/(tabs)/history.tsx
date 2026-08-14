import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, Platform, Dimensions, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { habitsService, Habit, Achievement, getLocalDateString, isHabitScheduledForDate } from '@/services/habitsService';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 40 - 24) / 7; // Ancho de celda para 7 días de la semana

export default function HistoryScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  // Obtener los nombres abreviados de los días
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
    
    // Si la fecha es en el futuro, no mostrar nada
    if (dateStr > todayStr) {
      return { scheduled: 0, completed: 0, status: 'future' };
    }

    let scheduled = 0;
    let completed = 0;

    habits.forEach(h => {
      // Solo contar si el hábito fue creado antes o en esta fecha
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

  // Renderizar indicador de color para el estado del día
  const renderDayDot = (status: string) => {
    switch (status) {
      case 'full':
        return <View style={[styles.dayDot, { backgroundColor: '#34C759' }]} />; // Verde
      case 'partial':
        return <View style={[styles.dayDot, { backgroundColor: '#FF9500' }]} />; // Naranja
      case 'zero':
        return <View style={[styles.dayDot, { backgroundColor: '#FF3B30' }]} />; // Rojo
      case 'none':
      default:
        return <View style={[styles.dayDot, { backgroundColor: 'transparent' }]} />;
    }
  };

  // Rellenar espacios vacíos al principio del mes para alinear los días de la semana
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
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando historial...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
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
            <Text style={styles.statValue}>{totalCompletedCount}</Text>
            <Text style={styles.statLabel}>Completados</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>🔥 {activeStreak}</Text>
            <Text style={styles.statLabel}>Racha Max Hoy</Text>
          </View>
        </View>

        {/* Calendario Mensual */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Consistencia de {getMonthName()}</Text>
            <Ionicons name="calendar-outline" size={20} color="#8E8E93" />
          </View>

          {/* Días de la semana */}
          <View style={styles.weekLabelsContainer}>
            {weekdayLabels.map((label, index) => (
              <Text key={index} style={styles.weekLabel}>
                {label}
              </Text>
            ))}
          </View>

          {/* Grilla del calendario */}
          <View style={styles.gridContainer}>
            {emptyCells.map((_, index) => (
              <View key={`empty-${index}`} style={styles.dayCell} />
            ))}
            {daysInMonth.map((day) => {
              const dayNum = day.getDate();
              const { status } = getDayStatus(day);
              const isToday = day.toDateString() === new Date().toDateString();

              return (
                <View key={`day-${dayNum}`} style={styles.dayCell}>
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
              <View style={[styles.legendDot, { backgroundColor: '#34C759' }]} />
              <Text style={styles.legendText}>Todo listo</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF9500' }]} />
              <Text style={styles.legendText}>Parcial</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF3B30' }]} />
              <Text style={styles.legendText}>Sin hacer</Text>
            </View>
          </View>
        </View>

        {/* Sección de Logros */}
        <Text style={styles.sectionTitleOutside}>Logros Destacados</Text>
        <View style={styles.achievementsContainer}>
          {achievements.map((ach) => (
            <View
              key={ach.id}
              style={[
                styles.achievementCard,
                !ach.unlocked && styles.achievementCardLocked,
              ]}
            >
              <View
                style={[
                  styles.achievementIconContainer,
                  ach.unlocked ? styles.achievementIconUnlocked : styles.achievementIconLocked,
                ]}
              >
                <Text style={styles.achievementIcon}>{ach.icon}</Text>
              </View>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>{ach.title}</Text>
                <Text style={styles.achievementDescription}>{ach.description}</Text>
              </View>
              <View style={styles.achievementStatus}>
                {ach.unlocked ? (
                  <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                ) : (
                  <Ionicons name="lock-closed" size={20} color="#AEAEB2" />
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
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
    fontWeight: '800',
    color: '#1C1C1E',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F2F2F7',
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
    color: '#1C1C1E',
    letterSpacing: -0.4,
  },
  weekLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  weekLabel: {
    width: COLUMN_WIDTH,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#AEAEB2',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: COLUMN_WIDTH,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  dayNumberContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  todayContainer: {
    backgroundColor: '#007AFF',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
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
    borderTopColor: '#F2F2F7',
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
    fontWeight: '500',
  },
  sectionTitleOutside: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
    letterSpacing: -0.4,
  },
  achievementsContainer: {
    gap: 12,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  achievementCardLocked: {
    opacity: 0.6,
  },
  achievementIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  achievementIconUnlocked: {
    backgroundColor: '#FFF9E6',
    borderWidth: 1,
    borderColor: '#FFE5B4',
  },
  achievementIconLocked: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
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
    color: '#1C1C1E',
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
    backgroundColor: '#F2F2F7',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
});
