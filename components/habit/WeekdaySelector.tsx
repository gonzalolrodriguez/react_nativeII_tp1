import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';

export interface WeekdayItem {
  label: string;
  value: number; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  name: string;
}

export const WEEKDAYS_DEFAULT: WeekdayItem[] = [
  { label: 'L', value: 1, name: 'Lun' },
  { label: 'M', value: 2, name: 'Mar' },
  { label: 'M', value: 3, name: 'Mié' },
  { label: 'J', value: 4, name: 'Jue' },
  { label: 'V', value: 5, name: 'Vie' },
  { label: 'S', value: 6, name: 'Sáb' },
  { label: 'D', value: 0, name: 'Dom' },
];

interface WeekdaySelectorProps {
  selectedDays: number[];
  onToggleDay: (dayValue: number) => void;
  accentColor?: string;
}

export const WeekdaySelector: React.FC<WeekdaySelectorProps> = ({
  selectedDays,
  onToggleDay,
  accentColor,
}) => {
  const { colors } = useTheme();
  const activeColor = accentColor || colors.accent;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Días de la semana
      </Text>
      <View style={styles.daysRow}>
        {WEEKDAYS_DEFAULT.map((day) => {
          const isSelected = selectedDays.includes(day.value);
          return (
            <Pressable
              key={day.value}
              onPress={() => {
                Haptics.selectionAsync();
                onToggleDay(day.value);
              }}
              style={[
                styles.dayButton,
                {
                  backgroundColor: isSelected ? activeColor : colors.surfaceCard,
                  borderColor: isSelected ? activeColor : colors.cardBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  {
                    color: isSelected ? '#FFFFFF' : colors.textSecondary,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}
              >
                {day.label}
              </Text>
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
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dayButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 14,
  },
});
