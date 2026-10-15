import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProductDetail } from '@/hooks/useProductDetail';
import { useCart } from '@/hooks/useCart';
import { ErrorView } from '@/components/ErrorView';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { formatVND } from '@/utils/format';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const { product, isLoading, error, retry } = useProductDetail(id);
  const { addToCart } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ title: 'Đang tải sản phẩm...', headerShown: true }} />
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ title: 'Lỗi', headerShown: true }} />
        <ErrorView message={error || 'Không tìm thấy sản phẩm'} onRetry={retry} />
      </View>
    );
  }

  const images = product.images?.length > 0 ? product.images : [product.thumbnail];
  const originalPrice = product.discountPercentage
    ? Math.round(product.price / (1 - product.discountPercentage / 100))
    : null;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    Alert.alert(
      '🛒 Đã thêm vào giỏ hàng',
      `Đã thêm ${quantity} x "${product.title}" vào giỏ hàng của bạn.`,
      [
        { text: 'Tiếp tục xem', style: 'cancel' },
        { text: 'Đến giỏ hàng', onPress: () => router.push('/(tabs)/cart') },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: product.title,
          headerBackTitle: 'Quay lại',
          headerShown: true,
          headerTintColor: theme.text,
          headerStyle: { backgroundColor: theme.card },
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Ảnh chính lớn */}
        <View style={styles.mainImageWrap}>
          <Image
            source={{ uri: images[selectedImageIndex] || product.thumbnail }}
            style={styles.mainImage}
            resizeMode="contain"
          />
          {Boolean(product.discountPercentage && product.discountPercentage > 5) && (
            <View style={styles.badgeDiscount}>
              <Text style={styles.badgeText}>-{Math.round(product.discountPercentage || 0)}%</Text>
            </View>
          )}
        </View>

        {/* Danh sách ảnh nhỏ thumbnails nếu có nhiều ảnh */}
        {images.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbScroll}>
            {images.map((imgUrl, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedImageIndex(idx)}
                style={[
                  styles.thumbItem,
                  { borderColor: selectedImageIndex === idx ? theme.primary : theme.border },
                ]}
              >
                <Image source={{ uri: imgUrl }} style={styles.thumbImage} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Nội dung chi tiết */}
        <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.categoryRow}>
            <Text style={[styles.categoryPill, { color: theme.primary, backgroundColor: theme.primaryLight }]}>
              {product.category.toUpperCase()}
            </Text>
            {product.brand && (
              <Text style={[styles.brandText, { color: theme.textMuted }]}>
                Studio: {product.brand}
              </Text>
            )}
          </View>

          <Text style={[styles.title, { color: theme.text }]}>{product.title}</Text>

          <View style={styles.ratingStockRow}>
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={16} color={theme.warning} />
              <Text style={[styles.ratingVal, { color: theme.text }]}>
                {product.rating?.toFixed(1)} / 5.0
              </Text>
            </View>
            <View
              style={[
                styles.stockPill,
                { backgroundColor: product.stock > 0 ? '#DCFCE7' : '#FEE2E2' },
              ]}
            >
              <Text
                style={{
                  color: product.stock > 0 ? theme.success : theme.danger,
                  fontSize: 12,
                  fontWeight: '700',
                }}
              >
                {product.stock > 0 ? `Còn ${product.stock} key bản quyền` : 'Hết key'}
              </Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={[styles.currentPrice, { color: theme.primary }]}>
              {formatVND(product.price)}
            </Text>
            {originalPrice && (
              <Text style={[styles.strikePrice, { color: theme.textMuted }]}>
                {formatVND(originalPrice)}
              </Text>
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <Text style={[styles.sectionHeading, { color: theme.text }]}>Giới thiệu & Cốt truyện</Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {product.description}
          </Text>

          {/* Nút tắt sang tính năng Gemini AI */}
          <TouchableOpacity
            style={[styles.aiShortcut, { backgroundColor: theme.backgroundElement }]}
            onPress={() => router.push('/(tabs)/ai')}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles" size={18} color={theme.primary} />
            <Text style={[styles.aiShortcutText, { color: theme.primary }]}>
              Hỏi trợ lý Gemini đánh giá & so sánh game này
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Thanh công cụ thêm vào giỏ hàng cố định phía dưới */}
      <View
        style={[
          styles.bottomBar,
          { backgroundColor: theme.card, borderTopColor: theme.border },
        ]}
      >
        <View style={[styles.qtySelector, { backgroundColor: theme.backgroundElement }]}>
          <TouchableOpacity
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
            style={styles.qtyBtn}
          >
            <Ionicons name="remove" size={18} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.qtyVal, { color: theme.text }]}>{quantity}</Text>
          <TouchableOpacity
            onPress={() => setQuantity(quantity + 1)}
            style={styles.qtyBtn}
          >
            <Ionicons name="add" size={18} color={theme.text} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.addCartBtn, { backgroundColor: theme.primary }]}
          onPress={handleAddToCart}
          activeOpacity={0.85}
        >
          <Ionicons name="cart" size={20} color="#FFFFFF" />
          <Text style={styles.addCartBtnText}>
            Thêm Key Game • {formatVND(product.price * quantity)}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  mainImageWrap: {
    width: '100%',
    height: 320,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mainImage: {
    width: '90%',
    height: '90%',
  },
  badgeDiscount: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  thumbScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  thumbItem: {
    width: 60,
    height: 60,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 8,
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  infoCard: {
    margin: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryPill: {
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  brandText: {
    fontSize: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  ratingStockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingVal: {
    fontSize: 14,
    fontWeight: '600',
  },
  stockPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginTop: 4,
  },
  currentPrice: {
    fontSize: 26,
    fontWeight: '800',
  },
  strikePrice: {
    fontSize: 15,
    textDecorationLine: 'line-through',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  aiShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  aiShortcutText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
    alignItems: 'center',
  },
  qtySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    paddingHorizontal: 6,
  },
  qtyBtn: {
    padding: 8,
  },
  qtyVal: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'center',
  },
  addCartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 24,
    gap: 8,
  },
  addCartBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
