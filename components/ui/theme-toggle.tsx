import React, { useEffect } from 'react';
import { StyleSheet, Pressable, View, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  // Animación del indicador flotante (0 = Sol/Claro, 1 = Luna/Oscuro)
  const animValue = useSharedValue(isDark ? 1 : 0);

  useEffect(() => {
    animValue.value = withSpring(isDark ? 1 : 0, {
      stiffness: 300,
      damping: 22,
      mass: 0.8,
    });
  }, [isDark, animValue]);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
    toggleTheme();
  };

  // Estilo animado de la perilla deslizante
  const knobStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: animValue.value * 28, // Desplazamiento horizontal de 28px
        },
      ],
      backgroundColor: interpolateColor(
        animValue.value,
        [0, 1],
        ['#FFFFFF', '#6366F1']
      ),
    };
  });

  const trackStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        animValue.value,
        [0, 1],
        ['#E2E8F0', '#1E293B']
      ),
      borderColor: interpolateColor(
        animValue.value,
        [0, 1],
        ['#CBD5E1', 'rgba(255, 255, 255, 0.12)']
      ),
    };
  });

  return (
    <Pressable onPress={handlePress} accessibilityLabel="Toggle theme">
      <Animated.View style={[styles.track, trackStyle]}>
        {/* Perilla deslizante con animación física */}
        <Animated.View style={[styles.knob, knobStyle]}>
          <Ionicons
            name={isDark ? 'moon' : 'sunny'}
            size={13}
            color={isDark ? '#FFFFFF' : '#F59E0B'}
          />
        </Animated.View>

        {/* Iconos de fondo */}
        <View style={styles.iconsRow}>
          <View style={styles.iconContainer}>
            <Ionicons name="sunny" size={13} color={isDark ? '#64748B' : '#F59E0B'} />
          </View>
          <View style={styles.iconContainer}>
            <Ionicons name="moon" size={13} color={isDark ? '#818CF8' : '#94A3B8'} />
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 60,
    height: 32,
    borderRadius: 20,
    borderWidth: 1,
    padding: 2,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  knob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  iconsRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 7,
    zIndex: 1,
  },
  iconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
