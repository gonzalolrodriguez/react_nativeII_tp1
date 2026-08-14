import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Animated } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Habit } from '@/services/habitsService';

interface HabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  onToggle: () => void;
}

export function HabitCard({ habit, isCompleted, onToggle }: HabitCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Micro-animación al cambiar de estado
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isCompleted, scaleAnim]);

  // Colores pastel de categoría según Apple HIG
  const getCategoryStyles = (category: Habit['category']) => {
    switch (category) {
      case 'Salud':
        return { bg: '#E2FBE9', text: '#248A3D' };
      case 'Estudio':
        return { bg: '#E4F2FF', text: '#007AFF' };
      case 'Deporte':
        return { bg: '#FFEFE5', text: '#FF9500' };
      case 'Productividad':
        return { bg: '#F3E9FF', text: '#8E44AD' };
      default:
        return { bg: '#F2F2F7', text: '#8E8E93' };
    }
  };

  const catColors = getCategoryStyles(habit.category);

  return (
    <View style={styles.cardContainer}>
      <Link href={{ pathname: '/habit/[id]', params: { id: habit.id } }} asChild>
        <Pressable style={styles.mainPressable}>
          <View style={styles.infoContainer}>
            <Text style={styles.habitName} numberOfLines={1}>
              {habit.name}
            </Text>
            
            <View style={styles.metaRow}>
              <View style={[styles.categoryBadge, { backgroundColor: catColors.bg }]}>
                <Text style={[styles.categoryText, { color: catColors.text }]}>
                  {habit.category}
                </Text>
              </View>
              
              {habit.currentStreak > 0 && (
                <View style={styles.streakBadge}>
                  <Text style={styles.streakText}>
                    🔥 {habit.currentStreak} {habit.currentStreak === 1 ? 'día' : 'días'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Pressable>
      </Link>

      <Pressable onPress={onToggle} style={styles.checkboxContainer}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <View
            style={[
              styles.circleButton,
              isCompleted ? styles.circleCompleted : styles.circleIncomplete,
            ]}
          >
            {isCompleted && (
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            )}
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  mainPressable: {
    flex: 1,
    padding: 16,
  },
  infoContainer: {
    flex: 1,
  },
  habitName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  streakBadge: {
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFE5B4',
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B27000',
  },
  checkboxContainer: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  circleIncomplete: {
    borderColor: '#C7C7CC',
    backgroundColor: '#FFFFFF',
  },
  circleCompleted: {
    borderColor: '#34C759',
    backgroundColor: '#34C759',
  },
});
