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
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { habitsService, Habit } from '@/services/habitsService';
import { useTheme } from '@/context/ThemeContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CATEGORIES: { label: Habit['category']; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { label: 'Salud', icon: 'heart', color: '#10B981' },
  { label: 'Estudio', icon: 'book', color: '#3B82F6' },
  { label: 'Deporte', icon: 'fitness', color: '#F59E0B' },
  { label: 'Productividad', icon: 'flash', color: '#8B5CF6' },
  { label: 'Otro', icon: 'sparkles', color: '#EC4899' },
];

const COLOR_PALETTE = [
  '#6366F1', // Indigo
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#3B82F6', // Blue
];

const ICON_OPTIONS: (keyof typeof Ionicons.glyphMap)[] = [
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
  const { colors, isDark } = useTheme();

  // Estados del formulario
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Habit['category']>('Salud');
  const [frequency, setFrequency] = useState<Habit['frequency']>('daily');
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [selectedColor, setSelectedColor] = useState('#6366F1');
  const [selectedIcon, setSelectedIcon] = useState<keyof typeof Ionicons.glyphMap>('fitness');

  // Estados de control
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const [daysError, setDaysError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Animaciones físicas por resorte para el botón de guardar
  const buttonScale = useSharedValue(1);

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.96, { stiffness: 300, damping: 18 });
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
            if (habit.color) setSelectedColor(habit.color);
            if (habit.icon && ICON_OPTIONS.includes(habit.icon as any)) {
              setSelectedIcon(habit.icon as any);
            }
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
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
    setDaysError('');
    if (customDays.includes(dayValue)) {
      setCustomDays(customDays.filter((d) => d !== dayValue));
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

    if (!isValid) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
      return;
    }

    setSaving(true);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }

    try {
      const habitData = {
        name: name.trim(),
        category,
        frequency,
        customDays: frequency === 'custom' ? customDays : undefined,
        color: selectedColor,
        icon: selectedIcon,
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

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Cargando hábito...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: isEditMode ? 'Editar Hábito' : 'Nuevo Hábito',
          headerBackTitle: 'Atrás',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.textPrimary, fontWeight: '700', fontSize: 18 },
          headerTintColor: colors.accent,
          headerRight: () => <ThemeToggle />,
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
      >
        <View style={styles.contentWrapper}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* 1. INTERACTIVE LIVE PREVIEW CARD (Tarjetón interactivo en vivo) */}
            <Animated.View entering={FadeInDown.duration(400)} style={styles.previewSection}>
              <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>Vista previa en tiempo real</Text>
              
              <View
                style={[
                  styles.previewCard,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: selectedColor + '40',
                  },
                ]}
              >
                <LinearGradient
                  colors={[selectedColor + '1E', colors.cardBg]}
                  style={StyleSheet.absoluteFillObject}
                />
                
                <View style={styles.previewCardHeader}>
                  <View style={[styles.previewIconBox, { backgroundColor: selectedColor + '25', borderColor: selectedColor + '50' }]}>
                    <Ionicons name={selectedIcon} size={22} color={selectedColor} />
                  </View>
                  
                  <View style={styles.previewTitleArea}>
                    <Text style={[styles.previewName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {name.trim() || 'Nombre de tu hábito'}
                    </Text>
                    <View style={styles.previewBadgeRow}>
                      <View style={[styles.previewBadge, { backgroundColor: selectedColor + '20' }]}>
                        <Text style={[styles.previewBadgeText, { color: selectedColor }]}>{category}</Text>
                      </View>
                      <Text style={[styles.previewSubtext, { color: colors.textMuted }]}>
                        {frequency === 'daily' ? 'Diario' : frequency === 'weekly' ? 'Semanal' : 'Personalizado'}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.previewCheckCircle, { borderColor: selectedColor + '40' }]}>
                    <Ionicons name="checkmark" size={16} color={selectedColor} />
                  </View>
                </View>

                <View style={[styles.previewFooter, { borderTopColor: colors.cardBorder }]}>
                  <Text style={[styles.previewFooterText, { color: colors.textMuted }]}>
                    🔥 Racha actual: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>0 días</Text>
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* 2. NOMBRE DEL HÁBITO */}
            <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.fieldSection}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Nombre del hábito</Text>
                <Text style={[styles.charCount, { color: colors.textMuted }]}>{name.length}/50</Text>
              </View>
              
              <View
                style={[
                  styles.inputWrapper,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: nameError
                      ? colors.danger
                      : isFocused
                      ? selectedColor
                      : colors.cardBorder,
                  },
                ]}
              >
                <Ionicons
                  name="pencil"
                  size={18}
                  color={isFocused ? selectedColor : colors.textMuted}
                  style={{ marginLeft: 14 }}
                />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Ej: Meditar 10 minutos, Tomar agua"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={handleNameChange}
                  maxLength={50}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
              </View>
              {nameError !== '' && <Text style={[styles.errorText, { color: colors.danger }]}>{nameError}</Text>}
            </Animated.View>

            {/* 3. SELECCIÓN DE CATEGORÍA */}
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.fieldSection}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Categoría</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.label;
                  return (
                    <Pressable
                      key={cat.label}
                      onPress={() => {
                        if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
                        setCategory(cat.label);
                        setSelectedColor(cat.color);
                      }}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? cat.color + '22' : colors.chipBg,
                          borderColor: isSelected ? cat.color : colors.cardBorder,
                        },
                      ]}
                    >
                      <Ionicons
                        name={cat.icon}
                        size={15}
                        color={isSelected ? cat.color : colors.textMuted}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: isSelected ? cat.color : colors.textSecondary,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Animated.View>

            {/* 4. PALETA DE COLORES (Chakra UI Style Spectrum) */}
            <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.fieldSection}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Color del tema</Text>
              <View style={styles.colorGrid}>
                {COLOR_PALETTE.map((hexColor) => {
                  const isSelected = selectedColor === hexColor;
                  return (
                    <Pressable
                      key={hexColor}
                      onPress={() => {
                        if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
                        setSelectedColor(hexColor);
                      }}
                      style={[
                        styles.colorDotWrapper,
                        isSelected && { borderColor: hexColor, transform: [{ scale: 1.12 }] },
                      ]}
                    >
                      <View style={[styles.colorDot, { backgroundColor: hexColor }]}>
                        {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>

            {/* 5. SELECCIÓN DE ÍCONO */}
            <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.fieldSection}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Ícono del hábito</Text>
              <View style={styles.iconGrid}>
                {ICON_OPTIONS.map((iconName) => {
                  const isSelected = selectedIcon === iconName;
                  return (
                    <Pressable
                      key={iconName}
                      onPress={() => {
                        if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
                        setSelectedIcon(iconName);
                      }}
                      style={[
                        styles.iconTile,
                        {
                          backgroundColor: isSelected ? selectedColor + '20' : colors.chipBg,
                          borderColor: isSelected ? selectedColor : colors.cardBorder,
                        },
                      ]}
                    >
                      <Ionicons
                        name={iconName}
                        size={20}
                        color={isSelected ? selectedColor : colors.textMuted}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>

            {/* 6. FRECUENCIA (Framer Motion Segmented Switch) */}
            <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.fieldSection}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Frecuencia</Text>
              <View style={[styles.segmentedTrack, { backgroundColor: colors.chipBg, borderColor: colors.cardBorder }]}>
                {(['daily', 'weekly', 'custom'] as Habit['frequency'][]).map((freq) => {
                  const isSelected = frequency === freq;
                  const labels = { daily: 'Diario', weekly: 'Semanal', custom: 'Personalizado' };
                  return (
                    <Pressable
                      key={freq}
                      onPress={() => {
                        if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
                        setFrequency(freq);
                        setDaysError('');
                      }}
                      style={[
                        styles.segmentButton,
                        isSelected && { backgroundColor: selectedColor, shadowColor: selectedColor },
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          {
                            color: isSelected ? '#FFFFFF' : colors.textMuted,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {labels[freq]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Días personalizados */}
              {frequency === 'custom' && (
                <View style={[styles.customDaysCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                  <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
                    Seleccioná los días activos de la semana
                  </Text>
                  <View style={styles.daysGrid}>
                    {WEEKDAYS.map((day) => {
                      const isSelected = customDays.includes(day.value);
                      return (
                        <Pressable
                          key={day.value}
                          onPress={() => toggleDay(day.value)}
                          style={[
                            styles.dayCircle,
                            {
                              backgroundColor: isSelected ? selectedColor : colors.chipBg,
                              borderColor: isSelected ? selectedColor : colors.cardBorder,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayCircleText,
                              {
                                color: isSelected ? '#FFFFFF' : colors.textMuted,
                                fontWeight: isSelected ? '700' : '600',
                              },
                            ]}
                          >
                            {day.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {daysError !== '' && <Text style={[styles.errorText, { color: colors.danger }]}>{daysError}</Text>}
                </View>
              )}
            </Animated.View>

            {/* 7. BOTÓN PRINCIPAL DE GUARDAR CON SPRING */}
            <Animated.View entering={FadeInDown.delay(600).duration(400)}>
              <AnimatedPressable
                onPress={handleSave}
                onPressIn={handleButtonPressIn}
                onPressOut={handleButtonPressOut}
                disabled={saving}
                style={[styles.saveButtonWrapper, buttonAnimatedStyle]}
              >
                <LinearGradient
                  colors={[selectedColor, selectedColor + 'CC']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.saveButtonGradient, saving && { opacity: 0.6 }]}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons
                        name={isEditMode ? 'save-outline' : 'add-circle-outline'}
                        size={22}
                        color="#FFFFFF"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.saveButtonText}>
                        {isEditMode ? 'Guardar Cambios' : 'Crear Hábito'}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </AnimatedPressable>

              <Pressable
                onPress={() => router.back()}
                style={styles.cancelButton}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textMuted }]}>Cancelar</Text>
              </Pressable>
            </Animated.View>

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  previewSection: {
    marginBottom: 24,
  },
  previewCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  previewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  previewTitleArea: {
    flex: 1,
  },
  previewName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  previewBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  previewBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  previewSubtext: {
    fontSize: 12,
  },
  previewCheckCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewFooter: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  previewFooterText: {
    fontSize: 13,
  },
  fieldSection: {
    marginBottom: 22,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 13,
    marginTop: 6,
    paddingLeft: 4,
    fontWeight: '500',
  },
  chipsContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 14,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 4,
  },
  colorDotWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingVertical: 4,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedTrack: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  segmentText: {
    fontSize: 13,
  },
  customDaysCard: {
    marginTop: 14,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  subLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
  },
  daysGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  dayCircleText: {
    fontSize: 13,
  },
  saveButtonWrapper: {
    marginTop: 10,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 4,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  cancelButton: {
    marginTop: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
