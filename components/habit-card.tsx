import React from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Habit, getLocalDateString } from '@/services/habitsService';
import { getEffectiveTimeOfDay } from '@/utils/dateUtils';
import { useTheme } from '@/context/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface HabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  onToggle: () => void;
  onUpdateProgress?: (delta: number) => void;
}

export function HabitCard({ habit, isCompleted, onToggle, onUpdateProgress }: HabitCardProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const isWeb = Platform.OS === 'web';
  const todayStr = getLocalDateString();

  // Shared values para animaciones físicas por resorte en native
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
    if (!isWeb) {
      // eslint-disable-next-line react-hooks/immutability
      cardScale.value = withSpring(0.98, { stiffness: 280, damping: 18, mass: 0.6 });
    }
  };

  const handleCardPressOut = () => {
    if (!isWeb) {
      // eslint-disable-next-line react-hooks/immutability
      cardScale.value = withSpring(1, { stiffness: 240, damping: 20 });
    }
  };

  const handleCardPress = () => {
    router.push({
      pathname: '/habit/[id]',
      params: { id: habit.id },
    });
  };

  const handleCheckPressIn = () => {
    if (!isWeb) {
      // eslint-disable-next-line react-hooks/immutability
      checkScale.value = withSpring(0.92, { stiffness: 280, damping: 18, mass: 0.6 });
    }
  };

  const handleCheckPressOut = () => {
    if (!isWeb) {
      // eslint-disable-next-line react-hooks/immutability
      checkScale.value = withSpring(1, { stiffness: 240, damping: 20 });
    }
  };

  const habitColor = habit.color || (isDark ? '#6366F1' : '#4F46E5');

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

  // Valores de hábito cuantitativo
  const currentVal = (habit.unitProgress && habit.unitProgress[todayStr]) || 0;
  const targetVal = habit.targetValue || 100;
  const progressPct = Math.min(100, Math.round((currentVal / targetVal) * 100));

  const getTimeOfDayEmoji = (tod?: Habit['timeOfDay']) => {
    switch (tod) {
      case 'mañana': return '🌅 Mañana';
      case 'tarde': return '☀️ Tarde';
      case 'noche': return '🌙 Noche';
      default: return null;
    }
  };

  const effectiveTod = getEffectiveTimeOfDay(habit);
  const todText = getTimeOfDayEmoji(effectiveTod);

  const cardInfoContent = (
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

        {todText && (
          <View style={[styles.todBadge, { backgroundColor: colors.chipBg }]}>
            <Text style={[styles.todText, { color: colors.textMuted }]}>{todText}</Text>
          </View>
        )}

        {habit.reminderTime && (
          <View style={[styles.todBadge, { backgroundColor: colors.chipBg }]}>
            <Text style={[styles.todText, { color: colors.textMuted }]}>⏰ {habit.reminderTime}</Text>
          </View>
        )}

        {habit.currentStreak > 0 && (
          <View style={[styles.streakBadge, { backgroundColor: '#F59E0B1E' }]}>
            <Text style={styles.streakText}>
              🔥 <Text style={styles.streakNumber}>{habit.currentStreak}</Text>{' '}
              {habit.currentStreak === 1 ? 'día' : 'días'}
            </Text>
          </View>
        )}
      </View>

      {/* Progreso Cuantitativo */}
      {habit.isQuantitative && (
        <View style={styles.quantContainer}>
          <View style={styles.quantRow}>
            <Text style={[styles.quantText, { color: colors.textSecondary }]}>
              {currentVal} / {targetVal} {habit.unit || ''} ({progressPct}%)
            </Text>
          </View>
          <View style={[styles.quantTrack, { backgroundColor: colors.chipBg }]}>
            <View style={[styles.quantFill, { backgroundColor: habitColor, width: `${progressPct}%` }]} />
          </View>
        </View>
      )}
    </View>
  );

  const checkboxContent = (
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
  );

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
        style={StyleSheet.absoluteFill}
      />

      {isWeb ? (
        <Pressable
          onPress={handleCardPress}
          style={({ pressed }) => [styles.infoArea, pressed && { opacity: 0.9 }]}
        >
          {cardInfoContent}
        </Pressable>
      ) : (
        <AnimatedPressable
          onPress={handleCardPress}
          onPressIn={handleCardPressIn}
          onPressOut={handleCardPressOut}
          style={[styles.infoArea, cardAnimatedStyle]}
        >
          {cardInfoContent}
        </AnimatedPressable>
      )}

      {/* Botones cuantitativos o Checkbox estándar */}
      {habit.isQuantitative && onUpdateProgress ? (
        <View style={styles.quantButtonsContainer}>
          <Pressable
            onPress={() => onUpdateProgress(habit.unit === 'ml' ? 250 : 1)}
            style={({ pressed }) => [
              styles.plusButton,
              { backgroundColor: habitColor },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      ) : (
        isWeb ? (
          <Pressable
            onPress={onToggle}
            style={({ pressed }) => [styles.checkboxArea, pressed && { opacity: 0.8 }]}
          >
            {checkboxContent}
          </Pressable>
        ) : (
          <AnimatedPressable
            onPress={onToggle}
            onPressIn={handleCheckPressIn}
            onPressOut={handleCheckPressOut}
            style={[styles.checkboxArea, checkAnimatedStyle]}
          >
            {checkboxContent}
          </AnimatedPressable>
        )
      )}
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
    flexWrap: 'wrap',
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
  todBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  todText: {
    fontSize: 11,
    fontWeight: '600',
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
    fontWeight: '700',
  },
  quantContainer: {
    marginTop: 10,
  },
  quantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  quantText: {
    fontSize: 12,
    fontWeight: '600',
  },
  quantTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  quantFill: {
    height: '100%',
    borderRadius: 3,
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
  quantButtonsContainer: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusButton: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});
