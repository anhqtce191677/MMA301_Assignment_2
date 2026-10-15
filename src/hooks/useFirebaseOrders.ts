import { useState, useEffect, useCallback } from 'react';
import { Order, OrderCustomerInfo } from '@/types/order';
import { CartItem } from '@/types/cart';
import { firebaseOrderService } from '@/services/firebaseService';
import { notificationService } from '@/services/notificationService';
import { logger } from '@/services/loggerService';

export function useFirebaseOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await firebaseOrderService.getOrders();
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải lịch sử đơn hàng');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const placeOrder = async (
    items: CartItem[],
    totalAmount: number,
    customer: OrderCustomerInfo
  ): Promise<{ success: boolean; orderId?: string; error?: string }> => {
    if (!items.length) {
      return { success: false, error: 'Giỏ hàng của bạn đang trống' };
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const newOrder: Order = {
        id: `ORD-${Date.now().toString().slice(-6)}`,
        items,
        totalAmount,
        totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
        customer,
        createdAt: new Date().toISOString(),
        status: 'pending',
        paymentMethod: 'COD (Thanh toán khi nhận hàng)',
      };

      const result = await firebaseOrderService.createOrder(newOrder);

      if (result.success) {
        // Cập nhật state danh sách đơn hàng
        setOrders((prev) => [newOrder, ...prev]);

        // Kích hoạt thông báo xác nhận đơn hàng thành công (R09)
        await notificationService.notifyOrderPlaced(newOrder.id, newOrder.totalAmount);

        logger.info('ORDER', `Đặt đơn hàng #${newOrder.id} thành công!`);
        return { success: true, orderId: newOrder.id };
      } else {
        throw new Error('Không thể xử lý đơn hàng lúc này');
      }
    } catch (err: any) {
      const errMsg = err.message || 'Lỗi khi lưu đơn hàng vào hệ thống';
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearHistory = async () => {
    await firebaseOrderService.clearOrders();
    setOrders([]);
  };

  return {
    orders,
    isLoading,
    isSubmitting,
    error,
    refreshOrders: loadOrders,
    placeOrder,
    clearHistory,
  };
}
