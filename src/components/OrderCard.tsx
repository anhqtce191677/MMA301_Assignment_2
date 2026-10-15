import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order } from '@/types/order';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { formatVND } from '@/utils/format';

interface OrderCardProps {
  order: Order;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const formattedDate = new Date(order.createdAt).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.header}>
        <View style={styles.idRow}>
          <Ionicons name="receipt-outline" size={18} color={theme.primary} />
          <Text style={[styles.orderId, { color: theme.text }]}>Đơn hàng #{order.id}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: theme.primaryLight }]}>
          <Text style={[styles.statusText, { color: theme.primary }]}>
            {order.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={[styles.date, { color: theme.textMuted }]}>{formattedDate}</Text>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.itemsList}>
        {order.items.slice(0, 3).map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>
              • {item.product.title}
            </Text>
            <Text style={[styles.itemQty, { color: theme.textSecondary }]}>
              x{item.quantity} ({formatVND(item.product.price * item.quantity)})
            </Text>
          </View>
        ))}
        {order.items.length > 3 && (
          <Text style={[styles.moreText, { color: theme.textMuted }]}>
            + {order.items.length - 3} sản phẩm khác...
          </Text>
        )}
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.footer}>
        <View>
          <Text style={[styles.customerLabel, { color: theme.textMuted }]}>Người nhận:</Text>
          <Text style={[styles.customerValue, { color: theme.textSecondary }]}>
            {order.customer.fullName} ({order.customer.phone})
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.totalLabel, { color: theme.textMuted }]}>Tổng tiền:</Text>
          <Text style={[styles.totalAmount, { color: theme.primary }]}>
            {formatVND(order.totalAmount)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  date: {
    fontSize: 12,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  itemsList: {
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  itemQty: {
    fontSize: 13,
    fontWeight: '500',
  },
  moreText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerLabel: {
    fontSize: 11,
  },
  customerValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  totalLabel: {
    fontSize: 11,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
});
