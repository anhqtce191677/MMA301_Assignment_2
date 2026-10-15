import { useState, useCallback } from 'react';
import { Product } from '@/types/product';
import { ComparisonResponse, RecommendationResponse } from '@/types/gemini';
import { geminiService } from '@/services/geminiService';

export function useGeminiAdvisor() {
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [isAdvising, setIsAdvising] = useState<boolean>(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResponse | null>(null);
  const [adviceResult, setAdviceResult] = useState<RecommendationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const compareProducts = useCallback(async (productA: Product, productB: Product) => {
    try {
      setIsComparing(true);
      setError(null);
      const res = await geminiService.compareProducts(productA, productB);
      setComparisonResult(res);
      return res;
    } catch (err: any) {
      const msg = err.message || 'Lỗi khi so sánh sản phẩm bằng AI';
      setError(msg);
      return null;
    } finally {
      setIsComparing(false);
    }
  }, []);

  const getAdvice = useCallback(
    async (userNeeds: string, budget: number | undefined, availableProducts: Product[]) => {
      try {
        setIsAdvising(true);
        setError(null);
        const res = await geminiService.getShoppingAdvice(userNeeds, budget, availableProducts);
        setAdviceResult(res);
        return res;
      } catch (err: any) {
        const msg = err.message || 'Lỗi khi nhận tư vấn từ AI';
        setError(msg);
        return null;
      } finally {
        setIsAdvising(false);
      }
    },
    []
  );

  const clearResults = useCallback(() => {
    setComparisonResult(null);
    setAdviceResult(null);
    setError(null);
  }, []);

  return {
    isComparing,
    isAdvising,
    comparisonResult,
    adviceResult,
    error,
    compareProducts,
    getAdvice,
    clearResults,
  };
}
