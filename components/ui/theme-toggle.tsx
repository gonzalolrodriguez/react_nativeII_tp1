import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, Pressable, View, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  const [animatedValue] = useState(() => new Animated.Value(isDark ? 1 : 0));

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: isDark ? 1 : 0,
      stiffness: 280,
      damping: 20,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }, [isDark, animatedValue]);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
    toggleTheme();
  };

  const translateX = useMemo(
    () =>
      animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [2, 28],
      }),
    [animatedValue]
  );

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="switch"
      accessibilityLabel="Cambiar tema de color"
      style={({ pressed }) => [
        styles.pressable,
        pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
      ]}
    >
      <View
        style={[
          styles.track,
          {
            backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1',
          },
        ]}
      >
        {/* Iconos de fondo */}
        <View style={styles.iconsRow}>
          <View style={styles.iconContainer}>
            <Ionicons name="sunny" size={12} color={isDark ? '#64748B' : '#F59E0B'} />
          </View>
          <View style={styles.iconContainer}>
            <Ionicons name="moon" size={12} color={isDark ? '#818CF8' : '#94A3B8'} />
          </View>
        </View>

        {/* Perilla deslizante animada */}
        <Animated.View
          style={[
            styles.knob,
            {
              backgroundColor: isDark ? '#6366F1' : '#FFFFFF',
              transform: [{ translateX }],
            },
          ]}
        >
          <Ionicons
            name={isDark ? 'moon' : 'sunny'}
            size={13}
            color={isDark ? '#FFFFFF' : '#F59E0B'}
          />
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 20,
  },
  track: {
    width: 58,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  iconsRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 7,
    zIndex: 1,
  },
  iconContainer: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  knob: {
    position: 'absolute',
    top: 2,
    left: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
});
