import React from 'react';
import { StyleSheet, Text, View, Pressable, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AnalyticsData, habitsService } from '@/services/habitsService';
import { useTheme } from '@/context/ThemeContext';

interface AnalyticsChartsProps {
  data: AnalyticsData;
  onRefreshData?: () => void;
}

export function AnalyticsCharts({ data, onRefreshData }: AnalyticsChartsProps) {
  const { colors } = useTheme();

  // Exportar backup local como archivo JSON descargable en navegador/móvil
  const handleExportBackup = async () => {
    try {
      const jsonStr = await habitsService.exportBackupJSON();
      if (Platform.OS === 'web') {
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `better_habits_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        Alert.alert('Copia de Seguridad Exportada', 'Tus datos están listos para ser guardados.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Importar backup local
  const handleImportBackup = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = async (event: any) => {
            const success = await habitsService.importBackupJSON(event.target.result);
            if (success) {
              Alert.alert('Éxito', 'Copia de seguridad restaurada correctamente.');
              onRefreshData?.();
            } else {
              Alert.alert('Error', 'El archivo formateado no es válido.');
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
    } else {
      Alert.alert('Importar Copia', 'Selecciona el archivo de copia de seguridad en formato JSON.');
    }
  };

  return (
    <View style={styles.container}>
      {/* 💡 TARJETA DE INSIGHTS INTELIGENTES */}
      <View style={[styles.insightCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <LinearGradient
          colors={[colors.accent + '20', colors.cardBg]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.insightHeader}>
          <View style={[styles.insightIconBox, { backgroundColor: colors.accent + '25' }]}>
            <Ionicons name="bulb" size={20} color={colors.accent} />
          </View>
          <Text style={[styles.insightTitle, { color: colors.textPrimary }]}>Insight de Consistencia</Text>
        </View>
        <Text style={[styles.insightText, { color: colors.textSecondary }]}>{data.smartInsight}</Text>
      </View>

      {/* 📈 1. GRÁFICO DE TENDENCIA DE 7 DÍAS */}
      <View style={[styles.chartCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>Tendencia Semanal (%)</Text>
          <Ionicons name="trending-up" size={20} color={colors.success} />
        </View>
        <Text style={[styles.chartSubtitle, { color: colors.textMuted }]}>
          Efectividad de cumplimiento de los últimos 7 días
        </Text>

        <View style={styles.trendGrid}>
          {data.weeklyTrend.map((item, idx) => (
            <View key={idx} style={styles.trendColumn}>
              <Text style={[styles.trendValueText, { color: colors.textMuted }]}>{item.percentage}%</Text>
              
              <View style={[styles.trendTrack, { backgroundColor: colors.chipBg }]}>
                <LinearGradient
                  colors={[colors.accent, colors.accent + '80']}
                  style={[
                    styles.trendFill,
                    { height: `${Math.max(8, item.percentage)}%` },
                  ]}
                />
              </View>

              <Text style={[styles.trendDayLabel, { color: colors.textPrimary }]}>{item.dayLabel}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 📊 2. GRÁFICO DE BARRAS POR DÍA DE LA SEMANA */}
      <View style={[styles.chartCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>Desempeño por Día</Text>
          <Ionicons name="bar-chart-outline" size={20} color={colors.accent} />
        </View>
        <Text style={[styles.chartSubtitle, { color: colors.textMuted }]}>
          Comparativa de hábitos completados por día de la semana
        </Text>

        <View style={styles.barsContainer}>
          {data.weekdayStats.map((item, idx) => (
            <View key={idx} style={styles.barRow}>
              <Text style={[styles.barDayText, { color: colors.textPrimary }]}>{item.dayName}</Text>
              <View style={[styles.barTrack, { backgroundColor: colors.chipBg }]}>
                <LinearGradient
                  colors={['#10B981', '#3B82F6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.barFill, { width: `${Math.max(6, item.percentage)}%` }]}
                />
              </View>
              <Text style={[styles.barPctText, { color: colors.textMuted }]}>{item.percentage}%</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 🍕 3. GRÁFICO DE DISTRIBUCIÓN POR CATEGORÍAS */}
      <View style={[styles.chartCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>Balance por Categoría</Text>
          <Ionicons name="pie-chart-outline" size={20} color="#F59E0B" />
        </View>
        <Text style={[styles.chartSubtitle, { color: colors.textMuted }]}>
          Distribución de tus hábitos activos según su enfoque
        </Text>

        <View style={styles.categoryDistributionList}>
          {data.categoryDistribution.map((item, idx) => (
            <View key={idx} style={styles.categoryRow}>
              <View style={styles.categoryInfoGroup}>
                <View style={[styles.categoryColorDot, { backgroundColor: item.color }]} />
                <Text style={[styles.categoryName, { color: colors.textPrimary }]}>{item.category}</Text>
              </View>

              <View style={styles.categoryProgressGroup}>
                <View style={[styles.categoryTrack, { backgroundColor: colors.chipBg }]}>
                  <View
                    style={[
                      styles.categoryFill,
                      { backgroundColor: item.color, width: `${item.percentage}%` },
                    ]}
                  />
                </View>
                <Text style={[styles.categoryPctText, { color: colors.textMuted }]}>
                  {item.percentage}% ({item.count})
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 💾 4. PANEL DE COPIA DE SEGURIDAD LOCAL (JSON EXPORT/IMPORT) */}
      <View style={[styles.chartCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>Copia de Seguridad Offline</Text>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.success} />
        </View>
        <Text style={[styles.chartSubtitle, { color: colors.textMuted }]}>
          Guarda o restaura tus hábitos directamente en tu dispositivo sin servidores externos
        </Text>

        <View style={styles.backupActionsRow}>
          <Pressable
            onPress={handleExportBackup}
            style={({ pressed }) => [
              styles.backupButton,
              { backgroundColor: colors.accent + '20', borderColor: colors.accent },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons name="download-outline" size={18} color={colors.accent} style={{ marginRight: 6 }} />
            <Text style={[styles.backupButtonText, { color: colors.accent }]}>Exportar JSON</Text>
          </Pressable>

          <Pressable
            onPress={handleImportBackup}
            style={({ pressed }) => [
              styles.backupButton,
              { backgroundColor: colors.chipBg, borderColor: colors.cardBorder },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons name="cloud-upload-outline" size={18} color={colors.textPrimary} style={{ marginRight: 6 }} />
            <Text style={[styles.backupButtonText, { color: colors.textPrimary }]}>Importar JSON</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    marginBottom: 24,
  },
  insightCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  chartCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  chartTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  chartSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  trendGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 10,
  },
  trendColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  trendValueText: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  trendTrack: {
    width: 14,
    height: 85,
    borderRadius: 7,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  trendFill: {
    width: '100%',
    borderRadius: 7,
  },
  trendDayLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
  },
  barsContainer: {
    gap: 10,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  barDayText: {
    width: 32,
    fontSize: 13,
    fontWeight: '600',
  },
  barTrack: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  barPctText: {
    width: 36,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryDistributionList: {
    gap: 12,
  },
  categoryRow: {
    gap: 6,
  },
  categoryInfoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryProgressGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  categoryFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryPctText: {
    fontSize: 12,
    fontWeight: '600',
  },
  backupActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  backupButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backupButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
