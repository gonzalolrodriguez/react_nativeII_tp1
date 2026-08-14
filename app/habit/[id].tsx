import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Alert, Platform, useWindowDimensions } from 'react-native';
import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { habitsService, Habit, getLocalDateString, isHabitScheduledForDate, getScheduledDates } from '@/services/habitsService';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
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
        params: { id: habit.id }
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
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando detalle...</Text>
      </View>
    );
  }

  if (!habit) return null;

  // Generar días del mes actual
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

  const days = getDaysInCurrentMonth();
  const todayStr = getLocalDateString();
  const currentMonthName = () => {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[new Date().getMonth()];
  };

  // Calcular las estadísticas del mes actual
  const getMonthlyStats = () => {
    const startOfMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const habitCreatedStr = habit.createdAt.split('T')[0];
    const initialDateStr = habitCreatedStr > startOfMonthStr ? habitCreatedStr : startOfMonthStr;
    
    const scheduledThisMonth = getScheduledDates(habit, todayStr).filter(d => d >= initialDateStr);
    const completedThisMonth = scheduledThisMonth.filter(d => habit.completedDates.includes(d));
    
    const percentage = scheduledThisMonth.length > 0 
      ? Math.round((completedThisMonth.length / scheduledThisMonth.length) * 100) 
      : 0;

    return {
      scheduled: scheduledThisMonth.length,
      completed: completedThisMonth.length,
      percentage
    };
  };

  const stats = getMonthlyStats();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: habit.name,
          headerBackTitle: 'Atrás',
          headerRight: () => (
            <Pressable onPress={handleEdit} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>Editar</Text>
            </Pressable>
          ),
          headerStyle: {
            backgroundColor: '#0B0B0E',
          },
          headerTitleStyle: {
            color: '#FFFFFF',
            fontWeight: '600',
          },
          headerShadowVisible: false,
          headerTintColor: '#0A84FF',
        }}
      />
      <View style={styles.contentWrapper}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Panel de Estadísticas */}
          <View style={styles.statsPanel}>
            <View style={styles.statBox}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.01)']}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.statValue}>🔥 {habit.currentStreak}</Text>
              <Text style={styles.statTitle} numberOfLines={1}>Racha Actual</Text>
              <Text style={styles.statDesc} numberOfLines={1}>
                {habit.currentStreak === 1 ? 'día' : 'días'}
              </Text>
            </View>
            <View style={styles.statBox}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.01)']}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.statValue}>🏆 {habit.maxStreak}</Text>
              <Text style={styles.statTitle} numberOfLines={1}>Racha Máxima</Text>
              <Text style={styles.statDesc} numberOfLines={1}>
                {habit.maxStreak === 1 ? 'día' : 'días'}
              </Text>
            </View>
            <View style={styles.statBox}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.01)']}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.statValue}>{stats.percentage}%</Text>
              <Text style={styles.statTitle} numberOfLines={1}>Efectividad</Text>
              <Text style={styles.statDesc} numberOfLines={1}>
                en {currentMonthName()}
              </Text>
            </View>
          </View>

          {/* Frecuencia y Categoría Info */}
          <View style={styles.infoCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.01)']}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Categoría</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{habit.category}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Frecuencia</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {habit.frequency === 'daily' 
                  ? 'Todos los días' 
                  : habit.frequency === 'weekly' 
                  ? 'Una vez por semana' 
                  : 'Días seleccionados'}
              </Text>
            </View>
            {habit.frequency === 'custom' && habit.customDays && (
              <>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Días activos</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {habit.customDays.map(d => ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'][d]).join(', ')}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Historial Visual de Anillos estilo Fitness */}
          <Text style={styles.sectionTitle}>Historial de {currentMonthName()}</Text>
          <View style={styles.historyCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.01)']}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.grid}>
              {days.map((day) => {
                const dateStr = day.toISOString().split('T')[0];
                const dayNum = day.getDate();
                const isScheduled = isHabitScheduledForDate(habit, dateStr);
                const isCompleted = habit.completedDates.includes(dateStr);
                const isFuture = dateStr > todayStr;
                const isCreatedBefore = habit.createdAt.split('T')[0] <= dateStr;

                let circleStyle = styles.circleInactive;
                let hasIcon = false;

                if (isFuture || !isCreatedBefore) {
                  circleStyle = styles.circleFuture;
                } else if (!isScheduled) {
                  circleStyle = styles.circleNotScheduled;
                } else if (isCompleted) {
                  circleStyle = styles.circleCompleted;
                  hasIcon = true;
                } else {
                  circleStyle = styles.circleMissed;
                }

                return (
                  <View key={dayNum} style={[styles.gridCell, { width: COLUMN_WIDTH, height: COLUMN_WIDTH }]}>
                    <View style={[styles.circleRing, circleStyle]}>
                      {hasIcon ? (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      ) : (
                        <Text style={[styles.cellDayText, isScheduled && !isCompleted && !isFuture && isCreatedBefore && styles.cellDayTextMissed]}>
                          {dayNum}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
            <View style={styles.gridLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendIndicator, styles.circleCompleted]} />
                <Text style={styles.legendText} numberOfLines={1}>Completado</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendIndicator, styles.circleMissed]} />
                <Text style={styles.legendText} numberOfLines={1}>Incompleto</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendIndicator, styles.circleNotScheduled]} />
                <Text style={styles.legendText} numberOfLines={1}>No activo</Text>
              </View>
            </View>
          </View>

          {/* Botón de Eliminación Discreta */}
          <Pressable onPress={handleDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={18} color="#FF453A" />
            <Text style={styles.deleteButtonText} numberOfLines={1}>Eliminar hábito</Text>
          </Pressable>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0B0E',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0A84FF',
  },
  statsPanel: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    borderRadius: 20, // Apple Squircle
    paddingVertical: 16,
    paddingHorizontal: 8,
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
    fontSize: 22,
    fontWeight: '700', // Title weight SF
    color: '#FFFFFF',
    marginBottom: 4,
    fontVariant: ['tabular-nums'],
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '600', // Label weight SF
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 2,
  },
  statDesc: {
    fontSize: 10,
    fontWeight: '400', // Secondary weight SF
    color: '#AEAEB2',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  infoCard: {
    borderRadius: 20, // Apple Squircle
    paddingVertical: 4,
    paddingHorizontal: 16,
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  infoValue: {
    fontSize: 15,
    color: '#8E8E93',
  },
  infoDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: -0.4,
  },
  historyCard: {
    borderRadius: 20, // Apple Squircle
    padding: 16,
    marginBottom: 28,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-start',
  },
  gridCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleRing: {
    width: '100%',
    height: '100%',
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  circleCompleted: {
    backgroundColor: '#30D158',
    borderColor: '#30D158',
  },
  circleMissed: {
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
    borderColor: '#FF453A',
  },
  circleNotScheduled: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderStyle: 'dashed',
  },
  circleFuture: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  circleInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cellDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    fontVariant: ['tabular-nums'],
  },
  cellDayTextMissed: {
    color: '#FF453A',
  },
  gridLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  legendText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '400',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
    borderRadius: 20, // Apple Squircle
    paddingVertical: 14,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.3)',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF453A',
  },
});
