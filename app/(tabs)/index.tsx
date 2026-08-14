import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, RefreshControl, SafeAreaView, Platform } from 'react-native';
import { useFocusEffect, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { habitsService, Habit, getLocalDateString, isHabitScheduledForDate } from '@/services/habitsService';
import { HabitCard } from '@/components/habit-card';
import { SkeletonLoader } from '@/components/skeleton-loader';

export default function DashboardScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const todayStr = getLocalDateString();

  // Cargar hábitos desde el servicio
  const loadHabits = async (showLoadingIndicator = true) => {
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
  };

  // Recargar al enfocar la pantalla
  useFocusEffect(
    useCallback(() => {
      loadHabits(habits.length === 0);
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadHabits(false);
  };

  // Toggle de completado
  const handleToggleHabit = async (id: string) => {
    // Optimistic UI Update: Cambiar estado visual inmediatamente para mejor respuesta
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
      // Recargar sutilmente en segundo plano para asegurar consistencia
      loadHabits(false);
    } catch (error) {
      console.error('Error toggling habit', error);
      // Revertir en caso de error
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
    } catch (e) {
      const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      return `${weekdays[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]}`;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.dateText}>{getFormattedDate()}</Text>
          <Text style={styles.titleText}>Hoy</Text>
        </View>
        <Link href="/habit/manage" asChild>
          <Pressable style={styles.headerButton}>
            <Ionicons name="add" size={24} color="#007AFF" />
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
          data={habits}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HabitCard
              habit={item}
              isCompleted={item.completedDates.includes(todayStr)}
              onToggle={() => handleToggleHabit(item.id)}
            />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#007AFF"
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // Gris claro secundario de iOS
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
    paddingBottom: 16,
  },
  dateText: {
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
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 80, // Espacio para el FAB
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
    color: '#1C1C1E',
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
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#007AFF',
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
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
});
