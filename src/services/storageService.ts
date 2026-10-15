import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './loggerService';

export const STORAGE_KEYS = {
  CART: '@app_cart_items',
  SAVED_ORDERS: '@app_saved_orders',
  USER_SETTINGS: '@app_user_settings',
  GEMINI_API_KEY: '@app_gemini_api_key',
};

export const storageService = {
  async setItem<T>(key: string, value: T): Promise<boolean> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      return true;
    } catch (error) {
      logger.error('STORAGE', `Failed to write key ${key}`, { error: String(error) });
      return false;
    }
  },

  async getItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      if (jsonValue !== null) {
        return JSON.parse(jsonValue) as T;
      }
      return defaultValue;
    } catch (error) {
      logger.error('STORAGE', `Failed to read key ${key}`, { error: String(error) });
      return defaultValue;
    }
  },

  async removeItem(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      logger.error('STORAGE', `Failed to remove key ${key}`, { error: String(error) });
      return false;
    }
  },

  async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      logger.info('STORAGE', 'AsyncStorage completely cleared');
      return true;
    } catch (error) {
      logger.error('STORAGE', 'Failed to clear storage', { error: String(error) });
      return false;
    }
  },
};
