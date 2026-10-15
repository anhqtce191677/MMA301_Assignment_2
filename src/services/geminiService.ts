import { Product } from '@/types/product';
import { ComparisonResponse, RecommendationResponse } from '@/types/gemini';
import { logger } from './loggerService';
import { storageService, STORAGE_KEYS } from './storageService';
import { formatVND } from '@/utils/format';

export class GeminiService {
  private defaultApiKey = '';

  async getApiKey(): Promise<string> {
    const saved = await storageService.getItem<string>(STORAGE_KEYS.GEMINI_API_KEY, '');
    return saved || this.defaultApiKey;
  }

  async setApiKey(key: string): Promise<void> {
    await storageService.setItem(STORAGE_KEYS.GEMINI_API_KEY, key.trim());
    logger.info('GEMINI', 'Cập nhật khóa bí mật Gemini API Key');
  }

  /**
   * Tính năng 1: So sánh thông minh 2 tựa game nổi tiếng
   */
  async compareProducts(productA: Product, productB: Product): Promise<ComparisonResponse> {
    logger.info('GEMINI', `Yêu cầu so sánh 2 tựa game: "${productA.title}" VS "${productB.title}"`);
    const apiKey = await this.getApiKey();

    const prompt = `
Bạn là chuyên gia thẩm định và phê bình video game (Game Critic & Gaming Advisor) chuyên nghiệp.
Hãy so sánh hai tựa game nổi tiếng sau đây trong kho Game Store:
Game A:
- Tên: ${productA.title}
- Nhà phát triển/Hãng: ${productA.brand || 'N/A'}
- Giá: ${formatVND(productA.price)} (Ưu đãi: -${productA.discountPercentage || 0}%)
- Thể loại: ${productA.category}
- Điểm đánh giá: ${productA.rating}/5.0 sao
- Mô tả: ${productA.description}

Game B:
- Tên: ${productB.title}
- Nhà phát triển/Hãng: ${productB.brand || 'N/A'}
- Giá: ${formatVND(productB.price)} (Ưu đãi: -${productB.discountPercentage || 0}%)
- Thể loại: ${productB.category}
- Điểm đánh giá: ${productB.rating}/5.0 sao
- Mô tả: ${productB.description}

Yêu cầu trả về kết quả thuần JSON theo đúng định dạng sau (không bao gồm ký tự markdown \`\`\`json):
{
  "summary": "Tóm tắt ngắn gọn 2-3 câu so sánh sự khác biệt nổi bật về trải nghiệm và phong cách giữa 2 tựa game",
  "comparisonPoints": [
    {
      "feature": "Đồ họa & Thế giới trong game",
      "productAValue": "Đánh giá đồ họa của game A",
      "productBValue": "Đánh giá đồ họa của game B",
      "verdict": "Nhận xét tựa game nào có đồ họa/thế giới ấn tượng hơn"
    },
    {
      "feature": "Lối chơi (Gameplay) & Độ khó",
      "productAValue": "Phong cách chiến đấu/gameplay game A",
      "productBValue": "Phong cách chiến đấu/gameplay game B",
      "verdict": "Game nào thử thách kỹ năng hơn hoặc dễ tiếp cận hơn"
    },
    {
      "feature": "Mức giá & Đáng tiền (Value for Money)",
      "productAValue": "${formatVND(productA.price)} (-${productA.discountPercentage || 0}%)",
      "productBValue": "${formatVND(productB.price)} (-${productB.discountPercentage || 0}%)",
      "verdict": "Đánh giá tựa game nào có tỷ lệ thời lượng chơi/giá thành tối ưu hơn"
    }
  ],
  "recommendation": "Khuyến nghị game thủ nên mua tựa game nào tùy theo phong cách chơi game và sở thích"
}
`;

    if (!apiKey) {
      logger.info('GEMINI', 'Sử dụng hệ thống phân tích đối chiếu game offline.');
      return this.generateLocalFallbackComparison(productA, productB);
    }

    try {
      const response = await this.callGeminiApi(prompt, apiKey);
      const parsed: ComparisonResponse = JSON.parse(response);
      logger.info('GEMINI', 'Đã phân tích thành công phản hồi so sánh game từ Gemini');
      return parsed;
    } catch (error) {
      logger.error('GEMINI', 'Lỗi khi gọi Gemini API, chuyển sang phân tích nội bộ', { error: String(error) });
      return this.generateLocalFallbackComparison(productA, productB);
    }
  }

