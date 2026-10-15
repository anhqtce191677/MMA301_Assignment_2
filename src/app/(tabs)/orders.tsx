import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFirebaseOrders } from '@/hooks/useFirebaseOrders';
import { OrderCard } from '@/components/OrderCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorView } from '@/components/ErrorView';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';

export default function OrdersScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();

  const { orders, isLoading, error, refreshOrders, clearHistory } = useFirebaseOrders();

  const handleClearHistory = () => {
    Alert.alert('Xóa lịch sử', 'Bạn có chắc chắn muốn xóa tất cả lịch sử đơn hàng đã lưu?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa sạch', style: 'destructive', onPress: clearHistory },
    ]);
  };

  if (isLoading && orders.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Đang kết nối Firebase và tải đơn hàng...
        </Text>
      </View>
    );
  }

  if (error && orders.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ErrorView message={error} onRetry={refreshOrders} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OrderCard order={item} />}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          orders.length > 0 ? (
            <View style={styles.headerRow}>
              <View style={styles.firebaseStatus}>
                <View style={[styles.statusDot, { backgroundColor: theme.success }]} />
                <Text style={[styles.firebaseText, { color: theme.textSecondary }]}>
                  Đồng bộ Firebase Firestore • {orders.length} đơn hàng
                </Text>
              </View>

              <TouchableOpacity onPress={handleClearHistory} activeOpacity={0.7}>
                <Text style={[styles.clearBtn, { color: theme.danger }]}>Dọn dẹp</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="Chưa có đơn hàng nào"
            description="Lịch sử mua sắm và trạng thái xử lý đơn hàng từ Firebase sẽ hiển thị tại đây sau khi bạn đặt hàng."
            actionText="Mua sắm ngay"
            onAction={() => router.push('/(tabs)')}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshOrders}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  firebaseStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  firebaseText: {
    fontSize: 12,
    fontWeight: '600',
  },
  clearBtn: {
    fontSize: 12,
    fontWeight: '600',
  },
});
