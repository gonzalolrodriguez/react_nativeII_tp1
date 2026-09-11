import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';

export const COLOR_PALETTE = [
  '#6366F1', // Indigo
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#3B82F6', // Blue
];

export const ICON_OPTIONS: (keyof typeof Ionicons.glyphMap)[] = [
  'fitness',
  'book',
  'water',
  'heart',
  'leaf',
  'sparkles',
  'code-slash',
  'trophy',
  'bulb',
  'flame',
];

interface ColorIconPickerProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
  selectedIcon: string;
  onSelectIcon: (icon: string) => void;
}

export const ColorIconPicker: React.FC<ColorIconPickerProps> = ({
  selectedColor,
  onSelectColor,
  selectedIcon,
  onSelectIcon,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {/* Selector de Color */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Color distintivo</Text>
        <View style={styles.colorsRow}>
          {COLOR_PALETTE.map((c) => {
            const isSelected = selectedColor === c;
            return (
              <Pressable
                key={c}
                onPress={() => {
                  Haptics.selectionAsync();
                  onSelectColor(c);
                }}
                style={[
                  styles.colorCircle,
                  { backgroundColor: c },
                  isSelected && styles.colorCircleSelected,
                ]}
              >
                {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Selector de Ícono */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Ícono representativo</Text>
        <View style={styles.iconsRow}>
          {ICON_OPTIONS.map((iconName) => {
            const isSelected = selectedIcon === iconName;
            return (
              <Pressable
                key={iconName}
                onPress={() => {
                  Haptics.selectionAsync();
                  onSelectIcon(iconName);
                }}
                style={[
                  styles.iconButton,
                  {
                    backgroundColor: isSelected ? selectedColor : colors.surfaceCard,
                    borderColor: isSelected ? selectedColor : colors.cardBorder,
                  },
                ]}
              >
                <Ionicons
                  name={iconName}
                  size={20}
                  color={isSelected ? '#FFFFFF' : colors.textSecondary}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  colorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.1 }],
  },
  iconsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
