import { Product, ProductsResponse, CategoryItem } from '@/types/product';
import { FAMOUS_GAMES, GAME_CATEGORIES } from '@/constants/gameData';
import { logger } from './loggerService';

// Bộ lọc nghiêm ngặt theo yêu cầu: Tuyệt đối không chứa PUBG dưới mọi hình thức
const isForbiddenGame = (game: Product): boolean => {
  const text = `${game.title} ${game.description} ${game.category}`.toLowerCase();
  return (
    text.includes('pubg') ||
    text.includes('playerunknown') ||
    text.includes('battlegrounds')
  );
};

// Danh sách game đã được duyệt sạch 100% không có PUBG
const VERIFIED_GAMES: Product[] = FAMOUS_GAMES.filter((g) => !isForbiddenGame(g));

// Hàm giả lập độ trễ mạng thực tế (Network Latency) để giữ nguyên trải nghiệm Skeleton Loading & Error Handling của R01
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const productService = {
  /**
   * Lấy danh sách game phân trang (R01, R02)
   */
  async getProducts(limit = 10, skip = 0): Promise<ProductsResponse> {
    logger.info('GAME_STORE', `Tải danh mục game bản quyền: limit=${limit}, skip=${skip}`);

    // Giả lập gọi API từ xa 300ms
    await delay(350);

    const filtered = VERIFIED_GAMES;
    const paged = filtered.slice(skip, skip + limit);

    logger.info('GAME_STORE', `Đã tải ${paged.length} tựa game thành công (Tổng số: ${filtered.length})`);
    return {
      products: paged,
      total: filtered.length,
      skip,
      limit,
    };
  },

  /**
   * Tìm kiếm game theo tên hoặc nhà phát triển (R03)
   */
  async searchProducts(query: string, limit = 10, skip = 0): Promise<ProductsResponse> {
    const trimmed = query.trim().toLowerCase();
    logger.info('GAME_STORE', `Tìm kiếm game: "${trimmed}"`);

    await delay(250);

    if (!trimmed) {
      return this.getProducts(limit, skip);
    }

    // Nếu người dùng tìm kiếm PUBG thì trả về rỗng theo yêu cầu cấm PUBG
    if (trimmed.includes('pubg') || trimmed.includes('battlegrounds')) {
      logger.warn('GAME_STORE', 'Từ khóa PUBG nằm trong danh sách cấm, không trả về kết quả.');
      return {
        products: [],
        total: 0,
        skip: 0,
        limit,
      };
    }

    const matched = VERIFIED_GAMES.filter((g) => {
      return (
        g.title.toLowerCase().includes(trimmed) ||
        (g.brand && g.brand.toLowerCase().includes(trimmed)) ||
        g.category.toLowerCase().includes(trimmed)
      );
    });

    const paged = matched.slice(skip, skip + limit);
    logger.info('GAME_STORE', `Tìm thấy ${matched.length} tựa game phù hợp với "${trimmed}"`);

    return {
      products: paged,
      total: matched.length,
      skip,
      limit,
    };
  },

  /**
   * Lọc game theo thể loại (R03)
   */
  async getProductsByCategory(category: string, limit = 10, skip = 0): Promise<ProductsResponse> {
    logger.info('GAME_STORE', `Lọc game theo thể loại: "${category}"`);

    await delay(250);

    const matched = VERIFIED_GAMES.filter(
      (g) => g.category.toLowerCase() === category.toLowerCase()
    );

    const paged = matched.slice(skip, skip + limit);
    return {
      products: paged,
      total: matched.length,
      skip,
      limit,
    };
  },

  /**
   * Lấy danh sách thể loại game (R03)
   */
  async getCategories(): Promise<CategoryItem[]> {
    return GAME_CATEGORIES;
  },

  /**
   * Lấy chi tiết game theo ID (R04)
   */
  async getProductById(id: number | string): Promise<Product> {
    logger.info('GAME_STORE', `Tải chi tiết game ID=${id}`);

    await delay(200);

    const numId = Number(id);
    const found = VERIFIED_GAMES.find((g) => g.id === numId);

    if (!found) {
      logger.error('GAME_STORE', `Không tìm thấy game ID=${id}`);
      throw new Error(`Tựa game mã #${id} không tồn tại hoặc đã ngừng phát hành.`);
    }

    logger.info('GAME_STORE', `Tải thành công game: "${found.title}"`);
    return found;
  },
};