  /**
   * Tính năng 2: Tư vấn chọn game theo sở thích & ngân sách dựa trên Catalog
   */
  async getShoppingAdvice(userNeeds: string, budget: number | undefined, availableProducts: Product[]): Promise<RecommendationResponse> {
    logger.info('GEMINI', `Tư vấn mua game: Yêu cầu="${userNeeds}", Ngân sách=${budget || 'Không giới hạn'}`);
    const apiKey = await this.getApiKey();

    const productSummaries = availableProducts.slice(0, 10).map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      rating: p.rating,
      category: p.category,
      brand: p.brand,
    }));

    const prompt = `
Bạn là trợ lý tư vấn game thông minh của GameStore Pro.
Khách hàng có sở thích/nhu cầu: "${userNeeds}".
Ngân sách dự kiến: ${budget ? `${formatVND(budget)}` : 'Tự do'}.
Lưu ý quan trọng: Cửa hàng KHÔNG kinh doanh tựa game PUBG (PlayerUnknown's Battlegrounds). Tuyệt đối không gợi ý game PUBG.

Dưới đây là danh sách các tựa game bản quyền hiện có trong kho:
${JSON.stringify(productSummaries, null, 2)}

Hãy chọn ra từ 1 đến 3 tựa game phù hợp nhất với sở thích của game thủ và giải thích lý do thuyết phục.
Trả về thuần JSON theo mẫu sau (không kèm \`\`\`json):
{
  "advice": "Lời khuyên tổng quan gửi tới game thủ dựa trên phong cách chơi game họ tìm kiếm",
  "suggestedProductIds": [các_id_số_nguyên_phù_hợp],
  "reasons": [
    "Lý do 1: vì sao game phù hợp với phong cách/đồ họa/cốt truyện mà người chơi mong muốn",
    "Lý do 2: điểm nhấn gameplay cuốn hút đáng tiền"
  ]
}
`;

    if (!apiKey) {
      return this.generateLocalFallbackAdvice(userNeeds, budget, availableProducts);
    }

    try {
      const response = await this.callGeminiApi(prompt, apiKey);
      const parsed: RecommendationResponse = JSON.parse(response);
      return parsed;
    } catch (error) {
      logger.error('GEMINI', 'Lỗi khi gọi Gemini tư vấn game, chuyển sang thuật toán nội bộ', { error: String(error) });
      return this.generateLocalFallbackAdvice(userNeeds, budget, availableProducts);
    }
  }

  private async callGeminiApi(prompt: string, apiKey: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API HTTP ${res.status}: ${err}`);
    }

    const data = await res.json();
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return cleaned;
  }

  private generateLocalFallbackComparison(productA: Product, productB: Product): ComparisonResponse {
    const isAPriceLower = productA.price < productB.price;
    const betterRated = productA.rating >= productB.rating ? productA : productB;

    return {
      summary: `So sánh giữa ${productA.title} (${productA.brand}) và ${productB.title} (${productB.brand}). Cả hai đều là những siêu phẩm đỉnh cao của làng game với đồ họa chân thực và thế giới vô cùng rộng lớn.`,
      comparisonPoints: [
        {
          feature: 'Đồ họa & Thế giới trong game',
          productAValue: `Thế giới ${productA.category} chân thực, tối ưu hình ảnh tuyệt đẹp`,
          productBValue: `Phong cách ${productB.category} đặc trưng, thiết kế màn chơi lôi cuốn`,
          verdict: `Cả hai đều thể hiện sức mạnh đồ họa đỉnh cao thế hệ mới`,
        },
        {
          feature: 'Lối chơi (Gameplay) & Đánh giá',
          productAValue: `⭐ ${productA.rating}/5.0 sao • Hệ thống chiến đấu linh hoạt`,
          productBValue: `⭐ ${productB.rating}/5.0 sao • Thử thách kỹ năng người chơi`,
          verdict: `${betterRated.title} nhận được sự tán dương nhỉnh hơn từ giới phê bình`,
        },
        {
          feature: 'Mức giá & Khuyến mãi',
          productAValue: `${formatVND(productA.price)} (Ưu đãi ${productA.discountPercentage || 0}%)`,
          productBValue: `${formatVND(productB.price)} (Ưu đãi ${productB.discountPercentage || 0}%)`,
          verdict: isAPriceLower ? `${productA.title} có mức giá tiếp cận dễ hơn` : `${productB.title} có mức giá mềm hơn`,
        },
      ],
      recommendation: `Nếu bạn thích trải nghiệm ${productA.category} thì ${productA.title} là lựa chọn số 1. Còn nếu đam mê thử thách và lối chơi của ${productB.category}, hãy chọn ${productB.title}.`,
    };
  }

  private generateLocalFallbackAdvice(userNeeds: string, budget: number | undefined, availableProducts: Product[]): RecommendationResponse {
    const filtered = availableProducts.filter((p) => {
      if (budget && p.price > budget) return false;
      return true;
    });

    const chosen = (filtered.length > 0 ? filtered : availableProducts).slice(0, 2);

    return {
      advice: `Dựa trên sở thích "${userNeeds}"${budget ? ` và ngân sách ${formatVND(budget)}` : ''}, chúng tôi đã lọc ra những siêu phẩm game bản quyền xuất sắc nhất hiện có trong kho:`,
      suggestedProductIds: chosen.map((p) => p.id),
      reasons: [
        `Tựa game "${chosen[0]?.title || 'Black Myth: Wukong'}" sở hữu đồ họa đỉnh cao và điểm số đánh giá xuất sắc (${chosen[0]?.rating || 4.9}⭐).`,
        `Mức giá ưu đãi phù hợp ngân sách dự kiến, mang lại hàng chục giờ chơi cuốn hút.`,
      ],
    };
  }
}

export const geminiService = new GeminiService();
