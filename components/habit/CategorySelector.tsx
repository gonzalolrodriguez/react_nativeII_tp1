import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { HabitCategory } from '@/types/habit';
import { useTheme } from '@/context/ThemeContext';

export interface CategoryItem {
  label: HabitCategory;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { label: 'Salud', icon: 'heart', color: '#10B981' },
  { label: 'Estudio', icon: 'book', color: '#3B82F6' },
  { label: 'Deporte', icon: 'fitness', color: '#F59E0B' },
  { label: 'Productividad', icon: 'flash', color: '#8B5CF6' },
  { label: 'Otro', icon: 'sparkles', color: '#EC4899' },
];

interface CategorySelectorProps {
  selectedCategory: HabitCategory;
  onSelectCategory: (category: HabitCategory, color: string) => void;
  categories?: CategoryItem[];
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  onSelectCategory,
  categories = DEFAULT_CATEGORIES,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>Categoría</Text>
      <View style={styles.grid}>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.label;
          return (
            <Pressable
              key={cat.label}
              onPress={() => {
                Haptics.selectionAsync();
                onSelectCategory(cat.label, cat.color);
              }}
              style={[
                styles.categoryCard,
                {
                  backgroundColor: isSelected ? `${cat.color}25` : colors.surfaceCard,
                  borderColor: isSelected ? cat.color : colors.cardBorder,
                },
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: isSelected ? cat.color : `${colors.textMuted}20` },
                ]}
              >
                <Ionicons
                  name={cat.icon}
                  size={18}
                  color={isSelected ? '#FFFFFF' : colors.textSecondary}
                />
              </View>
              <Text
                style={[
                  styles.categoryText,
                  {
                    color: isSelected ? colors.textPrimary : colors.textSecondary,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}
              >
                {cat.label}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    fontSize: 13,
  },
});
