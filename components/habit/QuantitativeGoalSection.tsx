import React from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';

export interface UnitPreset {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const UNIT_PRESETS_DEFAULT: UnitPreset[] = [
  { label: 'ml', icon: 'water-outline' },
  { label: 'págs', icon: 'book-outline' },
  { label: 'min', icon: 'timer-outline' },
  { label: 'reps', icon: 'fitness-outline' },
  { label: 'pasos', icon: 'walk-outline' },
];

interface QuantitativeGoalSectionProps {
  isQuantitative: boolean;
  onToggleQuantitative: (val: boolean) => void;
  targetValue: string;
  onChangeTargetValue: (val: string) => void;
  unit: string;
  onChangeUnit: (val: string) => void;
  accentColor?: string;
}

export const QuantitativeGoalSection: React.FC<QuantitativeGoalSectionProps> = ({
  isQuantitative,
  onToggleQuantitative,
  targetValue,
  onChangeTargetValue,
  unit,
  onChangeUnit,
  accentColor,
}) => {
  const { colors } = useTheme();
  const activeColor = accentColor || colors.accent;

  return (
    <View style={styles.container}>
      {/* Header con Switch */}
      <View style={[styles.headerRow, { backgroundColor: colors.surfaceCard, borderColor: colors.cardBorder }]}>
        <View style={styles.headerInfo}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Meta Cuantitativa</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Medí tu progreso numérico (ej. 2000 ml, 20 páginas)
          </Text>
        </View>
        <Switch
          value={isQuantitative}
          onValueChange={(val) => {
            Haptics.selectionAsync();
            onToggleQuantitative(val);
          }}
          trackColor={{ false: colors.cardBorder, true: activeColor }}
          thumbColor="#FFFFFF"
        />
      </View>

      {/* Inputs expandibles */}
      {isQuantitative && (
        <View style={[styles.body, { backgroundColor: colors.surfaceCard, borderColor: colors.cardBorder }]}>
          <View style={styles.inputRow}>
            <View style={styles.inputColFlex}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Objetivo diario</Text>
              <TextInput
                value={targetValue}
                onChangeText={(t) => onChangeTargetValue(t.replace(/[^0-9]/g, ''))}
                placeholder="100"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                style={[
                  styles.textInput,
                  {
                    color: colors.textPrimary,
                    borderColor: colors.cardBorder,
                    backgroundColor: colors.background,
                  },
                ]}
              />
            </View>

            <View style={styles.inputColFlex}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Unidad de medida</Text>
              <TextInput
                value={unit}
                onChangeText={onChangeUnit}
                placeholder="ml, págs, min"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.textInput,
                  {
                    color: colors.textPrimary,
                    borderColor: colors.cardBorder,
                    backgroundColor: colors.background,
                  },
                ]}
              />
            </View>
          </View>

          {/* Presets rápidos de unidad */}
          <Text style={[styles.presetsLabel, { color: colors.textMuted }]}>Atajos frecuentes:</Text>
          <View style={styles.presetsRow}>
            {UNIT_PRESETS_DEFAULT.map((preset) => {
              const isSelected = unit.toLowerCase() === preset.label.toLowerCase();
              return (
                <Pressable
                  key={preset.label}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onChangeUnit(preset.label);
                  }}
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor: isSelected ? `${activeColor}25` : colors.background,
                      borderColor: isSelected ? activeColor : colors.cardBorder,
                    },
                  ]}
                >
                  <Ionicons
                    name={preset.icon}
                    size={14}
                    color={isSelected ? activeColor : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.presetText,
                      {
                        color: isSelected ? activeColor : colors.textSecondary,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
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
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  headerInfo: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
  },
  body: {
    marginTop: 10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputColFlex: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  presetsLabel: {
    fontSize: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  presetText: {
    fontSize: 12,
  },
});
