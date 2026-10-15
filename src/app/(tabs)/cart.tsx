import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/hooks/useCart';
import { useFirebaseOrders } from '@/hooks/useFirebaseOrders';
import { CartItemRow } from '@/components/CartItemRow';
import { EmptyState } from '@/components/EmptyState';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { formatVND } from '@/utils/format';

export default function CartScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();

  const { items, totals, updateQuantity, removeFromCart, clearCart } = useCart();
  const { placeOrder, isSubmitting } = useFirebaseOrders();

  // Modal checkout
  const [isCheckoutModalVisible, setIsCheckoutModalVisible] = useState(false);
  const [customerName, setCustomerName] = useState('Nguyễn Văn An');
  const [customerPhone, setCustomerPhone] = useState('0912345678');
  const [customerAddress, setCustomerAddress] = useState('123 Đường Nguyễn Huệ, Quận 1, TP.HCM');

  const handleConfirmOrder = async () => {
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ giao hàng.');
      return;
    }

    const result = await placeOrder(items, totals.grandTotal, {
      fullName: customerName,
      phone: customerPhone,
      address: customerAddress,
    });

    if (result.success) {
      clearCart();
      setIsCheckoutModalVisible(false);
      Alert.alert(
        '🎉 Đặt hàng thành công!',
        `Đơn hàng #${result.orderId} đã được lưu vào hệ thống Firebase và kích hoạt thông báo xác nhận.`,
        [
          {
            text: 'Xem đơn hàng',
            onPress: () => router.push('/(tabs)/orders'),
          },
          { text: 'Đóng', style: 'cancel' },
        ]
      );
    } else {
      Alert.alert('Lỗi đặt hàng', result.error || 'Có lỗi xảy ra khi lưu đơn hàng lên Firebase.');
    }
  };

  const handleClearAll = () => {
    Alert.alert('Xóa giỏ hàng', 'Bạn có chắc muốn xóa tất cả sản phẩm trong giỏ hàng?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa sạch', style: 'destructive', onPress: clearCart },
    ]);
  };

  if (items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <EmptyState
          icon="cart-outline"
          title="Giỏ hàng đang trống"
          description="Bạn chưa chọn sản phẩm nào. Hãy khám phá danh mục và thêm món đồ bạn yêu thích nhé!"
          actionText="Bắt đầu mua sắm ngay"
          onAction={() => router.push('/(tabs)')}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Danh sách các sản phẩm trong giỏ (R05) */}
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.product.id)}
        renderItem={({ item }) => (
          <CartItemRow
            item={item}
            onUpdateQuantity={(newQty) => updateQuantity(item.product.id, newQty)}
            onRemove={() => removeFromCart(item.product.id)}
            onPressItem={() =>
              router.push({ pathname: '/product/[id]', params: { id: item.product.id } })
            }
          />
        )}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <View style={styles.topSummary}>
            <Text style={[styles.summaryTitle, { color: theme.text }]}>
              {totals.totalItems} món đồ đã chọn
            </Text>
            <TouchableOpacity onPress={handleClearAll} activeOpacity={0.7}>
              <Text style={[styles.clearText, { color: theme.danger }]}>Xóa tất cả</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Bảng tổng kết số liệu dẫn xuất derived totals (R06) */}
      <View
        style={[
          styles.summaryCard,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Tạm tính:</Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>
            {formatVND(totals.subtotal)}
          </Text>
        </View>

        {totals.discount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.success }]}>
              Ưu đãi đơn hàng (10%):
            </Text>
            <Text style={[styles.summaryValue, { color: theme.success }]}>
              -{formatVND(totals.discount)}
            </Text>
          </View>
        )}

        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Phí vận chuyển:</Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>
            {totals.shipping === 0 ? 'Miễn phí' : formatVND(totals.shipping)}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.grandTotalRow}>
          <View>
            <Text style={[styles.grandLabel, { color: theme.textMuted }]}>TỔNG THANH TOÁN</Text>
            <Text style={[styles.grandValue, { color: theme.primary }]}>
              {formatVND(totals.grandTotal)}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.checkoutBtn, { backgroundColor: theme.primary }]}
            onPress={() => setIsCheckoutModalVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.checkoutBtnText}>Tiến hành đặt hàng</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal nhập thông tin giao hàng & Checkout Firebase (R08) */}
      <Modal
        visible={isCheckoutModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCheckoutModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Thông tin nhận hàng</Text>
              <TouchableOpacity
                onPress={() => setIsCheckoutModalVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Họ và tên</Text>
              <TextInput
                style={[
                  styles.formInput,
                  { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.border },
                ]}
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Nhập họ và tên"
                placeholderTextColor={theme.textMuted}
              />

              <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Số điện thoại</Text>
              <TextInput
                style={[
                  styles.formInput,
                  { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.border },
                ]}
                value={customerPhone}
                onChangeText={setCustomerPhone}
                placeholder="Số điện thoại liên hệ"
                placeholderTextColor={theme.textMuted}
                keyboardType="phone-pad"
              />

              <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Địa chỉ giao hàng</Text>
              <TextInput
                style={[
                  styles.formInput,
                  styles.multilineInput,
                  { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.border },
                ]}
                value={customerAddress}
                onChangeText={setCustomerAddress}
                placeholder="Địa chỉ số nhà, tên đường, phường/xã..."
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={2}
              />

              <View
                style={[
                  styles.modalOrderSummary,
                  { backgroundColor: theme.backgroundElement },
                ]}
              >
                <Text style={[styles.summaryNotice, { color: theme.textSecondary }]}>
                  Số lượng: {totals.totalItems} sản phẩm • Tổng tiền: {formatVND(totals.grandTotal)}
                </Text>
                <Text style={[styles.paymentMethodText, { color: theme.textMuted }]}>
                  Phương thức: Thanh toán khi nhận hàng (COD)
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  { backgroundColor: theme.primary },
                  isSubmitting && { opacity: 0.7 },
                ]}
                onPress={handleConfirmOrder}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.confirmBtnText}>Xác nhận đặt hàng (Firebase)</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 160,
  },
  topSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  clearText: {
    fontSize: 13,
    fontWeight: '600',
  },
  summaryCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  grandValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 8,
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  modalForm: {
    gap: 8,
    paddingBottom: 20,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  formInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  multilineInput: {
    height: 70,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  modalOrderSummary: {
    padding: 12,
    borderRadius: 12,
    marginVertical: 12,
    gap: 4,
  },
  summaryNotice: {
    fontSize: 13,
    fontWeight: '600',
  },
  paymentMethodText: {
    fontSize: 12,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 25,
    gap: 8,
    marginTop: 8,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
