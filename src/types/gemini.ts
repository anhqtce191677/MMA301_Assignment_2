import { Product } from './product';

export interface ComparisonRequest {
  productA: Product;
  productB: Product;
}

export interface ComparisonResponse {
  summary: string;
  comparisonPoints: {
    feature: string;
    productAValue: string;
    productBValue: string;
    verdict: string;
  }[];
  recommendation: string;
}

export interface RecommendationRequest {
  userNeeds: string;
  budget?: number;
  category?: string;
}

export interface RecommendationResponse {
  advice: string;
  suggestedProductIds: number[];
  reasons: string[];
}
