import React from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Habit } from '@/services/habitsService';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface HabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  onToggle: () => void;
}

export function HabitCard({ habit, isCompleted, onToggle }: HabitCardProps) {
  const router = useRouter();
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

  // Físicas de resorte iOS 18
  const handleCardPressIn = () => {
    cardScale.value = withSpring(0.97, { stiffness: 280, damping: 18, mass: 0.6 });
  };

  const handleCardPressOut = () => {
    cardScale.value = withSpring(1, { stiffness: 240, damping: 20 });
  };

  const handleCardPress = () => {
    router.push({
      pathname: '/habit/[id]',
      params: { id: habit.id }
    });
  };

  const handleCheckPressIn = () => {
    checkScale.value = withSpring(0.97, { stiffness: 280, damping: 18, mass: 0.6 });
  };

  const handleCheckPressOut = () => {
    checkScale.value = withSpring(1, { stiffness: 240, damping: 20 });
  };

  // Estilos de categoría adaptados al tema oscuro translúcido
  const getCategoryStyles = (category: Habit['category']) => {
    switch (category) {
      case 'Salud':
        return { bg: 'rgba(36, 138, 61, 0.15)', text: '#30D158' };
      case 'Estudio':
        return { bg: 'rgba(0, 122, 255, 0.15)', text: '#0A84FF' };
      case 'Deporte':
        return { bg: 'rgba(255, 149, 0, 0.15)', text: '#FF9F0A' };
      case 'Productividad':
        return { bg: 'rgba(142, 68, 173, 0.15)', text: '#BF5AF2' };
      default:
        return { bg: 'rgba(142, 142, 147, 0.15)', text: '#98989D' };
    }
  };

  const catColors = getCategoryStyles(habit.category);

  return (
    <View style={styles.cardWrapper}>
      {/* Reflejo de luz premium iOS 18 */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.01)']}
        style={StyleSheet.absoluteFillObject}
      />

      <AnimatedPressable
        onPress={handleCardPress}
        onPressIn={handleCardPressIn}
        onPressOut={handleCardPressOut}
        style={[styles.infoArea, cardAnimatedStyle]}
      >
          <View style={styles.infoContainer}>
            <Text style={styles.habitName} numberOfLines={1}>
              {habit.name}
            </Text>

            <View style={styles.metaRow}>
              <View style={[styles.categoryBadge, { backgroundColor: catColors.bg }]}>
                <Text style={[styles.categoryText, { color: catColors.text }]} numberOfLines={1}>
                  {habit.category}
                </Text>
              </View>

              {habit.currentStreak > 0 && (
                <View style={styles.streakBadge}>
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
            isCompleted ? styles.circleCompleted : styles.circleIncomplete,
          ]}
        >
          {isCompleted && (
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          )}
        </View>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20, // Squircle geometry para el bloque principal
    marginBottom: 12,
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
  infoArea: {
    flex: 1,
    padding: 16,
  },
  infoContainer: {
    flex: 1,
  },
  habitName: {
    fontSize: 17,
    fontWeight: '600', // Habit Label weight matching Apple SF Hierarchy
    color: '#FFFFFF',
    marginBottom: 8,
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
    borderRadius: 12, // Squircle para controles anidados
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  streakBadge: {
    backgroundColor: 'rgba(255, 159, 10, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12, // Squircle para controles anidados
  },
  streakText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#FF9F0A',
  },
  streakNumber: {
    fontVariant: ['tabular-nums'], // Previene temblor de UI
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
    borderRadius: 12, // Squircle nested control
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  circleIncomplete: {
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  circleCompleted: {
    borderColor: '#30D158',
    backgroundColor: '#30D158',
  },
});
