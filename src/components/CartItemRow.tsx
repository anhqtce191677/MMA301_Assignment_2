import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartItem } from '@/types/cart';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { formatVND } from '@/utils/format';

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (newQuantity: number) => void;
  onRemove: () => void;
  onPressItem?: () => void;
}

export const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
  onPressItem,
}) => {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { product, quantity } = item;
  const itemTotal = formatVND(product.price * quantity);

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <TouchableOpacity onPress={onPressItem} activeOpacity={0.8}>
        <Image source={{ uri: product.thumbnail }} style={styles.thumbnail} resizeMode="cover" />
      </TouchableOpacity>

      <View style={styles.info}>
        <TouchableOpacity onPress={onPressItem} activeOpacity={0.8}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {product.title}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.category, { color: theme.textMuted }]}>{product.category}</Text>
        <Text style={[styles.unitPrice, { color: theme.primary }]}>{formatVND(product.price)}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={onRemove} style={styles.removeBtn} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={18} color={theme.danger} />
        </TouchableOpacity>

        <View style={[styles.counter, { backgroundColor: theme.backgroundElement }]}>
          <TouchableOpacity
            style={styles.counterBtn}
            onPress={() => onUpdateQuantity(quantity - 1)}
            activeOpacity={0.7}
          >
            <Ionicons name="remove" size={14} color={theme.text} />
          </TouchableOpacity>

          <Text style={[styles.quantityText, { color: theme.text }]}>{quantity}</Text>

          <TouchableOpacity
            style={styles.counterBtn}
            onPress={() => onUpdateQuantity(quantity + 1)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={14} color={theme.text} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.itemTotal, { color: theme.text }]}>{itemTotal}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  thumbnail: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  category: {
    fontSize: 11,
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  unitPrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  actions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  removeBtn: {
    padding: 2,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  counterBtn: {
    padding: 4,
  },
  quantityText: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 8,
    minWidth: 24,
    textAlign: 'center',
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: '700',
  },
});
