import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { CartItem, CartTotals } from '@/types/cart';
import { Product } from '@/types/product';
import { storageService, STORAGE_KEYS } from '@/services/storageService';
import { logger } from '@/services/loggerService';

interface CartContextType {
  items: CartItem[];
  totals: CartTotals;
  isLoading: boolean;
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Khôi phục giỏ hàng từ AsyncStorage khi ứng dụng khởi chạy (R07)
  useEffect(() => {
    let isMounted = true;
    const loadPersistedCart = async () => {
      try {
        const savedItems = await storageService.getItem<CartItem[]>(STORAGE_KEYS.CART, []);
        if (isMounted) {
          // Tự động chuẩn hóa giá sang VNĐ nếu dữ liệu cũ còn lưu USD
          const normalized = savedItems.map((item) => {
            if (item.product && item.product.price < 10000) {
              return {
                ...item,
                product: {
                  ...item.product,
                  price: Math.round(item.product.price * 25000),
                },
              };
            }
            return item;
          });
          setItems(normalized);
          logger.info('CART', `Đã khôi phục giỏ hàng từ bộ nhớ: ${normalized.length} loại sản phẩm`);
        }
      } catch (e) {
        logger.error('CART', 'Lỗi khi khôi phục giỏ hàng', { error: String(e) });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadPersistedCart();
    return () => {
      isMounted = false;
    };
  }, []);


  const addToCart = (product: Product, quantity = 1) => {
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.product.id === product.id);
      let updated: CartItem[];

      if (existingIndex > -1) {
        updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        logger.info('CART', `Tăng số lượng sản phẩm: "${product.title}" lên ${updated[existingIndex].quantity}`);
      } else {
        updated = [...prevItems, { product, quantity }];
        logger.info('CART', `Thêm sản phẩm mới vào giỏ: "${product.title}" (x${quantity})`);
      }

      storageService.setItem(STORAGE_KEYS.CART, updated);
      return updated;
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems((prevItems) => {
      const updated = prevItems.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );
      storageService.setItem(STORAGE_KEYS.CART, updated);
      logger.info('CART', `Cập nhật số lượng sản phẩm #${productId} thành ${quantity}`);
      return updated;
    });
  };

  const removeFromCart = (productId: number) => {
    setItems((prevItems) => {
      const itemToRemove = prevItems.find((i) => i.product.id === productId);
      const updated = prevItems.filter((item) => item.product.id !== productId);
      storageService.setItem(STORAGE_KEYS.CART, updated);
      logger.info('CART', `Đã xóa sản phẩm: "${itemToRemove?.product.title || productId}" khỏi giỏ hàng`);
      return updated;
    });
  };

  const clearCart = () => {
    setItems([]);
    storageService.removeItem(STORAGE_KEYS.CART);
    logger.info('CART', 'Đã dọn dẹp sạch giỏ hàng');
  };

  // Tính toán các số liệu dẫn xuất derived totals theo VNĐ (R06)
  const totals: CartTotals = useMemo(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const discount = subtotal > 2000000 ? Math.round(subtotal * 0.1) : 0; // Giảm 10% nếu trên 2.000.000 ₫
    const shipping = subtotal > 0 && subtotal < 1000000 ? 30000 : 0; // Miễn phí giao key / vận chuyển đơn > 1.000.000 ₫
    const grandTotal = Math.max(0, subtotal - discount + shipping);

    return {
      totalItems,
      subtotal: Math.round(subtotal),
      discount: Math.round(discount),
      shipping: Math.round(shipping),
      grandTotal: Math.round(grandTotal),
    };
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        totals,
        isLoading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart phải được sử dụng bên trong CartProvider');
  }
  return context;
};
