import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export const LoadingSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <View style={[styles.imagePlaceholder, { backgroundColor: theme.backgroundElement }]} />
          <View style={styles.content}>
            <View style={[styles.line, { width: '85%', backgroundColor: theme.backgroundElement }]} />
            <View style={[styles.line, { width: '50%', backgroundColor: theme.backgroundElement }]} />
            <View style={[styles.priceLine, { backgroundColor: theme.backgroundElement }]} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
    gap: 16,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    width: '100%',
    height: 140,
  },
  content: {
    padding: 12,
    gap: 8,
  },
  line: {
    height: 12,
    borderRadius: 6,
  },
  priceLine: {
    height: 16,
    width: '60%',
    borderRadius: 8,
    marginTop: 4,
  },
});
