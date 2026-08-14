import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, RefreshControl, Platform, useWindowDimensions } from 'react-native';
import { useFocusEffect, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { habitsService, Habit, getLocalDateString, isHabitScheduledForDate } from '@/services/habitsService';
import { HabitCard } from '@/components/habit-card';
import { SkeletonLoader } from '@/components/skeleton-loader';

export default function DashboardScreen() {
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
    <SafeAreaView style={styles.container}>
      <View style={styles.contentWrapper}>
        <View style={styles.header}>
          <View>
            <Text style={styles.dateText}>{getFormattedDate()}</Text>
            <Text style={styles.titleText}>Hoy</Text>
          </View>
          <Link href="/habit/manage" asChild>
            <Pressable style={styles.headerButton}>
              <Ionicons name="add" size={24} color="#0A84FF" />
            </Pressable>
          </Link>
        </View>

        {loading ? (
          <View style={styles.listContainer}>
            <SkeletonLoader />
          </View>
        ) : habits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyTitle}>Sin hábitos para hoy</Text>
            <Text style={styles.emptySubtitle}>
              No tenés hábitos programados para hoy. ¡Creá uno nuevo para empezar a registrar!
            </Text>
            <Link href="/habit/manage" asChild>
              <Pressable style={styles.emptyButton}>
                <Text style={styles.emptyButtonText}>Crear Hábito</Text>
              </Pressable>
            </Link>
          </View>
        ) : (
          <FlatList
            key={isTabletOrWeb ? 'grid' : 'list'} // Fuerza recreación de FlatList al cambiar numColumns
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
                tintColor="#0A84FF"
              />
            }
          />
        )}

        {/* FAB (Floating Action Button) al estilo Apple */}
        {habits.length > 0 && (
          <Link href="/habit/manage" asChild>
            <Pressable style={styles.fab}>
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
    backgroundColor: '#0B0B0E', // Fondo oscuro premium
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 1024, // Web Layout Boundary
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 24 : 16,
    paddingBottom: 16,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600', // SF Weights Hierarchy
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: 34,
    fontWeight: '700', // Title weight matching SF Hierarchy
    color: '#FFFFFF',
    letterSpacing: -1,
    marginTop: 2,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 12, // Squircle-like rounded border
    backgroundColor: 'rgba(255, 255, 255, 0.06)', // Glassmorphic button
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Espacio para el FAB
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
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#0A84FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0A84FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
});
