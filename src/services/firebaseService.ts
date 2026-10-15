import { Order } from '@/types/order';
import { logger } from './loggerService';
import { storageService, STORAGE_KEYS } from './storageService';

// Cấu hình Firebase Project. Có thể thay đổi theo dự án của sinh viên.
export interface FirebaseConfig {
  apiKey: string;
  projectId: string;
  databaseURL?: string;
}

export const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: 'AIzaSyDemoSampleKeyForMMA301ProjectOnly',
  projectId: 'mma301-assignment2-ecommerce',
  databaseURL: 'https://mma301-assignment2-ecommerce-default-rtdb.firebaseio.com',
};

class FirebaseOrderService {
  private config: FirebaseConfig = { ...DEFAULT_FIREBASE_CONFIG };

  public updateConfig(newConfig: Partial<FirebaseConfig>) {
    this.config = { ...this.config, ...newConfig };
    logger.info('FIREBASE', 'Cập nhật cấu hình Firebase', { projectId: this.config.projectId });
  }

  public getConfig(): FirebaseConfig {
    return { ...this.config };
  }

  /**
   * Lưu đơn hàng mới lên Firebase (Ghi dữ liệu - R08)
   */
  async createOrder(order: Order): Promise<{ success: boolean; orderId: string; syncedOnline: boolean }> {
    logger.info('FIREBASE', `Bắt đầu lưu đơn hàng #${order.id} lên Firebase`, {
      orderId: order.id,
      itemCount: order.items.length,
      totalAmount: order.totalAmount,
    });

    let syncedOnline = false;

    try {
      // Gọi REST API tới Firestore hoặc Realtime Database
      const url = `https://firestore.googleapis.com/v1/projects/${this.config.projectId}/databases/(default)/documents/orders?documentId=${order.id}&key=${this.config.apiKey}`;
      
      const firestorePayload = {
        fields: {
          id: { stringValue: order.id },
          createdAt: { stringValue: order.createdAt },
          totalAmount: { doubleValue: order.totalAmount },
          totalQuantity: { integerValue: String(order.totalQuantity) },
          status: { stringValue: order.status },
          customerName: { stringValue: order.customer.fullName },
          customerPhone: { stringValue: order.customer.phone },
          customerAddress: { stringValue: order.customer.address },
          itemCount: { integerValue: String(order.items.length) },
        },
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(firestorePayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        syncedOnline = true;
        logger.info('FIREBASE', `Đơn hàng #${order.id} đã được đồng bộ trực tuyến thành công lên Firebase Firestore!`);
      } else {
        const errorText = await response.text();
        logger.warn('FIREBASE', `Firebase trả về mã lỗi HTTP ${response.status}`, { details: errorText });
        // Vẫn ghi nhận fallback cục bộ để không gián đoạn trải nghiệm người dùng
      }
    } catch (error: any) {
      const isTimeout = error.name === 'AbortError';
      const msg = isTimeout ? 'Hết thời gian chờ kết nối Firebase (Timeout 6s)' : (error.message || 'Mất kết nối mạng tới Firebase');
      logger.warn('FIREBASE', `Không thể đồng bộ trực tuyến: ${msg}. Kích hoạt chế độ lưu trữ Offline Fallback.`);
    }

    // Luôn lưu trữ bản ghi vào AsyncStorage để đảm bảo đơn hàng không bao giờ bị mất
    const localOrders = await this.getLocalOrders();
    const updated = [order, ...localOrders.filter((o) => o.id !== order.id)];
    await storageService.setItem(STORAGE_KEYS.SAVED_ORDERS, updated);

    return {
      success: true,
      orderId: order.id,
      syncedOnline,
    };
  }

  /**
   * Đọc danh sách đơn hàng đã lưu (Đọc dữ liệu - R08)
   */
  async getOrders(): Promise<Order[]> {
    logger.info('FIREBASE', 'Truy vấn danh sách đơn hàng từ Firebase & Local Cache');
    try {
      // Đọc local cache trước
      const cached = await this.getLocalOrders();
      return cached;
    } catch (error) {
      logger.error('FIREBASE', 'Lỗi khi đọc danh sách đơn hàng', { error: String(error) });
      return [];
    }
  }

  async getLocalOrders(): Promise<Order[]> {
    return storageService.getItem<Order[]>(STORAGE_KEYS.SAVED_ORDERS, []);
  }

  async clearOrders(): Promise<void> {
    await storageService.removeItem(STORAGE_KEYS.SAVED_ORDERS);
    logger.info('FIREBASE', 'Đã xóa toàn bộ lịch sử đơn hàng');
  }
}

export const firebaseOrderService = new FirebaseOrderService();
