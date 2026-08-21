import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, RefreshControl, Platform, useWindowDimensions } from 'react-native';
import { useFocusEffect, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { habitsService, Habit, getLocalDateString, isHabitScheduledForDate } from '@/services/habitsService';
import { HabitCard } from '@/components/habit-card';
import { SkeletonLoader } from '@/components/skeleton-loader';
import { useTheme } from '@/context/ThemeContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const [habits, setHabits] = useState<Habit[]>([]);
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

  // Toggle de completado con UI Optimista
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

  // Formateador de fecha elegante
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
            <Link href="/habit/manage" asChild>
              <Pressable
                style={[
                  styles.headerButton,
                  { backgroundColor: colors.chipBg, borderColor: colors.cardBorder },
                ]}
              >
                <Ionicons name="add" size={24} color={colors.accent} />
              </Pressable>
            </Link>
          </View>
        </View>

        {loading ? (
          <View style={styles.listContainer}>
            <SkeletonLoader />
          </View>
        ) : habits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Sin hábitos para hoy</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              No tenés hábitos programados para hoy. ¡Creá uno nuevo para empezar a registrar!
            </Text>
            <Link href="/habit/manage" asChild>
              <Pressable style={[styles.emptyButton, { backgroundColor: colors.accent }]}>
                <Text style={styles.emptyButtonText}>Crear Hábito</Text>
              </Pressable>
            </Link>
          </View>
        ) : (
          <FlatList
            key={isTabletOrWeb ? 'grid' : 'list'}
            data={habits}
            keyExtractor={(item) => item.id}
            numColumns={numColumns}
            columnWrapperStyle={isTabletOrWeb ? styles.gridRow : undefined}
            renderItem={({ item }) => (
              <View style={isTabletOrWeb ? styles.gridCell : styles.listCell}>
                <HabitCard
                  habit={item}
                  isCompleted={item.completedDates.includes(todayStr)}
                  onToggle={() => handleToggleHabit(item.id)}
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
          <Link href="/habit/manage" asChild>
            <Pressable style={[styles.fab, { backgroundColor: colors.accent, shadowColor: colors.accent }]}>
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </Pressable>
          </Link>
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
    paddingBottom: 16,
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
