import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';

export function SkeletonLoader() {
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

  return (
    <View style={styles.container}>
      {/* 3 cards skeleton */}
      {[1, 2, 3].map((key) => (
        <View key={key} style={styles.card}>
          <View style={styles.content}>
            {/* Title skeleton */}
            <Animated.View style={[styles.titleLine, { opacity: pulseAnim }]} />
            {/* Subtitle skeleton */}
            <View style={styles.subtitleRow}>
              <Animated.View style={[styles.tag, { opacity: pulseAnim }]} />
              <Animated.View style={[styles.streak, { opacity: pulseAnim }]} />
            </View>
          </View>
          {/* Circle skeleton */}
          <Animated.View style={[styles.circle, { opacity: pulseAnim }]} />
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  content: {
    flex: 1,
    marginRight: 16,
  },
  titleLine: {
    height: 18,
    width: '70%',
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    marginBottom: 10,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    height: 12,
    width: 60,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    marginRight: 8,
  },
  streak: {
    height: 12,
    width: 80,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
  },
});
