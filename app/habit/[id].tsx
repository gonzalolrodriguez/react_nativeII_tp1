import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Alert, useWindowDimensions } from 'react-native';
import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { habitsService, Habit, getLocalDateString, isHabitScheduledForDate, getScheduledDates } from '@/services/habitsService';
import { getEffectiveTimeOfDay } from '@/utils/dateUtils';
import { useTheme } from '@/context/ThemeContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [loading, setLoading] = useState(true);

  // Obtener dimensiones de la pantalla
  const { width } = useWindowDimensions();
  const isTabletOrWeb = width > 768;
  const COLUMN_WIDTH = (Math.min(width, 1024) - (isTabletOrWeb ? 48 : 32) - 60) / 7;

  const loadHabit = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await habitsService.getHabitById(id);
      if (data) {
        setHabit(data);
      } else {
        router.back();
      }
    } catch (error) {
      console.error('Error loading habit detail', error);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useFocusEffect(
    useCallback(() => {
      loadHabit();
    }, [loadHabit])
  );

  const handleEdit = () => {
    if (habit) {
      router.push({
        pathname: '/habit/manage',
        params: { id: habit.id },
      });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Hábito',
      '¿Estás seguro de que querés eliminar este hábito? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (id) {
              try {
                await habitsService.deleteHabit(id);
                router.replace('/(tabs)');
              } catch (e) {
                console.error(e);
              }
            }
          },
        },
      ]
    );
  };

  if (loading && !habit) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Cargando detalle...</Text>
      </View>
    );
  }

  if (!habit) return null;

  const habitColor = habit.color || colors.accent;

  // Generar días del mes actual
  const getDaysInCurrentMonth = (): Date[] => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const numDays = new Date(year, month + 1, 0).getDate();

    const daysList: Date[] = [];
    for (let i = 1; i <= numDays; i++) {
      daysList.push(new Date(year, month, i));
    }
    return daysList;
  };

  const days = getDaysInCurrentMonth();
  const weekdayLabels = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

  // Estadísticas avanzadas
  const scheduledUntilToday = getScheduledDates(habit);
  const totalScheduledDays = scheduledUntilToday.length;
  const totalCompletedDays = habit.completedDates.length;

  const monthCompletionRate = totalScheduledDays > 0
    ? Math.round((totalCompletedDays / totalScheduledDays) * 100)
    : 0;

  const firstDayOfMonthIndex = new Date(
    days[0].getFullYear(),
    days[0].getMonth(),
    1
  ).getDay();

  const emptyCells = Array(firstDayOfMonthIndex).fill(null);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: habit.name,
          headerBackTitle: 'Atrás',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.textPrimary, fontWeight: '700' },
          headerTintColor: colors.accent,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <ThemeToggle />
              <Pressable onPress={handleEdit} style={styles.headerIconButton}>
                <Ionicons name="create-outline" size={22} color={colors.accent} />
              </Pressable>
            </View>
          ),
        }}
      />

      <View style={styles.contentWrapper}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Tarjeta Principal del Hábito */}
          <View style={[styles.mainCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <LinearGradient
              colors={[habitColor + '20', colors.cardBg]}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.mainCardHeader}>
              <View style={[styles.iconCircle, { backgroundColor: habitColor + '25', borderColor: habitColor + '50' }]}>
                <Ionicons name={(habit.icon as any) || 'sparkles'} size={28} color={habitColor} />
              </View>
              <View style={styles.titleContainer}>
                <Text style={[styles.habitTitle, { color: colors.textPrimary }]}>{habit.name}</Text>
                <View style={styles.badgeRow}>
                  <View style={[styles.categoryBadge, { backgroundColor: habitColor + '20' }]}>
                    <Text style={[styles.categoryText, { color: habitColor }]}>{habit.category}</Text>
                  </View>

                  {(() => {
                    const effectiveTod = getEffectiveTimeOfDay(habit);
                    const todLabel =
                      effectiveTod === 'mañana'
                        ? '🌅 Mañana'
                        : effectiveTod === 'tarde'
                        ? '☀️ Tarde'
                        : effectiveTod === 'noche'
                        ? '🌙 Noche'
                        : null;
                    return todLabel ? (
                      <View style={[styles.categoryBadge, { backgroundColor: colors.chipBg }]}>
                        <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
                          {todLabel}
                        </Text>
                      </View>
                    ) : null;
                  })()}

                  {habit.reminderTime && (
                    <View style={[styles.categoryBadge, { backgroundColor: colors.chipBg }]}>
                      <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
                        ⏰ {habit.reminderTime}
                      </Text>
                    </View>
                  )}

                  <Text style={[styles.frequencyText, { color: colors.textMuted }]}>
                    {habit.frequency === 'daily' ? 'Diario' : habit.frequency === 'weekly' ? 'Semanal' : 'Personalizado'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Grilla de Métricas y Rachas */}
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <Text style={styles.metricEmoji}>🔥</Text>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{habit.currentStreak}</Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Racha Actual</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <Text style={styles.metricEmoji}>🏆</Text>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{habit.maxStreak}</Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Mejor Racha</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <Text style={styles.metricEmoji}>⚡</Text>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{monthCompletionRate}%</Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Efectividad</Text>
            </View>
          </View>

          {/* Matriz de Consistencia Mensual */}
          <View style={[styles.matrixCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Text style={[styles.matrixTitle, { color: colors.textPrimary }]}>Matriz de Consistencia (30 días)</Text>
            <Text style={[styles.matrixSubtitle, { color: colors.textMuted }]}>
              Seguimiento diario de cumplimiento del mes actual
            </Text>

            <View style={styles.weekLabelsRow}>
              {weekdayLabels.map((w, idx) => (
                <Text key={idx} style={[styles.weekLabelText, { width: COLUMN_WIDTH, color: colors.textMuted }]}>
                  {w}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {emptyCells.map((_, idx) => (
                <View key={`empty-${idx}`} style={[styles.daySquare, { width: COLUMN_WIDTH, height: COLUMN_WIDTH }]} />
              ))}
              {days.map((date) => {
                const dateStr = getLocalDateString(date);
                const isScheduled = isHabitScheduledForDate(habit, dateStr);
                const isCompleted = habit.completedDates.includes(dateStr);
                const todayStr = getLocalDateString();
                const isFuture = dateStr > todayStr;

                let cellBg = colors.chipBg;
                let borderColor = colors.cardBorder;

                if (isCompleted) {
                  cellBg = habitColor;
                  borderColor = habitColor;
                } else if (isScheduled && !isFuture) {
                  cellBg = colors.danger + '25';
                  borderColor = colors.danger + '40';
                }

                return (
                  <View
                    key={dateStr}
                    style={[
                      styles.daySquare,
                      {
                        width: COLUMN_WIDTH,
                        height: COLUMN_WIDTH,
                        backgroundColor: cellBg,
                        borderColor,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumberText,
                        { color: isCompleted ? '#FFFFFF' : isFuture ? colors.textMuted : colors.textPrimary },
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Botones de Acción (Editar / Eliminar) */}
          <View style={styles.actionButtonsRow}>
            <Pressable
              onPress={handleEdit}
              style={[styles.editButton, { backgroundColor: colors.chipBg, borderColor: colors.cardBorder }]}
            >
              <Ionicons name="pencil" size={18} color={colors.accent} style={{ marginRight: 8 }} />
              <Text style={[styles.editButtonText, { color: colors.accent }]}>Editar Hábito</Text>
            </Pressable>

            <Pressable
              onPress={handleDelete}
              style={[styles.deleteButton, { backgroundColor: colors.danger + '18', borderColor: colors.danger + '40' }]}
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} style={{ marginRight: 8 }} />
              <Text style={[styles.deleteButtonText, { color: colors.danger }]}>Eliminar</Text>
            </Pressable>
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
  },
  loadingText: {
    fontSize: 16,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCard: {
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden',
  },
  mainCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  titleContainer: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  frequencyText: {
    fontSize: 13,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  metricEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  matrixCard: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    marginBottom: 24,
  },
  matrixTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  matrixSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  weekLabelsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekLabelText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  daySquare: {
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
