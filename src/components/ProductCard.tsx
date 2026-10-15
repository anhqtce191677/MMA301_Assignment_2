import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '@/types/product';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { formatVND } from '@/utils/format';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onAddToCart?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, onAddToCart }) => {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const originalPrice = product.discountPercentage
    ? Math.round(product.price / (1 - product.discountPercentage / 100))
    : null;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.thumbnail }}
          style={styles.image}
          resizeMode="cover"
        />
        {Boolean(product.discountPercentage && product.discountPercentage > 5) && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{Math.round(product.discountPercentage || 0)}%</Text>
          </View>
        )}
      </View>

      <View style={styles.details}>
        <Text style={[styles.category, { color: theme.textMuted }]} numberOfLines={1}>
          {product.category?.toUpperCase()}
        </Text>

        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
          {product.title}
        </Text>

        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color={theme.warning} />
          <Text style={[styles.ratingText, { color: theme.textSecondary }]}>
            {product.rating?.toFixed(1)}
          </Text>
          <Text style={[styles.stockText, { color: product.stock < 10 ? theme.danger : theme.success }]}>
            {product.stock < 10 ? `Chỉ còn ${product.stock} key` : 'Sẵn key'}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <View>
            <Text style={[styles.price, { color: theme.primary }]}>{formatVND(product.price)}</Text>
            {originalPrice && (
              <Text style={[styles.originalPrice, { color: theme.textMuted }]}>
                {formatVND(originalPrice)}
              </Text>
            )}
          </View>

          {onAddToCart && (
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: theme.primaryLight }]}
              onPress={(e) => {
                e.stopPropagation();
                onAddToCart();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="cart-outline" size={18} color={theme.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  imageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  details: {
    padding: 12,
  },
  category: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    height: 36,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  stockText: {
    fontSize: 11,
    marginLeft: 'auto',
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
  },
  originalPrice: {
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
