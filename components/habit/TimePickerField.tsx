import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import {
  timeToMinutes,
  minutesToTime,
  TIME_SLOTS_15,
  generateEndTimeOptions,
} from '@/utils/dateUtils';

interface TimePickerFieldProps {
  startTime: string; // 'HH:MM'
  endTime: string; // 'HH:MM'
  onChangeStartTime: (time: string) => void;
  onChangeEndTime: (time: string) => void;
  onClearTimes: () => void;
  accentColor?: string;
}

export const TimePickerField: React.FC<TimePickerFieldProps> = ({
  startTime,
  endTime,
  onChangeStartTime,
  onChangeEndTime,
  onClearTimes,
  accentColor,
}) => {
  const { colors } = useTheme();
  const activeColor = accentColor || colors.accent;

  // Estados de inputs locales para tipeo directo
  const [prevStartTime, setPrevStartTime] = useState(startTime);
  const [startInputText, setStartInputText] = useState(startTime || '');

  const [prevEndTime, setPrevEndTime] = useState(endTime);
  const [endInputText, setEndInputText] = useState(endTime || '');

  if (startTime !== prevStartTime) {
    setPrevStartTime(startTime);
    setStartInputText(startTime || '');
  }

  if (endTime !== prevEndTime) {
    setPrevEndTime(endTime);
    setEndInputText(endTime || '');
  }

  // Modal de opciones dropdown
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTarget, setModalTarget] = useState<'start' | 'end'>('start');

  // Opciones de fin relativas a la hora de inicio
  const endTimeOptions = useMemo(() => {
    const baseStart = startTime || '09:00';
    return generateEndTimeOptions(baseStart, TIME_SLOTS_15);
  }, [startTime]);

  // Formateador inteligente de entrada numérica (ej. '17' -> '17:00', '9' -> '09:00', '1830' -> '18:30')
  const normalizeNumericInput = (text: string): string => {
    const digits = text.replace(/[^0-9]/g, '');
    if (!digits) return '';

    if (digits.length <= 2) {
      const h = parseInt(digits, 10);
      if (h >= 0 && h <= 23) {
        return `${String(h).padStart(2, '0')}:00`;
      }
      return '00:00';
    }

    if (digits.length === 3) {
      const h = parseInt(digits.slice(0, 1), 10);
      const m = Math.min(59, parseInt(digits.slice(1), 10));
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    const h = Math.min(23, parseInt(digits.slice(0, 2), 10));
    const m = Math.min(59, parseInt(digits.slice(2, 4), 10));
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const handleStartTextChange = (raw: string) => {
    const filtered = raw.replace(/[^0-9:]/g, '');
    setStartInputText(filtered);
    if (filtered.includes(':') && filtered.length === 5) {
      const [h, m] = filtered.split(':').map(Number);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        onChangeStartTime(filtered);
        // Si no hay fin o es anterior, adelantar 45 min
        if (!endTime || timeToMinutes(endTime) <= timeToMinutes(filtered)) {
          const autoEnd = minutesToTime(timeToMinutes(filtered) + 45);
          onChangeEndTime(autoEnd);
          setEndInputText(autoEnd);
        }
      }
    }
  };

  const handleStartBlur = () => {
    if (!startInputText.trim()) {
      onChangeStartTime('');
      return;
    }
    const normalized = normalizeNumericInput(startInputText);
    setStartInputText(normalized);
    onChangeStartTime(normalized);

    // Ajustar fin automáticamente a +45 min si no está definido
    if (!endTime || timeToMinutes(endTime) <= timeToMinutes(normalized)) {
      const autoEnd = minutesToTime(timeToMinutes(normalized) + 45);
      onChangeEndTime(autoEnd);
      setEndInputText(autoEnd);
    }
  };

  const handleEndTextChange = (raw: string) => {
    const filtered = raw.replace(/[^0-9:]/g, '');
    setEndInputText(filtered);
    if (filtered.includes(':') && filtered.length === 5) {
      const [h, m] = filtered.split(':').map(Number);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        onChangeEndTime(filtered);
      }
    }
  };

  const handleEndBlur = () => {
    if (!endInputText.trim()) {
      onChangeEndTime('');
      return;
    }
    const normalized = normalizeNumericInput(endInputText);
    setEndInputText(normalized);
    onChangeEndTime(normalized);
  };

  const openDropdown = (target: 'start' | 'end') => {
    Haptics.selectionAsync();
    setModalTarget(target);
    setModalVisible(true);
  };

  const handleSelectSlot = (slotValue: string) => {
    Haptics.selectionAsync();
    if (modalTarget === 'start') {
      onChangeStartTime(slotValue);
      setStartInputText(slotValue);

      // Si no hay hora de fin o es anterior, colocar +45 min
      if (!endTime || timeToMinutes(endTime) <= timeToMinutes(slotValue)) {
        const autoEnd = minutesToTime(timeToMinutes(slotValue) + 45);
        onChangeEndTime(autoEnd);
        setEndInputText(autoEnd);
      }
    } else {
      onChangeEndTime(slotValue);
      setEndInputText(slotValue);
    }
    setModalVisible(false);
  };

  const hasTimes = Boolean(startTime || endTime);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <View style={styles.iconTitleRow}>
          <Ionicons name="time-outline" size={16} color={activeColor} />
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Horario y Recordatorio
          </Text>
        </View>
        {hasTimes && (
          <Pressable
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              onClearTimes();
              setStartInputText('');
              setEndInputText('');
            }}
            hitSlop={8}
          >
            <Text style={[styles.clearText, { color: colors.textMuted }]}>Quitar horario</Text>
          </Pressable>
        )}
      </View>

      {/* Selector Dual Estilo Google Calendar */}
      <View
        style={[
          styles.pickerCard,
          { backgroundColor: colors.surfaceCard, borderColor: colors.cardBorder },
        ]}
      >
        {/* Caja de Inicio */}
        <View style={styles.boxFlex}>
          <Text style={[styles.boxLabel, { color: colors.textMuted }]}>Inicio</Text>
          <View
            style={[
              styles.timeInputRow,
              { backgroundColor: colors.background, borderColor: colors.cardBorder },
            ]}
          >
            <TextInput
              value={startInputText}
              onChangeText={handleStartTextChange}
              onBlur={handleStartBlur}
              placeholder="08:00"
              placeholderTextColor={colors.textMuted}
              keyboardType="numbers-and-punctuation"
              style={[styles.timeInput, { color: colors.textPrimary }]}
              maxLength={5}
            />
            <Pressable
              onPress={() => openDropdown('start')}
              style={styles.chevronButton}
              hitSlop={6}
            >
              <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Separador */}
        <View style={styles.separator}>
          <Text style={[styles.separatorText, { color: colors.textMuted }]}>a</Text>
        </View>

        {/* Caja de Fin */}
        <View style={styles.boxFlex}>
          <Text style={[styles.boxLabel, { color: colors.textMuted }]}>Fin</Text>
          <View
            style={[
              styles.timeInputRow,
              { backgroundColor: colors.background, borderColor: colors.cardBorder },
            ]}
          >
            <TextInput
              value={endInputText}
              onChangeText={handleEndTextChange}
              onBlur={handleEndBlur}
              placeholder="09:00"
              placeholderTextColor={colors.textMuted}
              keyboardType="numbers-and-punctuation"
              style={[styles.timeInput, { color: colors.textPrimary }]}
              maxLength={5}
            />
            <Pressable
              onPress={() => openDropdown('end')}
              style={styles.chevronButton}
              hitSlop={6}
            >
              <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>
      </View>

      <Text style={[styles.hintText, { color: colors.textMuted }]}>
        Escribí directamente la hora (ej: &apos;17&apos; para 17:00) o tocá la flecha para elegir de la lista.
      </Text>

      {/* Modal Desplegable con Lista de Opciones */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View
            style={[
              styles.modalSheet,
              { backgroundColor: colors.surfaceCard, borderColor: colors.cardBorder },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {modalTarget === 'start' ? 'Seleccionar Hora de Inicio' : 'Seleccionar Hora de Fin'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={10}>
                <Ionicons name="close-circle" size={24} color={colors.textMuted} />
              </Pressable>
            </View>

            <FlatList
              data={
                modalTarget === 'start'
                  ? TIME_SLOTS_15.map((t) => ({ time: t, label: t }))
                  : endTimeOptions
              }
              keyExtractor={(item) => item.time}
              initialNumToRender={20}
              renderItem={({ item }) => {
                const currentVal = modalTarget === 'start' ? startTime : endTime;
                const isSelected = currentVal === item.time;
                return (
                  <Pressable
                    onPress={() => handleSelectSlot(item.time)}
                    style={[
                      styles.slotRow,
                      {
                        backgroundColor: isSelected ? `${activeColor}20` : 'transparent',
                        borderColor: colors.cardBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.slotText,
                        {
                          color: isSelected ? activeColor : colors.textPrimary,
                          fontWeight: isSelected ? '700' : '400',
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color={activeColor} />
                    )}
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearText: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  pickerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  boxFlex: {
    flex: 1,
  },
  boxLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  timeInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    padding: 0,
  },
  chevronButton: {
    padding: 4,
  },
  separator: {
    paddingTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
  },
  separatorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 11,
    marginTop: 6,
    marginHorizontal: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  slotText: {
    fontSize: 15,
  },
});
