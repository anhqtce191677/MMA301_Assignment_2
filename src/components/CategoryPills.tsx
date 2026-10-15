import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { CategoryItem } from '@/types/product';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';

interface CategoryPillsProps {
  categories: CategoryItem[];
  selectedCategory: string | null;
  onSelect: (slug: string | null) => void;
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  categories,
  selectedCategory,
  onSelect,
}) => {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <TouchableOpacity
        style={[
          styles.pill,
          selectedCategory === null
            ? { backgroundColor: theme.primary, borderColor: theme.primary }
            : { backgroundColor: theme.card, borderColor: theme.border },
        ]}
        onPress={() => onSelect(null)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.text,
            { color: selectedCategory === null ? '#FFFFFF' : theme.text },
          ]}
        >
          Tất cả
        </Text>
      </TouchableOpacity>

      {categories.map((cat) => {
        const isSelected = selectedCategory === cat.slug;
        return (
          <TouchableOpacity
            key={cat.slug}
            style={[
              styles.pill,
              isSelected
                ? { backgroundColor: theme.primary, borderColor: theme.primary }
                : { backgroundColor: theme.card, borderColor: theme.border },
            ]}
            onPress={() => onSelect(cat.slug)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.text,
                { color: isSelected ? '#FFFFFF' : theme.text },
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
});
