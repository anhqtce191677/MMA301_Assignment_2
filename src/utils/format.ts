/**
 * Tiện ích định dạng số tiền sang chuẩn Việt Nam Đồng (VND / ₫)
 * Ví dụ: 1490000 -> "1.490.000 ₫"
 */
export function formatVND(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '0 ₫';
  }
  const rounded = Math.round(Number(amount));
  return `${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ₫`;
}
