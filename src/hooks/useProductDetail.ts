import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/types/product';
import { productService } from '@/services/productService';

export function useProductDetail(productId: string | number | undefined) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!productId) {
      setError('Mã sản phẩm không hợp lệ');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await productService.getProductById(productId);
      setProduct(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải chi tiết sản phẩm');
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return {
    product,
    isLoading,
    error,
    retry: fetchDetail,
  };
}
