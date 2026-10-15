import { useState, useEffect, useCallback } from 'react';
import { notificationService, NotificationPermissionStatus } from '@/services/notificationService';

export function useNotification() {
  const [permission, setPermission] = useState<NotificationPermissionStatus>({
    granted: false,
    canAskAgain: true,
    status: 'undetermined',
  });
  const [isRequesting, setIsRequesting] = useState<boolean>(false);

  const checkStatus = useCallback(async () => {
    const status = await notificationService.getPermissionStatus();
    setPermission(status);
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const requestPermission = async (): Promise<boolean> => {
    setIsRequesting(true);
    try {
      const granted = await notificationService.requestPermission();
      await checkStatus();
      return granted;
    } finally {
      setIsRequesting(false);
    }
  };

  const sendTestPromo = async () => {
    return notificationService.notifyPromoDeal('Black Myth: Wukong', 20);
  };

  return {
    permission,
    isRequesting,
    requestPermission,
    checkStatus,
    sendTestPromo,
  };
}
