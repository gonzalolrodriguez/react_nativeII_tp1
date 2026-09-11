import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, RefreshControl, Platform, useWindowDimensions, ScrollView } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { habitsService, Habit, getLocalDateString, isHabitScheduledForDate } from '@/services/habitsService';
import { getEffectiveTimeOfDay } from '@/utils/dateUtils';
import * as Haptics from 'expo-haptics';
import { HabitCard } from '@/components/habit-card';
import { SkeletonLoader } from '@/components/skeleton-loader';
import { useTheme } from '@/context/ThemeContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';

type TimeOfDayFilter = 'todas' | 'mañana' | 'tarde' | 'noche';

export default function DashboardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedTod, setSelectedTod] = useState<TimeOfDayFilter>('todas');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const todayStr = getLocalDateString();

  // Obtener dimensiones de la ventana
  const { width } = useWindowDimensions();
  const isTabletOrWeb = width > 768;
  const numColumns = isTabletOrWeb ? 2 : 1;

  // Cargar hábitos desde el servicio
  const loadHabits = useCallback(async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) setLoading(true);
    try {
      const allHabits = await habitsService.fetchHabits();
      // Filtrar sólo los hábitos programados para hoy
      const todayHabits = allHabits.filter((h) => isHabitScheduledForDate(h, todayStr));
      setHabits(todayHabits);
    } catch (error) {
      console.error('Error loading habits', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [todayStr]);

  // Recargar al enfocar la pantalla
  useFocusEffect(
    useCallback(() => {
      loadHabits(habits.length === 0);
    }, [loadHabits, habits.length])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadHabits(false);
  };

  // Toggle de completado binario
  const handleToggleHabit = async (id: string) => {
    setHabits((prevHabits) =>
      prevHabits.map((h) => {
        if (h.id === id) {
          const completedSet = new Set(h.completedDates);
          let currentStreak = h.currentStreak;
          if (completedSet.has(todayStr)) {
            completedSet.delete(todayStr);
            currentStreak = Math.max(0, currentStreak - 1);
          } else {
            completedSet.add(todayStr);
            currentStreak = currentStreak + 1;
          }
          return {
            ...h,
            completedDates: Array.from(completedSet),
            currentStreak,
          };
        }
        return h;
      })
    );

    try {
      await habitsService.toggleHabitCompletion(id, todayStr);
      loadHabits(false);
    } catch (error) {
      console.error('Error toggling habit', error);
      loadHabits(false);
    }
  };

  // Actualizar progreso cuantitativo
  const handleUpdateProgress = async (id: string, delta: number) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const target = h.targetValue || 100;
          const currentVal = (h.unitProgress && h.unitProgress[todayStr]) || 0;
          const newVal = Math.max(0, currentVal + delta);
          const unitProgress = { ...(h.unitProgress || {}), [todayStr]: newVal };
          const completedSet = new Set(h.completedDates);
          if (newVal >= target) {
            completedSet.add(todayStr);
          } else {
            completedSet.delete(todayStr);
          }
          return { ...h, unitProgress, completedDates: Array.from(completedSet) };
        }
        return h;
      })
    );

    try {
      await habitsService.updateQuantitativeProgress(id, todayStr, delta);
      loadHabits(false);
    } catch (e) {
      console.error(e);
      loadHabits(false);
    }
  };

  // Conteos dinámicos por momento del día
  const todCounts = React.useMemo(() => {
    const counts = { todas: habits.length, mañana: 0, tarde: 0, noche: 0 };
    habits.forEach((h) => {
      const eff = getEffectiveTimeOfDay(h);
      if (eff === 'mañana') counts.mañana++;
      else if (eff === 'tarde') counts.tarde++;
      else if (eff === 'noche') counts.noche++;
    });
    return counts;
  }, [habits]);

  // Filtrado preciso por momento del día (Mañana, Tarde, Noche)
  const filteredHabits = habits.filter((h) => {
    if (selectedTod === 'todas') return true;
    const effective = getEffectiveTimeOfDay(h);
    return effective === selectedTod;
  });

  // Formateador de fecha
  const getFormattedDate = () => {
    const date = new Date();
    try {
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      };
      const formatted = date.toLocaleDateString('es-AR', options);
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch {
      const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      return `${weekdays[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]}`;
    }
  };

  const todOptions: { key: TimeOfDayFilter; label: string; count: number; icon: string }[] = [
    { key: 'todas', label: 'Todas', count: todCounts.todas, icon: 'sparkles-outline' },
    { key: 'mañana', label: 'Mañana', count: todCounts.mañana, icon: 'sunny-outline' },
    { key: 'tarde', label: 'Tarde', count: todCounts.tarde, icon: 'partly-sunny-outline' },
    { key: 'noche', label: 'Noche', count: todCounts.noche, icon: 'moon-outline' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.contentWrapper}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.dateText, { color: colors.textMuted }]}>{getFormattedDate()}</Text>
            <Text style={[styles.titleText, { color: colors.textPrimary }]}>Better</Text>
          </View>
          
          <View style={styles.headerActions}>
            <ThemeToggle />
          </View>
        </View>

        {/* Filtros por Momento del Día (Mañana, Tarde, Noche) */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
            {todOptions.map((item) => {
              const isSelected = selectedTod === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedTod(item.key);
                  }}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.chipBg,
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                    },
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={14}
                    color={isSelected ? '#FFFFFF' : colors.textMuted}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: isSelected ? '#FFFFFF' : colors.textMuted, fontWeight: isSelected ? '700' : '500' },
                    ]}
                  >
                    {item.label}
                  </Text>
                  <View
                    style={[
                      styles.countBadge,
                      {
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : colors.cardBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.countText,
                        { color: isSelected ? '#FFFFFF' : colors.textMuted },
                      ]}
                    >
                      {item.count}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.listContainer}>
            <SkeletonLoader />
          </View>
        ) : filteredHabits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Sin hábitos en esta rutina</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              No tenés hábitos agendados para este momento del día. ¡Agregá o edita un hábito!
            </Text>
            <Pressable
              onPress={() => router.push('/habit/manage')}
              style={[styles.emptyButton, { backgroundColor: colors.accent }]}
            >
              <Text style={styles.emptyButtonText}>Crear Hábito</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            key={isTabletOrWeb ? 'grid' : 'list'}
            data={filteredHabits}
            keyExtractor={(item) => item.id}
            numColumns={numColumns}
            columnWrapperStyle={isTabletOrWeb ? styles.gridRow : undefined}
            renderItem={({ item }) => (
              <View style={isTabletOrWeb ? styles.gridCell : styles.listCell}>
                <HabitCard
                  habit={item}
                  isCompleted={item.completedDates.includes(todayStr)}
                  onToggle={() => handleToggleHabit(item.id)}
                  onUpdateProgress={(delta) => handleUpdateProgress(item.id, delta)}
                />
              </View>
            )}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.accent}
              />
            }
          />
        )}

        {/* FAB (Floating Action Button) */}
        {habits.length > 0 && (
          <Pressable
            onPress={() => router.push('/habit/manage')}
            style={[styles.fab, { backgroundColor: colors.accent, shadowColor: colors.accent }]}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </Pressable>
        )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 24 : 16,
    paddingBottom: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateText: {
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
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  filterSection: {
    paddingBottom: 12,
  },
  filterList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
  },
  countBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  gridRow: {
    justifyContent: 'flex-start',
    gap: 16,
  },
  listCell: {
    width: '100%',
  },
  gridCell: {
    flex: 1,
    minWidth: 200,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: -40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
});
