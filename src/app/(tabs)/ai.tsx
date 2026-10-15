import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '@/hooks/useProducts';
import { useGeminiAdvisor } from '@/hooks/useGeminiAdvisor';
import { useCart } from '@/hooks/useCart';
import { Product } from '@/types/product';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { formatVND } from '@/utils/format';

const QUICK_PROMPTS = [
  'Game chặt chém đồ họa đỉnh cao, cốt truyện sâu sắc',
  'Game thế giới mở tự do khám phá dưới 1.000.000 ₫',
  'Game Souls-like thử thách độ khó kỹ năng cao',
  'Game nhập vai bom tấn hành động đáng chơi nhất',
];

export default function AIScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();

  const { products } = useProducts();
  const { addToCart } = useCart();
  const {
    isComparing,
    isAdvising,
    comparisonResult,
    adviceResult,
    error,
    compareProducts,
    getAdvice,
    clearResults,
  } = useGeminiAdvisor();

  const [activeTab, setActiveTab] = useState<'compare' | 'advice'>('compare');

  // State cho so sánh sản phẩm
  const [productA, setProductA] = useState<Product | null>(null);
  const [productB, setProductB] = useState<Product | null>(null);
  const [selectorTarget, setSelectorTarget] = useState<'A' | 'B' | null>(null);

  // State cho tư vấn mua sắm
  const [userNeeds, setUserNeeds] = useState('');
  const [budget, setBudget] = useState('');

  // Tự động gán 2 sản phẩm mẫu đầu tiên nếu chưa chọn
  React.useEffect(() => {
    if (products.length >= 2 && !productA && !productB) {
      setProductA(products[0]);
      setProductB(products[1]);
    }
  }, [products]);

  const handleRunCompare = async () => {
    if (!productA || !productB) return;
    await compareProducts(productA, productB);
  };

  const handleRunAdvice = async () => {
    if (!userNeeds.trim()) return;
    const numBudget = budget ? parseFloat(budget) : undefined;
    await getAdvice(userNeeds, numBudget, products);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Tab Switcher */}
      <View style={[styles.tabBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'compare' && { borderBottomColor: theme.primary, borderBottomWidth: 3 },
          ]}
          onPress={() => {
            setActiveTab('compare');
            clearResults();
          }}
        >
          <Ionicons
            name="git-compare-outline"
            size={18}
            color={activeTab === 'compare' ? theme.primary : theme.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'compare' ? theme.primary : theme.textSecondary },
            ]}
          >
            So sánh 2 tựa game
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'advice' && { borderBottomColor: theme.primary, borderBottomWidth: 3 },
          ]}
          onPress={() => {
            setActiveTab('advice');
            clearResults();
          }}
        >
          <Ionicons
            name="bulb-outline"
            size={18}
            color={activeTab === 'advice' ? theme.primary : theme.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'advice' ? theme.primary : theme.textSecondary },
            ]}
          >
            Tư vấn chọn game
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* TAB 1: SO SÁNH SẢN PHẨM (R10) */}
        {activeTab === 'compare' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Chọn 2 tựa game để Gemini phân tích đồ họa & gameplay
            </Text>

            <View style={styles.comparePickerRow}>
              {/* Box chọn SP A */}
              <TouchableOpacity
                style={[
                  styles.productPickBox,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
                onPress={() => setSelectorTarget('A')}
                activeOpacity={0.8}
              >
                {productA ? (
                  <>
                    <Image source={{ uri: productA.thumbnail }} style={styles.pickImg} />
                    <Text style={[styles.pickTitle, { color: theme.text }]} numberOfLines={2}>
                      {productA.title}
                    </Text>
                    <Text style={[styles.pickPrice, { color: theme.primary }]}>
                      {formatVND(productA.price)}
                    </Text>
                    <Text style={[styles.changeHint, { color: theme.textMuted }]}>
                      Chạm để đổi Game A
                    </Text>
                  </>
                ) : (
                  <Text style={{ color: theme.textSecondary }}>Chọn Game A</Text>
                )}
              </TouchableOpacity>

              <View style={styles.vsBadge}>
                <Text style={styles.vsText}>VS</Text>
              </View>

              {/* Box chọn SP B */}
              <TouchableOpacity
                style={[
                  styles.productPickBox,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
                onPress={() => setSelectorTarget('B')}
                activeOpacity={0.8}
              >
                {productB ? (
                  <>
                    <Image source={{ uri: productB.thumbnail }} style={styles.pickImg} />
                    <Text style={[styles.pickTitle, { color: theme.text }]} numberOfLines={2}>
                      {productB.title}
                    </Text>
                    <Text style={[styles.pickPrice, { color: theme.primary }]}>
                      {formatVND(productB.price)}
                    </Text>
                    <Text style={[styles.changeHint, { color: theme.textMuted }]}>
                      Chạm để đổi Game B
                    </Text>
                  </>
                ) : (
                  <Text style={{ color: theme.textSecondary }}>Chọn Game B</Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: theme.primary },
                isComparing && { opacity: 0.7 },
              ]}
              onPress={handleRunCompare}
              disabled={isComparing || !productA || !productB}
              activeOpacity={0.85}
            >
              {isComparing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Gemini So sánh chi tiết</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Kết quả so sánh */}
            {comparisonResult && (
              <View
                style={[
                  styles.resultCard,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <View style={styles.resultHeader}>
                  <Ionicons name="sparkles" size={20} color={theme.primary} />
                  <Text style={[styles.resultTitle, { color: theme.text }]}>
                    Phân tích đối chiếu từ Gemini
                  </Text>
                </View>

                <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
                  {comparisonResult.summary}
                </Text>

                <View style={styles.pointsList}>
                  {comparisonResult.comparisonPoints.map((point, index) => (
                    <View
                      key={index}
                      style={[
                        styles.pointItem,
                        { backgroundColor: theme.backgroundElement },
                      ]}
                    >
                      <Text style={[styles.pointFeature, { color: theme.primary }]}>
                        {point.feature}
                      </Text>
                      <View style={styles.pointDetailRow}>
                        <Text style={[styles.pointDetailText, { color: theme.text }]} numberOfLines={2}>
                          • A: {point.productAValue}
                        </Text>
                        <Text style={[styles.pointDetailText, { color: theme.text }]} numberOfLines={2}>
                          • B: {point.productBValue}
                        </Text>
                      </View>
                      <Text style={[styles.pointVerdict, { color: theme.success }]}>
                        👉 {point.verdict}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={[styles.recommendationBox, { backgroundColor: theme.primaryLight }]}>
                  <Text style={[styles.recTitle, { color: theme.primary }]}>Lời khuyên chuyên gia:</Text>
                  <Text style={[styles.recContent, { color: theme.text }]}>
                    {comparisonResult.recommendation}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* TAB 2: TƯ VẤN MUA SẮM (R10) */}
        {activeTab === 'advice' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Trợ lý thông minh chọn game theo sở thích & ngân sách
            </Text>

            <View style={styles.inputCard}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Sở thích chơi game hoặc phong cách bạn muốn trải nghiệm:
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
                ]}
                placeholder="VD: Thích game đồ họa đẹp, thế giới mở rộng lớn, cốt truyện lôi cuốn..."
                placeholderTextColor={theme.textMuted}
                value={userNeeds}
                onChangeText={setUserNeeds}
                multiline
                numberOfLines={3}
              />

              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Ngân sách tối đa (VNĐ, tùy chọn):
              </Text>
              <TextInput
                style={[
                  styles.budgetInput,
                  { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
                ]}
                placeholder="VD: 1500000"
                placeholderTextColor={theme.textMuted}
                value={budget}
                onChangeText={setBudget}
                keyboardType="numeric"
              />

              <Text style={[styles.quickPromptLabel, { color: theme.textMuted }]}>
                Gợi ý câu hỏi nhanh:
              </Text>
              <View style={styles.quickPromptsWrap}>
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.quickChip,
                      { backgroundColor: theme.card, borderColor: theme.border },
                    ]}
                    onPress={() => setUserNeeds(prompt)}
                  >
                    <Text style={[styles.quickChipText, { color: theme.text }]}>
                      {prompt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  { backgroundColor: theme.primary },
                  isAdvising && { opacity: 0.7 },
                ]}
                onPress={handleRunAdvice}
                disabled={isAdvising || !userNeeds.trim()}
                activeOpacity={0.85}
              >
                {isAdvising ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>Nhận gợi ý từ Gemini</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Kết quả tư vấn */}
            {adviceResult && (
              <View
                style={[
                  styles.resultCard,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <View style={styles.resultHeader}>
                  <Ionicons name="bulb" size={20} color={theme.warning} />
                  <Text style={[styles.resultTitle, { color: theme.text }]}>
                    Khuyến nghị từ Trợ lý Gemini
                  </Text>
                </View>

                <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
                  {adviceResult.advice}
                </Text>

                <View style={styles.reasonsList}>
                  {adviceResult.reasons.map((reason, idx) => (
                    <Text key={idx} style={[styles.reasonItem, { color: theme.text }]}>
                      ✓ {reason}
                    </Text>
                  ))}
                </View>

                {/* Danh sách các sản phẩm được đề xuất */}
                <Text style={[styles.suggestedHeading, { color: theme.primary }]}>
                  Sản phẩm phù hợp từ Catalog:
                </Text>

                <View style={styles.suggestedList}>
                  {products
                    .filter((p) => adviceResult.suggestedProductIds.includes(p.id))
                    .map((item) => (
                      <View
                        key={item.id}
                        style={[
                          styles.suggestedItem,
                          { backgroundColor: theme.backgroundElement },
                        ]}
                      >
                        <Image source={{ uri: item.thumbnail }} style={styles.sugImg} />
                        <View style={{ flex: 1, marginHorizontal: 8 }}>
                          <Text style={[styles.sugTitle, { color: theme.text }]} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text style={[styles.sugPrice, { color: theme.primary }]}>
                            {formatVND(item.price)} • ⭐ {item.rating}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.sugAddBtn, { backgroundColor: theme.primary }]}
                          onPress={() => addToCart(item, 1)}
                        >
                          <Ionicons name="cart" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    ))}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal lựa chọn sản phẩm từ catalog để so sánh */}
      <Modal
        visible={selectorTarget !== null}
        animationType="slide"
        onRequestClose={() => setSelectorTarget(null)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Chọn sản phẩm {selectorTarget}
            </Text>
            <TouchableOpacity onPress={() => setSelectorTarget(null)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={products}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.selectProductRow,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
                onPress={() => {
                  if (selectorTarget === 'A') setProductA(item);
                  if (selectorTarget === 'B') setProductB(item);
                  setSelectorTarget(null);
                  clearResults();
                }}
              >
                <Image source={{ uri: item.thumbnail }} style={styles.modalProductImg} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.modalProductTitle, { color: theme.text }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.modalProductSub, { color: theme.textSecondary }]}>
                    {item.category} • {formatVND(item.price)} • ⭐ {item.rating}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ padding: 16, gap: 10 }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  comparePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  productPickBox: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    minHeight: 180,
    justifyContent: 'center',
  },
  pickImg: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  pickTitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
    height: 36,
  },
  pickPrice: {
    fontSize: 15,
    fontWeight: '700',
  },
  changeHint: {
    fontSize: 11,
    marginTop: 6,
  },
  vsBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 24,
    gap: 8,
    marginTop: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  resultCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginTop: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
  },
  pointsList: {
    gap: 10,
  },
  pointItem: {
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },
  pointFeature: {
    fontSize: 13,
    fontWeight: '700',
  },
  pointDetailRow: {
    gap: 2,
    marginVertical: 2,
  },
  pointDetailText: {
    fontSize: 12,
  },
  pointVerdict: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  recommendationBox: {
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },
  recTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  recContent: {
    fontSize: 13,
    lineHeight: 18,
  },
  inputCard: {
    gap: 10,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  budgetInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
  },
  quickPromptLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  quickPromptsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 12,
  },
  reasonsList: {
    gap: 4,
  },
  reasonItem: {
    fontSize: 13,
    lineHeight: 18,
  },
  suggestedHeading: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
  suggestedList: {
    gap: 8,
  },
  suggestedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
  },
  sugImg: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  sugTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  sugPrice: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  sugAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  selectProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalProductImg: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  modalProductTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalProductSub: {
    fontSize: 12,
    marginTop: 2,
  },
});
