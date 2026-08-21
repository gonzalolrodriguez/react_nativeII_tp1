import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export function SkeletonLoader() {
  const { colors, isDark } = useTheme();
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [pulseAnim]);

  const blockBg = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <View style={styles.container}>
      {[1, 2, 3].map((key) => (
        <View
          key={key}
          style={[
            styles.card,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View style={styles.content}>
            <Animated.View
              style={[
                styles.titleLine,
                { backgroundColor: blockBg, opacity: pulseAnim },
              ]}
            />
            <View style={styles.subtitleRow}>
              <Animated.View
                style={[
                  styles.tag,
                  { backgroundColor: blockBg, opacity: pulseAnim },
                ]}
              />
              <Animated.View
                style={[
                  styles.streak,
                  { backgroundColor: blockBg, opacity: pulseAnim },
                ]}
              />
            </View>
          </View>
          <Animated.View
            style={[
              styles.circle,
              { backgroundColor: blockBg, opacity: pulseAnim },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  content: {
    flex: 1,
    marginRight: 16,
  },
  titleLine: {
    height: 18,
    width: '70%',
    borderRadius: 6,
    marginBottom: 10,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    height: 14,
    width: 60,
    borderRadius: 6,
    marginRight: 8,
  },
  streak: {
    height: 14,
    width: 80,
    borderRadius: 6,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 14,
  },
});
