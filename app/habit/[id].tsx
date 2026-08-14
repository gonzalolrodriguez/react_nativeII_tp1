import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Alert, SafeAreaView, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { habitsService, Habit, getLocalDateString, isHabitScheduledForDate, getScheduledDates } from '@/services/habitsService';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [loading, setLoading] = useState(true);

  const loadHabit = async () => {
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
  };

  useFocusEffect(
    useCallback(() => {
      loadHabit();
    }, [id])
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

  // Filtrar los días del mes actual en los que el hábito estuvo activo y completado
  const getMonthlyStats = () => {
    const startOfMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const habitCreatedStr = habit.createdAt.split('T')[0];
    const initialDateStr = habitCreatedStr > startOfMonthStr ? habitCreatedStr : startOfMonthStr;
    
    // Obtener días programados del mes actual hasta hoy
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
          headerBackTitleVisible: true,
          headerRight: () => (
            <Pressable onPress={handleEdit} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>Editar</Text>
            </Pressable>
          ),
          headerStyle: {
            backgroundColor: '#F2F2F7',
          },
          headerShadowVisible: false,
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Panel de Estadísticas */}
        <View style={styles.statsPanel}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>🔥 {habit.currentStreak}</Text>
            <Text style={styles.statTitle}>Racha Actual</Text>
            <Text style={styles.statDesc}>{habit.currentStreak === 1 ? 'día' : 'días'}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>🏆 {habit.maxStreak}</Text>
            <Text style={styles.statTitle}>Racha Máxima</Text>
            <Text style={styles.statDesc}>{habit.maxStreak === 1 ? 'día' : 'días'}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.percentage}%</Text>
            <Text style={styles.statTitle}>Efectividad</Text>
            <Text style={styles.statDesc}>en {currentMonthName()}</Text>
          </View>
        </View>

        {/* Frecuencia y Categoría Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Categoría</Text>
            <Text style={styles.infoValue}>{habit.category}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Frecuencia</Text>
            <Text style={styles.infoValue}>
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
                <Text style={styles.infoValue}>
                  {habit.customDays.map(d => ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'][d]).join(', ')}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Historial Visual de Anillos estilo Fitness */}
        <Text style={styles.sectionTitle}>Historial de {currentMonthName()}</Text>
        <View style={styles.historyCard}>
          <View style={styles.grid}>
            {days.map((day) => {
              const dateStr = day.toISOString().split('T')[0];
              const dayNum = day.getDate();
              const isScheduled = isHabitScheduledForDate(habit, dateStr);
              const isCompleted = habit.completedDates.includes(dateStr);
              const isFuture = dateStr > todayStr;
              const isCreatedBefore = habit.createdAt.split('T')[0] <= dateStr;

              // Determinar estilo del anillo/círculo
              let circleStyle = styles.circleInactive;
              let iconColor = '#FFFFFF';
              let hasIcon = false;

              if (isFuture || !isCreatedBefore) {
                // Futuro o antes de su creación
                circleStyle = styles.circleFuture;
              } else if (!isScheduled) {
                // No programado
                circleStyle = styles.circleNotScheduled;
              } else if (isCompleted) {
                // Completado
                circleStyle = styles.circleCompleted;
                hasIcon = true;
              } else {
                // Programado pero incompleto
                circleStyle = styles.circleMissed;
              }

              return (
                <View key={dayNum} style={styles.gridCell}>
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
              <Text style={styles.legendText}>Completado</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendIndicator, styles.circleMissed]} />
              <Text style={styles.legendText}>Incompleto</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendIndicator, styles.circleNotScheduled]} />
              <Text style={styles.legendText}>No activo</Text>
            </View>
          </View>
        </View>

        {/* Botón de Eliminación Discreta */}
        <Pressable onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={18} color="#FF3B30" />
          <Text style={styles.deleteButtonText}>Eliminar hábito</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  statsPanel: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
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
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 2,
  },
  statDesc: {
    fontSize: 10,
    color: '#AEAEB2',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F2F2F7',
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
    color: '#1C1C1E',
  },
  infoValue: {
    fontSize: 15,
    color: '#8E8E93',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#F2F2F7',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
    letterSpacing: -0.4,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-start',
  },
  gridCell: {
    width: (width - 40 - 32 - 60) / 7, // Calcula el ancho de cada celda para 7 por fila
    height: (width - 40 - 32 - 60) / 7,
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
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  circleMissed: {
    backgroundColor: '#FFF0F0',
    borderColor: '#FF3B30',
  },
  circleNotScheduled: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
  },
  circleFuture: {
    backgroundColor: '#F2F2F7',
    borderColor: '#F2F2F7',
  },
  circleInactive: {
    backgroundColor: '#F2F2F7',
    borderColor: '#E5E5EA',
  },
  cellDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  cellDayTextMissed: {
    color: '#FF3B30',
  },
  gridLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
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
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF0F0',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
});
