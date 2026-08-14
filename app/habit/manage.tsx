import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, Pressable, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { habitsService, Habit } from '@/services/habitsService';

const CATEGORIES: Habit['category'][] = ['Salud', 'Estudio', 'Deporte', 'Productividad', 'Otro'];

const WEEKDAYS = [
  { label: 'L', value: 1 },
  { label: 'M', value: 2 },
  { label: 'M', value: 3 },
  { label: 'J', value: 4 },
  { label: 'V', value: 5 },
  { label: 'S', value: 6 },
  { label: 'D', value: 0 },
];

export default function ManageHabitScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();

  // Estados del formulario
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Habit['category']>('Salud');
  const [frequency, setFrequency] = useState<Habit['frequency']>('daily');
  const [customDays, setCustomDays] = useState<number[]>([]);
  
  // Estados de control
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const [daysError, setDaysError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // Cargar datos si estamos en modo edición
  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      const loadHabit = async () => {
        setLoading(true);
        try {
          const habit = await habitsService.getHabitById(id);
          if (habit) {
            setName(habit.name);
            setCategory(habit.category);
            setFrequency(habit.frequency);
            setCustomDays(habit.customDays || []);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };
      loadHabit();
    }
  }, [id]);

  // Validaciones en tiempo real
  const handleNameChange = (text: string) => {
    setName(text);
    if (text.trim().length >= 3) {
      setNameError('');
    }
  };

  const toggleDay = (dayValue: number) => {
    setDaysError('');
    if (customDays.includes(dayValue)) {
      setCustomDays(customDays.filter(d => d !== dayValue));
    } else {
      setCustomDays([...customDays, dayValue]);
    }
  };

  // Validar y guardar
  const handleSave = async () => {
    let isValid = true;

    // Validar nombre
    if (name.trim().length < 3) {
      setNameError('El nombre del hábito debe tener al menos 3 caracteres.');
      isValid = false;
    } else {
      setNameError('');
    }

    // Validar días personalizados
    if (frequency === 'custom' && customDays.length === 0) {
      setDaysError('Debés seleccionar al menos un día de la semana.');
      isValid = false;
    } else {
      setDaysError('');
    }

    if (!isValid) return;

    setSaving(true);
    try {
      const habitData = {
        name: name.trim(),
        category,
        frequency,
        customDays: frequency === 'custom' ? customDays : undefined
      };

      if (isEditMode && id) {
        await habitsService.updateHabit(id, habitData);
      } else {
        await habitsService.createHabit(habitData);
      }

      router.back();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Colores dinámicos para categorías seleccionadas
  const getCategoryStyles = (cat: Habit['category']) => {
    switch (cat) {
      case 'Salud': return { bg: '#E2FBE9', text: '#248A3D' };
      case 'Estudio': return { bg: '#E4F2FF', text: '#007AFF' };
      case 'Deporte': return { bg: '#FFEFE5', text: '#FF9500' };
      case 'Productividad': return { bg: '#F3E9FF', text: '#8E44AD' };
      default: return { bg: '#E5E5EA', text: '#1C1C1E' };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando hábito...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: isEditMode ? 'Editar Hábito' : 'Nuevo Hábito',
          headerBackTitle: 'Atrás',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#F2F2F7' },
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Campo: Nombre del Hábito */}
          <Text style={styles.label}>Nombre del hábito</Text>
          <TextInput
            style={[styles.input, nameError !== '' && styles.inputError]}
            placeholder="Ej: Meditar, Estudiar, Tomar agua"
            placeholderTextColor="#C7C7CC"
            value={name}
            onChangeText={handleNameChange}
            maxLength={50}
          />
          {nameError !== '' && <Text style={styles.errorText}>{nameError}</Text>}

          {/* Campo: Categoría */}
          <Text style={styles.label}>Categoría</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.chipsContainer}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat;
              const stylesCat = getCategoryStyles(cat);
              return (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[
                    styles.chip,
                    isSelected 
                      ? { backgroundColor: stylesCat.bg, borderColor: stylesCat.bg } 
                      : styles.chipUnselected
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isSelected ? { color: stylesCat.text, fontWeight: '700' } : styles.chipTextUnselected
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Campo: Frecuencia */}
          <Text style={styles.label}>Frecuencia</Text>
          <View style={styles.frequencyRow}>
            {(['daily', 'weekly', 'custom'] as Habit['frequency'][]).map((freq) => {
              const isSelected = frequency === freq;
              const labels = { daily: 'Diario', weekly: 'Semanal', custom: 'Personalizado' };
              return (
                <Pressable
                  key={freq}
                  onPress={() => {
                    setFrequency(freq);
                    setDaysError('');
                  }}
                  style={[
                    styles.freqButton,
                    isSelected ? styles.freqButtonSelected : styles.freqButtonUnselected
                  ]}
                >
                  <Text
                    style={[
                      styles.freqText,
                      isSelected ? styles.freqTextSelected : styles.freqTextUnselected
                    ]}
                  >
                    {labels[freq]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Selector de días personalizado condicional */}
          {frequency === 'custom' && (
            <View style={styles.customDaysContainer}>
              <Text style={styles.subLabel}>Seleccioná los días de la semana</Text>
              <View style={styles.daysGrid}>
                {WEEKDAYS.map((day) => {
                  const isSelected = customDays.includes(day.value);
                  return (
                    <Pressable
                      key={day.value}
                      onPress={() => toggleDay(day.value)}
                      style={[
                        styles.dayCircle,
                        isSelected ? styles.dayCircleSelected : styles.dayCircleUnselected
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayCircleText,
                          isSelected ? styles.dayCircleTextSelected : styles.dayCircleTextUnselected
                        ]}
                      >
                        {day.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {daysError !== '' && <Text style={styles.errorText}>{daysError}</Text>}
            </View>
          )}

          {/* Botón de Guardado */}
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [
              styles.saveButton,
              pressed && styles.saveButtonPressed,
              saving && styles.saveButtonDisabled
            ]}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isEditMode ? 'Guardar Cambios' : 'Crear Hábito'}
              </Text>
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
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 16,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
    marginTop: 6,
    paddingLeft: 4,
  },
  chipsContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E5EA',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextUnselected: {
    color: '#8E8E93',
  },
  frequencyRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  freqButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  freqButtonSelected: {
    backgroundColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  freqButtonUnselected: {
    backgroundColor: 'transparent',
  },
  freqText: {
    fontSize: 14,
    fontWeight: '600',
  },
  freqTextSelected: {
    color: '#FFFFFF',
  },
  freqTextUnselected: {
    color: '#8E8E93',
  },
  customDaysContainer: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  daysGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  dayCircleSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dayCircleUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E5EA',
  },
  dayCircleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dayCircleTextSelected: {
    color: '#FFFFFF',
  },
  dayCircleTextUnselected: {
    color: '#8E8E93',
  },
  saveButton: {
    marginTop: 40,
    backgroundColor: '#007AFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonPressed: {
    opacity: 0.85,
  },
  saveButtonDisabled: {
    backgroundColor: '#A2C4FF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
