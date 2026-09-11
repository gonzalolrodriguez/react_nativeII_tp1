import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { habitsService } from '@/services/habitsService';
import { HabitCategory, HabitFrequency, TimeOfDay } from '@/types/habit';
import { useTheme } from '@/context/ThemeContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { CategorySelector } from '@/components/habit/CategorySelector';
import { ColorIconPicker } from '@/components/habit/ColorIconPicker';
import { WeekdaySelector } from '@/components/habit/WeekdaySelector';
import { QuantitativeGoalSection } from '@/components/habit/QuantitativeGoalSection';
import { TimePickerField } from '@/components/habit/TimePickerField';
import { TimeOfDaySelector } from '@/components/habit/TimeOfDaySelector';
import { getTimeOfDayFromTime } from '@/utils/dateUtils';

export default function ManageHabitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const isEditing = Boolean(id);

  // Estados del Formulario
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<HabitCategory>('Salud');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [customDays, setCustomDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [color, setColor] = useState('#6366F1');
  const [icon, setIcon] = useState('heart');

  // Metas cuantitativas
  const [isQuantitative, setIsQuantitative] = useState(false);
  const [targetValue, setTargetValue] = useState('100');
  const [unit, setUnit] = useState('');

  // Momento del día y recordatorios
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('cualquiera');
  const [reminderTime, setReminderTime] = useState('');
  const [reminderEndTime, setReminderEndTime] = useState('');

  const [loading, setLoading] = useState(false);
  const [fetchingHabit, setFetchingHabit] = useState(isEditing);

  // Cargar datos en caso de edición
  useEffect(() => {
    if (!id) return;
    const loadHabit = async () => {
      try {
        const habit = await habitsService.getHabitById(id);
        if (habit) {
          setName(habit.name);
          setDescription(habit.description || '');
          setCategory(habit.category);
          setFrequency(habit.frequency);
          setCustomDays(habit.customDays || [1, 2, 3, 4, 5]);
          setColor(habit.color || '#6366F1');
          setIcon(habit.icon || 'heart');
          setIsQuantitative(Boolean(habit.isQuantitative));
          setTargetValue(habit.targetValue ? String(habit.targetValue) : '100');
          setUnit(habit.unit || '');
          setTimeOfDay(habit.timeOfDay || 'cualquiera');
          setReminderTime(habit.reminderTime || '');
          setReminderEndTime(habit.reminderEndTime || '');
        }
      } catch (e) {
        console.error('Error cargando hábito para editar', e);
      } finally {
        setFetchingHabit(false);
      }
    };
    loadHabit();
  }, [id]);

  const handleToggleDay = (dayValue: number) => {
    if (customDays.includes(dayValue)) {
      if (customDays.length > 1) {
        setCustomDays(customDays.filter((d) => d !== dayValue));
      }
    } else {
      setCustomDays([...customDays, dayValue].sort((a, b) => a - b));
    }
  };

  const handleSelectTimeOfDay = (newTod: TimeOfDay) => {
    setTimeOfDay(newTod);
    // Si no tiene horario configurado y elige un momento del día, sugerimos un horario inicial conveniente
    if (!reminderTime) {
      if (newTod === 'mañana') {
        setReminderTime('08:00');
        setReminderEndTime('08:45');
      } else if (newTod === 'tarde') {
        setReminderTime('16:00');
        setReminderEndTime('16:45');
      } else if (newTod === 'noche') {
        setReminderTime('21:00');
        setReminderEndTime('21:45');
      }
    }
  };

  const handleStartTimeChange = (newStartTime: string) => {
    setReminderTime(newStartTime);
    if (newStartTime && newStartTime.includes(':')) {
      const inferred = getTimeOfDayFromTime(newStartTime);
      if (inferred !== 'cualquiera') {
        setTimeOfDay(inferred);
      }
    }
  };

  const handleClearTimes = () => {
    setReminderTime('');
    setReminderEndTime('');
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setLoading(true);
    try {
      const effectiveTimeOfDay =
        timeOfDay !== 'cualquiera'
          ? timeOfDay
          : reminderTime
          ? getTimeOfDayFromTime(reminderTime)
          : 'cualquiera';

      const habitPayload = {
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        frequency,
        customDays: frequency === 'custom' ? customDays : undefined,
        color,
        icon,
        isQuantitative,
        targetValue: isQuantitative ? parseInt(targetValue, 10) || 100 : undefined,
        unit: isQuantitative && unit.trim() ? unit.trim() : undefined,
        timeOfDay: effectiveTimeOfDay,
        reminderTime: reminderTime.trim() || undefined,
        reminderEndTime: reminderEndTime.trim() || undefined,
      };

      if (isEditing && id) {
        await habitsService.updateHabit(id, habitPayload);
      } else {
        await habitsService.createHabit(habitPayload);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      console.error('Error guardando hábito', e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingHabit) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header Superior */}
      <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            router.back();
          }}
          style={[styles.backButton, { backgroundColor: colors.surfaceCard }]}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {isEditing ? 'Editar Hábito' : 'Nuevo Hábito'}
        </Text>

        <ThemeToggle />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Nombre del Hábito */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              Nombre del hábito *
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ej. Meditar 15 min, Tomar agua..."
              placeholderTextColor={colors.textMuted}
              style={[
                styles.textInput,
                {
                  color: colors.textPrimary,
                  borderColor: colors.cardBorder,
                  backgroundColor: colors.surfaceCard,
                },
              ]}
            />
          </View>

          {/* Descripción Opcional */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              Motivación o notas (opcional)
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Ej. Para tener más claridad mental cada mañana..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={2}
              style={[
                styles.textInput,
                styles.textArea,
                {
                  color: colors.textPrimary,
                  borderColor: colors.cardBorder,
                  backgroundColor: colors.surfaceCard,
                },
              ]}
            />
          </View>

          {/* Selector de Categoría (Componentizado) */}
          <CategorySelector
            selectedCategory={category}
            onSelectCategory={(cat, defaultColor) => {
              setCategory(cat);
              if (!isEditing) setColor(defaultColor);
            }}
          />

          {/* Selector de Frecuencia */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Frecuencia</Text>
            <View style={styles.frequencyRow}>
              {[
                { label: 'Diaria', value: 'daily' },
                { label: 'Días específicos', value: 'custom' },
                { label: 'Semanal', value: 'weekly' },
              ].map((item) => {
                const isSelected = frequency === item.value;
                return (
                  <Pressable
                    key={item.value}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setFrequency(item.value as HabitFrequency);
                    }}
                    style={[
                      styles.frequencyChip,
                      {
                        backgroundColor: isSelected ? color : colors.surfaceCard,
                        borderColor: isSelected ? color : colors.cardBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.frequencyChipText,
                        {
                          color: isSelected ? '#FFFFFF' : colors.textSecondary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Días específicos de la semana si aplica (Componentizado) */}
          {frequency === 'custom' && (
            <WeekdaySelector
              selectedDays={customDays}
              onToggleDay={handleToggleDay}
              accentColor={color}
            />
          )}

          {/* Momento del día (Componentizado: Mañana, Tarde, Noche, Cualquiera) */}
          <TimeOfDaySelector
            selectedTimeOfDay={timeOfDay}
            onSelectTimeOfDay={handleSelectTimeOfDay}
            accentColor={color}
          />

          {/* Horario y Recordatorios estilo Google Calendar (Componentizado) */}
          <TimePickerField
            startTime={reminderTime}
            endTime={reminderEndTime}
            onChangeStartTime={handleStartTimeChange}
            onChangeEndTime={setReminderEndTime}
            onClearTimes={handleClearTimes}
            accentColor={color}
          />

          {/* Metas cuantitativas (Componentizado) */}
          <QuantitativeGoalSection
            isQuantitative={isQuantitative}
            onToggleQuantitative={setIsQuantitative}
            targetValue={targetValue}
            onChangeTargetValue={setTargetValue}
            unit={unit}
            onChangeUnit={setUnit}
            accentColor={color}
          />

          {/* Paleta de Color e Íconos (Componentizado) */}
          <ColorIconPicker
            selectedColor={color}
            onSelectColor={setColor}
            selectedIcon={icon}
            onSelectIcon={setIcon}
          />

          {/* Botón de Guardado */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading || !name.trim()}
            style={[
              styles.submitButton,
              {
                backgroundColor: name.trim() ? color : colors.surfaceCard,
                opacity: name.trim() ? 1 : 0.6,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons
                  name={isEditing ? 'checkmark-circle' : 'add-circle'}
                  size={20}
                  color={name.trim() ? '#FFFFFF' : colors.textMuted}
                />
                <Text
                  style={[
                    styles.submitButtonText,
                    { color: name.trim() ? '#FFFFFF' : colors.textMuted },
                  ]}
                >
                  {isEditing ? 'Guardar Cambios' : 'Crear Hábito'}
                </Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  textInput: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    height: 70,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  frequencyChipText: {
    fontSize: 13,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 16,
    marginTop: 10,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
