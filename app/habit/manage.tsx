import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { habitsService, Habit } from '@/services/habitsService';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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

  // Animaciones físicas por resorte para el botón de guardar
  const buttonScale = useSharedValue(1);

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.97, { stiffness: 280, damping: 18, mass: 0.6 });
  };

  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1, { stiffness: 240, damping: 20 });
  };

  // Cargar datos en modo edición
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

  // Guardar datos
  const handleSave = async () => {
    let isValid = true;

    if (name.trim().length < 3) {
      setNameError('El nombre del hábito debe tener al menos 3 caracteres.');
      isValid = false;
    } else {
      setNameError('');
    }

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

  // Colores dinámicos adaptados al tema oscuro glassmorphic
  const getCategoryStyles = (cat: Habit['category']) => {
    switch (cat) {
      case 'Salud': return { bg: 'rgba(48, 209, 88, 0.15)', text: '#30D158' };
      case 'Estudio': return { bg: 'rgba(10, 132, 255, 0.15)', text: '#0A84FF' };
      case 'Deporte': return { bg: 'rgba(255, 159, 10, 0.15)', text: '#FF9F0A' };
      case 'Productividad': return { bg: 'rgba(191, 90, 242, 0.15)', text: '#BF5AF2' };
      default: return { bg: 'rgba(255, 255, 255, 0.08)', text: '#FFFFFF' };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0A84FF" />
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
          headerStyle: { backgroundColor: '#0B0B0E' },
          headerTitleStyle: { color: '#FFFFFF', fontWeight: '600' },
          headerTintColor: '#0A84FF',
        }}
      />
      <View style={styles.contentWrapper}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Nombre del Hábito */}
          <Text style={styles.label}>Nombre del hábito</Text>
          <View style={[styles.inputWrapper, nameError !== '' && styles.inputWrapperError]}>
            <TextInput
              style={styles.input}
              placeholder="Ej: Meditar, Estudiar, Tomar agua"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              value={name}
              onChangeText={handleNameChange}
              maxLength={50}
            />
          </View>
          {nameError !== '' && <Text style={styles.errorText}>{nameError}</Text>}

          {/* Categoría */}
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
                    numberOfLines={1}
                  >
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Frecuencia */}
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
                    numberOfLines={1}
                  >
                    {labels[freq]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Días activos personalizado */}
          {frequency === 'custom' && (
            <View style={styles.customDaysCard}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.01)']}
                style={StyleSheet.absoluteFillObject}
              />
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

          {/* Botón de Guardado con animación de resorte */}
          <AnimatedPressable
            onPress={handleSave}
            onPressIn={handleButtonPressIn}
            onPressOut={handleButtonPressOut}
            disabled={saving}
            style={[
              styles.saveButton,
              saving && styles.saveButtonDisabled,
              buttonAnimatedStyle
            ]}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText} numberOfLines={1}>
                {isEditMode ? 'Guardar Cambios' : 'Crear Hábito'}
              </Text>
            )}
          </AnimatedPressable>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0E',
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 600, // Limita ancho del formulario en Web/Tablets
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0B0E',
    gap: 12,
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 16,
  },
  scrollContent: {
    padding: 16,
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
  inputWrapper: {
    borderRadius: 12, // Nested squircle rounded border
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        backgroundColor: 'rgba(15, 15, 20, 0.75)',
      },
      android: {
        backgroundColor: 'rgba(15, 15, 20, 0.75)',
      },
      web: {
        backdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
      } as any,
    }),
  },
  inputWrapperError: {
    borderColor: '#FF453A', // Apple Red HIG
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    color: '#FFFFFF',
  },
  errorText: {
    color: '#FF453A', // Apple Red HIG
    fontSize: 13,
    marginTop: 6,
    paddingLeft: 4,
    fontWeight: '400',
  },
  chipsContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20, // Squircle para chips
    borderWidth: 1,
  },
  chipUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipText: {
    fontSize: 14,
  },
  chipTextUnselected: {
    color: '#8E8E93',
    fontWeight: '400',
  },
  frequencyRow: {
    flexDirection: 'row',
    borderRadius: 12, // Squircle
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...Platform.select({
      ios: {
        backgroundColor: 'rgba(15, 15, 20, 0.75)',
      },
      android: {
        backgroundColor: 'rgba(15, 15, 20, 0.75)',
      },
      web: {
        backdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
      } as any,
    }),
  },
  freqButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9, // Squircle
  },
  freqButtonSelected: {
    backgroundColor: '#0A84FF',
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
  customDaysCard: {
    marginTop: 16,
    borderRadius: 20, // Main block squircle
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        backgroundColor: 'rgba(15, 15, 20, 0.75)',
      },
      android: {
        backgroundColor: 'rgba(15, 15, 20, 0.75)',
      },
      web: {
        backdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
      } as any,
    }),
  },
  daysGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 12, // Squircle nested day controls
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  dayCircleSelected: {
    backgroundColor: '#0A84FF',
    borderColor: '#0A84FF',
  },
  dayCircleUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    backgroundColor: '#0A84FF',
    borderRadius: 14, // Squircle nested
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(10, 132, 255, 0.5)',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
