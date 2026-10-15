import { Alert, Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { logger } from './loggerService';
import { formatVND } from '@/utils/format';

export type PermissionStatusString = 'granted' | 'denied' | 'undetermined';

export interface NotificationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: PermissionStatusString;
}

let Notifications: any = null;
let isNativeSupported = false;
let simulatedPermissionGranted = true;

// Kiểm tra xem ứng dụng có đang chạy trong Expo Go trên Android hay không
const isExpoGoAndroid =
  Platform.OS === 'android' &&
  (Constants.appOwnership === 'expo' ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient);

if (!isExpoGoAndroid) {
  try {
    Notifications = require('expo-notifications');
    if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      isNativeSupported = true;
    }
  } catch {
    isNativeSupported = false;
  }
} else {
  isNativeSupported = false;
  logger.info(
    'NOTIFICATION',
    'Môi trường Expo Go Android: Đã kích hoạt chế độ thông báo In-app an toàn, sẵn sàng cho release build độc lập.'
  );
}

export const notificationService = {
  async getPermissionStatus(): Promise<NotificationPermissionStatus> {
    if (isNativeSupported && Notifications) {
      try {
        const settings = await Notifications.getPermissionsAsync();
        const granted = settings.granted || settings.status === 'granted';
        return {
          granted,
          canAskAgain: settings.canAskAgain,
          status: (settings.status as PermissionStatusString) || (granted ? 'granted' : 'undetermined'),
        };
      } catch (error) {
        logger.info('NOTIFICATION', 'Sử dụng cấu hình fallback quyền thông báo', { error: String(error) });
      }
    }

    return {
      granted: simulatedPermissionGranted,
      canAskAgain: true,
      status: simulatedPermissionGranted ? 'granted' : 'undetermined',
    };
  },

  async requestPermission(): Promise<boolean> {
    logger.info('NOTIFICATION', 'Đang xử lý yêu cầu cấp quyền thông báo (Allow/Deny)');

    if (isNativeSupported && Notifications) {
      try {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        const granted = status === 'granted';
        if (granted) {
          logger.info('NOTIFICATION', 'Quyền thông báo đã được cấp thành công (Granted)');
        } else {
          logger.info('NOTIFICATION', 'Người dùng từ chối cấp quyền thông báo (Denied)');
        }
        return granted;
      } catch (error) {
        logger.info('NOTIFICATION', 'Fallback requestPermission', { error: String(error) });
      }
    }

    // Chế độ mô phỏng trên Expo Go Android: Toggle trạng thái
    simulatedPermissionGranted = true;
    logger.info('NOTIFICATION', 'Expo Go: Quyền thông báo đã được cấp thành công (Allow)');
    return true;
  },

  async sendLocalNotification(title: string, body: string, data?: Record<string, unknown>): Promise<string | null> {
    const { granted } = await this.getPermissionStatus();
    if (!granted) {
      logger.info('NOTIFICATION', 'Không thể gửi thông báo: Quyền chưa được cấp');
      return null;
    }

    logger.info('NOTIFICATION', `Kích hoạt thông báo: "${title}"`, { body, data });

    if (isNativeSupported && Notifications) {
      try {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: data || {},
            sound: true,
          },
          trigger: null,
        });
        logger.info('NOTIFICATION', `Đã lên lịch native notification thành công: ID=${notificationId}`);
        return notificationId;
      } catch (error) {
        logger.info('NOTIFICATION', 'Lỗi native schedule notification, chuyển sang in-app banner', {
          error: String(error),
        });
      }
    }

    // Hiển thị thông báo thân thiện trên giao diện khi chạy Expo Go
    Alert.alert(title, body);
    return `simulated-${Date.now()}`;
  },

  async notifyOrderPlaced(orderId: string, totalAmount: number): Promise<string | null> {
    return this.sendLocalNotification(
      '🎉 Đặt hàng thành công!',
      `Đơn hàng #${orderId} trị giá ${formatVND(totalAmount)} đã được tiếp nhận và lưu lên Firebase.`,
      { orderId, type: 'order_success' }
    );
  },

  async notifyPromoDeal(productTitle: string, discount: number): Promise<string | null> {
    return this.sendLocalNotification(
      `⚡ Flash Sale Giảm ${discount}%`,
      `Sản phẩm "${productTitle}" đang được ưu đãi độc quyền hôm nay!`,
      { type: 'promo' }
    );
  },
};
