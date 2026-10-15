import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotification } from '@/hooks/useNotification';
import { geminiService } from '@/services/geminiService';
import { firebaseOrderService } from '@/services/firebaseService';
import { LogViewer } from '@/components/LogViewer';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const { permission, isRequesting, requestPermission, sendTestPromo } = useNotification();

  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [activeSection, setActiveSection] = useState<'settings' | 'logs'>('settings');

  useEffect(() => {
    geminiService.getApiKey().then((k) => setGeminiKeyInput(k));
  }, []);

  const handleSaveGeminiKey = async () => {
    await geminiService.setApiKey(geminiKeyInput);
    Alert.alert('Thành công', 'Đã lưu cấu hình Gemini API Key vào bộ nhớ bảo mật.');
  };

  const handleTestNotification = async () => {
    const res = await sendTestPromo();
    if (res) {
      Alert.alert('Thông báo đã gửi', 'Thiết bị vừa nhận được thông báo Flash Sale ưu đãi!');
    } else {
      Alert.alert('Chưa cấp quyền', 'Vui lòng bấm nút "Cấp quyền thông báo" phía trên trước khi thử nghiệm.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Tab chuyển giữa Cài đặt và Logs Viewer */}
      <View style={[styles.switchBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TouchableOpacity
          style={[
            styles.switchBtn,
            activeSection === 'settings' && { backgroundColor: theme.primary },
          ]}
          onPress={() => setActiveSection('settings')}
        >
          <Ionicons
            name="construct-outline"
            size={16}
            color={activeSection === 'settings' ? '#FFFFFF' : theme.textSecondary}
          />
          <Text
            style={[
              styles.switchText,
              { color: activeSection === 'settings' ? '#FFFFFF' : theme.textSecondary },
            ]}
          >
            Cấu hình & Tích hợp
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.switchBtn,
            activeSection === 'logs' && { backgroundColor: theme.primary },
          ]}
          onPress={() => setActiveSection('logs')}
        >
          <Ionicons
            name="terminal-outline"
            size={16}
            color={activeSection === 'logs' ? '#FFFFFF' : theme.textSecondary}
          />
          <Text
            style={[
              styles.switchText,
              { color: activeSection === 'logs' ? '#FFFFFF' : theme.textSecondary },
            ]}
          >
            Nhật ký Debug (R11)
          </Text>
        </TouchableOpacity>
      </View>

      {activeSection === 'logs' ? (
        <LogViewer />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* KHU VỰC 1: THÔNG BÁO (R09) */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="notifications" size={20} color={theme.primary} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Hệ thống Thông báo (Notification Flow - R09)
              </Text>
            </View>

            <View style={styles.permStatusRow}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Trạng thái quyền:</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: permission.granted ? theme.success : theme.danger },
                ]}
              >
                <Text style={styles.statusBadgeText}>
                  {permission.granted ? 'ĐÃ CẤP QUYỀN (ALLOW)' : 'CHƯA CẤP QUYỀN (DENY)'}
                </Text>
              </View>
            </View>

            <Text style={[styles.descText, { color: theme.textMuted }]}>
              Luồng thông báo hỗ trợ xin quyền cấp phép (Allow/Deny) và gửi thông báo xác nhận khi đơn hàng được ghi thành công lên Firebase.
            </Text>

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.smallBtn, { backgroundColor: theme.primary }]}
                onPress={requestPermission}
                disabled={isRequesting}
              >
                <Text style={styles.smallBtnText}>Xin quyền thông báo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.smallBtn, { backgroundColor: theme.backgroundElement }]}
                onPress={handleTestNotification}
              >
                <Text style={[styles.smallBtnText, { color: theme.text }]}>
                  Bắn test thông báo
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* KHU VỰC 2: FIREBASE BACKEND (R08) */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="cloud-done" size={20} color={theme.success} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Dịch vụ Firebase (R08)
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Project ID:</Text>
              <Text style={[styles.val, { color: theme.text }]}>
                {firebaseOrderService.getConfig().projectId}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Nghiệp vụ:</Text>
              <Text style={[styles.val, { color: theme.text }]}>
                Lưu & Đọc lịch sử đơn hàng (Firestore / Database)
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Chế độ dự phòng:</Text>
              <Text style={[styles.val, { color: theme.success }]}>
                Offline Caching & Retry tự động kích hoạt
              </Text>
            </View>
          </View>

          {/* KHU VỰC 3: GEMINI AI API (R10) */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="sparkles" size={20} color={theme.warning} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Cấu hình Gemini GenAI (R10)
              </Text>
            </View>

            <Text style={[styles.descText, { color: theme.textMuted }]}>
              Nhập API Key của Google Gemini nếu bạn muốn kích hoạt xử lý trực tiếp từ Google Cloud. Nếu để trống, ứng dụng sẽ tự động kích hoạt chế độ Phân tích thương mại điện tử nội bộ.
            </Text>

            <TextInput
              style={[
                styles.keyInput,
                { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.border },
              ]}
              placeholder="Nhập Gemini API Key (tùy chọn)..."
              placeholderTextColor={theme.textMuted}
              value={geminiKeyInput}
              onChangeText={setGeminiKeyInput}
              secureTextEntry={false}
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.smallBtn, { backgroundColor: theme.primary, marginTop: 8 }]}
              onPress={handleSaveGeminiKey}
            >
              <Text style={styles.smallBtnText}>Lưu API Key</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  switchBar: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  switchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  switchText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  permStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  descText: {
    fontSize: 13,
    lineHeight: 18,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  smallBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
  },
  val: {
    fontSize: 13,
    fontWeight: '600',
  },
  keyInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
});
