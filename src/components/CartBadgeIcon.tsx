import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/hooks/useCart';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';

interface CartBadgeIconProps {
  color?: any;
  size?: number;
  focused?: boolean;
}

export const CartBadgeIcon: React.FC<CartBadgeIconProps> = ({
  color = '#000',
  size = 24,
  focused = false,
}) => {
  const { totals } = useCart();
  const count = totals.totalItems;

  return (
    <View style={styles.container}>
      <Ionicons name={focused ? 'cart' : 'cart-outline'} size={size} color={color} />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
