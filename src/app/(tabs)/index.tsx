import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { ProductCard } from '@/components/ProductCard';
import { CategoryPills } from '@/components/CategoryPills';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { ErrorView } from '@/components/ErrorView';
import { EmptyState } from '@/components/EmptyState';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';

export default function ProductListScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();

  const {
    products,
    categories,
    selectedCategory,
    searchQuery,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    fetchNextPage,
    refresh,
    retry,
    search,
    selectCategory,
  } = useProducts();

  const { addToCart } = useCart();

  const handleOpenDetail = (productId: number) => {
    router.push({
      pathname: '/product/[id]',
      params: { id: productId },
    });
  };

  const renderHeader = () => (
    <View style={styles.headerArea}>
      {/* Ô tìm kiếm debounced (R03) */}
      <View
        style={[
          styles.searchBox,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <Ionicons name="search-outline" size={20} color={theme.textMuted} style={styles.searchIcon} />
        <TextInput
          placeholder="Tìm game nổi tiếng (Wukong, Elden Ring, GTA...)"
          placeholderTextColor={theme.textMuted}
          style={[styles.searchInput, { color: theme.text }]}
          value={searchQuery}
          onChangeText={search}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => search('')} style={styles.clearSearchBtn}>
            <Ionicons name="close-circle" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Bộ lọc danh mục nằm ngang (R03) */}
      <CategoryPills
        categories={categories}
        selectedCategory={selectedCategory}
        onSelect={selectCategory}
      />

      <View style={styles.catalogStats}>
        <Text style={[styles.statsText, { color: theme.textSecondary }]}>
          {selectedCategory ? `Thể loại: ${selectedCategory}` : 'Kho game đỉnh cao'}
          {products.length > 0 ? ` (${products.length} tựa game bản quyền)` : ''}
        </Text>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return <View style={styles.footerSpacing} />;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.primary} />
        <Text style={[styles.footerText, { color: theme.textSecondary }]}>Đang tải thêm...</Text>
      </View>
    );
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {renderHeader()}
        <LoadingSkeleton count={6} />
      </View>
    );
  }

  if (error && products.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {renderHeader()}
        <ErrorView message={error} onRetry={retry} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => handleOpenDetail(item.id)}
            onAddToCart={() => addToCart(item, 1)}
          />
        )}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <EmptyState
            icon="game-controller-outline"
            title="Không tìm thấy tựa game"
            description="Hãy thử từ khóa khác (Lưu ý: Cửa hàng không phát hành game PUBG)."
            actionText="Xem tất cả game"
            onAction={() => {
              search('');
              selectCategory(null);
            }}
          />
        }
        onEndReached={fetchNextPage}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerArea: {
    paddingBottom: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  clearSearchBtn: {
    padding: 4,
  },
  catalogStats: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  statsText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  listContainer: {
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  footerText: {
    fontSize: 13,
  },
  footerSpacing: {
    height: 24,
  },
});
