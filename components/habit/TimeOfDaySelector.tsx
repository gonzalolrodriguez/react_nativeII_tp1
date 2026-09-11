import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { TimeOfDay } from '@/types/habit';
import { useTheme } from '@/context/ThemeContext';

export interface TimeOfDayOption {
  key: TimeOfDay;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  subtitle: string;
}

export const TIME_OF_DAY_OPTIONS: TimeOfDayOption[] = [
  { key: 'mañana', label: 'Mañana', icon: 'sunny-outline', subtitle: '05:00 - 12:00' },
  { key: 'tarde', label: 'Tarde', icon: 'partly-sunny-outline', subtitle: '12:00 - 19:00' },
  { key: 'noche', label: 'Noche', icon: 'moon-outline', subtitle: '19:00 - 05:00' },
  { key: 'cualquiera', label: 'Cualquiera', icon: 'sparkles-outline', subtitle: 'Flexible' },
];

interface TimeOfDaySelectorProps {
  selectedTimeOfDay: TimeOfDay;
  onSelectTimeOfDay: (tod: TimeOfDay) => void;
  accentColor?: string;
}

export const TimeOfDaySelector: React.FC<TimeOfDaySelectorProps> = ({
  selectedTimeOfDay,
  onSelectTimeOfDay,
  accentColor,
}) => {
  const { colors } = useTheme();
  const activeColor = accentColor || colors.accent;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="time-outline" size={16} color={activeColor} />
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Momento del día
        </Text>
      </View>

      <View style={styles.grid}>
        {TIME_OF_DAY_OPTIONS.map((opt) => {
          const isSelected = selectedTimeOfDay === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => {
                Haptics.selectionAsync();
                onSelectTimeOfDay(opt.key);
              }}
              style={[
                styles.card,
                {
                  backgroundColor: isSelected ? `${activeColor}1A` : colors.surfaceCard,
                  borderColor: isSelected ? activeColor : colors.cardBorder,
                },
              ]}
            >
              <View style={styles.cardLeft}>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: isSelected
                        ? activeColor
                        : `${colors.textMuted}1E`,
                    },
                  ]}
                >
                  <Ionicons
                    name={opt.icon}
                    size={16}
                    color={isSelected ? '#FFFFFF' : colors.textMuted}
                  />
                </View>

                <View style={styles.textCol}>
                  <Text
                    style={[
                      styles.title,
                      {
                        color: isSelected ? colors.textPrimary : colors.textSecondary,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                    {opt.subtitle}
                  </Text>
                </View>
              </View>

              {isSelected && (
                <Ionicons name="checkmark-circle" size={18} color={activeColor} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontSize: 13,
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
});
