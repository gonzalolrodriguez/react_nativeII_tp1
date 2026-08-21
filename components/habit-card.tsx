import React from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Habit } from '@/services/habitsService';
import { useTheme } from '@/context/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface HabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  onToggle: () => void;
}

export function HabitCard({ habit, isCompleted, onToggle }: HabitCardProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  // Shared values para animaciones físicas por resorte
  const cardScale = useSharedValue(1);
  const checkScale = useSharedValue(1);

  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: cardScale.value }],
    };
  });

  const checkAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: checkScale.value }],
    };
  });

  const handleCardPressIn = () => {
    cardScale.value = withSpring(0.98, { stiffness: 280, damping: 18, mass: 0.6 });
  };

  const handleCardPressOut = () => {
    cardScale.value = withSpring(1, { stiffness: 240, damping: 20 });
  };

  const handleCardPress = () => {
    router.push({
      pathname: '/habit/[id]',
      params: { id: habit.id },
    });
  };

  const handleCheckPressIn = () => {
    checkScale.value = withSpring(0.92, { stiffness: 280, damping: 18, mass: 0.6 });
  };

  const handleCheckPressOut = () => {
    checkScale.value = withSpring(1, { stiffness: 240, damping: 20 });
  };

  // Color personalizado o por defecto
  const habitColor = habit.color || (isDark ? '#6366F1' : '#4F46E5');

  // Estilos de categoría adaptados al tema
  const getCategoryColor = (category: Habit['category']) => {
    switch (category) {
      case 'Salud': return '#10B981';
      case 'Estudio': return '#3B82F6';
      case 'Deporte': return '#F59E0B';
      case 'Productividad': return '#8B5CF6';
      default: return '#EC4899';
    }
  };

  const catColor = getCategoryColor(habit.category);

  return (
    <View
      style={[
        styles.cardWrapper,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
          shadowColor: colors.shadowColor,
        },
      ]}
    >
      <LinearGradient
        colors={[habitColor + (isDark ? '18' : '0A'), colors.cardBg]}
        style={StyleSheet.absoluteFillObject}
      />

      <AnimatedPressable
        onPress={handleCardPress}
        onPressIn={handleCardPressIn}
        onPressOut={handleCardPressOut}
        style={[styles.infoArea, cardAnimatedStyle]}
      >
        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            {habit.icon && (
              <View style={[styles.iconPill, { backgroundColor: habitColor + '20' }]}>
                <Ionicons name={habit.icon as any} size={15} color={habitColor} />
              </View>
            )}
            <Text style={[styles.habitName, { color: colors.textPrimary }]} numberOfLines={1}>
              {habit.name}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <View style={[styles.categoryBadge, { backgroundColor: catColor + '1E' }]}>
              <Text style={[styles.categoryText, { color: catColor }]} numberOfLines={1}>
                {habit.category}
              </Text>
            </View>

            {habit.currentStreak > 0 && (
              <View style={[styles.streakBadge, { backgroundColor: '#F59E0B1E' }]}>
                <Text style={styles.streakText}>
                  🔥 <Text style={styles.streakNumber}>{habit.currentStreak}</Text>{' '}
                  {habit.currentStreak === 1 ? 'día' : 'días'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </AnimatedPressable>

      {/* Control del checkbox interactivo */}
      <AnimatedPressable
        onPress={onToggle}
        onPressIn={handleCheckPressIn}
        onPressOut={handleCheckPressOut}
        style={[styles.checkboxArea, checkAnimatedStyle]}
      >
        <View
          style={[
            styles.circleButton,
            isCompleted
              ? { backgroundColor: colors.success, borderColor: colors.success }
              : { borderColor: colors.cardBorder, backgroundColor: colors.chipBg },
          ]}
        >
          {isCompleted && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
        </View>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  infoArea: {
    flex: 1,
    padding: 16,
  },
  infoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconPill: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  habitName: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  streakBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#F59E0B',
  },
  streakNumber: {
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  checkboxArea: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleButton: {
    width: 32,
    height: 32,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
});
