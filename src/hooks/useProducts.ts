import { useState, useEffect, useCallback, useRef } from 'react';
import { Product, CategoryItem } from '@/types/product';
import { productService } from '@/services/productService';
import { API_CONFIG } from '@/constants/api';
import { logger } from '@/services/loggerService';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const skipRef = useRef<number>(0);
  const searchTimeoutRef = useRef<any>(null);

  // Tải danh sách categories lúc khởi tạo
  useEffect(() => {
    let isMounted = true;
    productService
      .getCategories()
      .then((cats) => {
        if (isMounted) setCategories(cats);
      })
      .catch((err) => {
        logger.warn('HOOK_PRODUCTS', 'Không thể tải categories ban đầu', { error: String(err) });
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Hàm load dữ liệu chính
  const loadData = useCallback(
    async (isRefresh = false, query = searchQuery, category = selectedCategory) => {
      try {
        if (isRefresh) {
          setIsRefreshing(true);
          skipRef.current = 0;
        } else {
          setIsLoading(true);
          skipRef.current = 0;
        }
        setError(null);

        let res;
        if (query.trim()) {
          res = await productService.searchProducts(query, API_CONFIG.DEFAULT_PAGE_SIZE, 0);
        } else if (category) {
          res = await productService.getProductsByCategory(category, API_CONFIG.DEFAULT_PAGE_SIZE, 0);
        } else {
          res = await productService.getProducts(API_CONFIG.DEFAULT_PAGE_SIZE, 0);
        }

        setProducts(res.products);
        skipRef.current = res.products.length;
        setHasMore(skipRef.current < res.total);
      } catch (err: any) {
        setError(err.message || 'Không thể tải danh sách sản phẩm');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [searchQuery, selectedCategory]
  );

  // Kích hoạt load khi category thay đổi
  useEffect(() => {
    loadData(false, searchQuery, selectedCategory);
  }, [selectedCategory]);

  // Cuộn vô hạn để tải thêm dữ liệu (Pagination / Infinite Scrolling - R02)
  const fetchNextPage = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore || error) return;

    try {
      setIsLoadingMore(true);
      let res;
      if (searchQuery.trim()) {
        res = await productService.searchProducts(
          searchQuery,
          API_CONFIG.DEFAULT_PAGE_SIZE,
          skipRef.current
        );
      } else if (selectedCategory) {
        res = await productService.getProductsByCategory(
          selectedCategory,
          API_CONFIG.DEFAULT_PAGE_SIZE,
          skipRef.current
        );
      } else {
        res = await productService.getProducts(API_CONFIG.DEFAULT_PAGE_SIZE, skipRef.current);
      }

      setProducts((prev) => {
        // Lọc trùng lặp ID
        const existingIds = new Set(prev.map((p) => p.id));
        const newUnique = res.products.filter((p) => !existingIds.has(p.id));
        return [...prev, ...newUnique];
      });

      skipRef.current += res.products.length;
      setHasMore(skipRef.current < res.total);
    } catch (err: any) {
      logger.warn('HOOK_PRODUCTS', 'Lỗi khi tải trang tiếp theo', { error: String(err) });
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoading, isLoadingMore, hasMore, error, searchQuery, selectedCategory]);

  // Tìm kiếm với Debounce (Search/Filter - R03)
  const handleSearch = useCallback(
    (text: string) => {
      setSearchQuery(text);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        loadData(false, text, selectedCategory);
      }, 400);
    },
    [loadData, selectedCategory]
  );

  const handleSelectCategory = useCallback(
    (categorySlug: string | null) => {
      const nextCategory = categorySlug === selectedCategory ? null : categorySlug;
      setSelectedCategory(nextCategory);
    },
    [selectedCategory]
  );

  const handleRefresh = useCallback(() => {
    loadData(true, searchQuery, selectedCategory);
  }, [loadData, searchQuery, selectedCategory]);

  const handleRetry = useCallback(() => {
    loadData(false, searchQuery, selectedCategory);
  }, [loadData, searchQuery, selectedCategory]);

  return {
    products,
    categories,
    selectedCategory,
    searchQuery,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    hasMore,
    fetchNextPage,
    refresh: handleRefresh,
    retry: handleRetry,
    search: handleSearch,
    selectCategory: handleSelectCategory,
  };
}
