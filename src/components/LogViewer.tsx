import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { logger } from '@/services/loggerService';
import { LogEntry, LogLevel } from '@/types/log';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';

export const LogViewer: React.FC = () => {
  const scheme = useColorScheme();
  const theme = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  useEffect(() => {
    const unsubscribe = logger.subscribe((newLogs) => {
      setLogs(newLogs);
    });
    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (filterLevel === 'ALL') return true;
    return l.level === filterLevel;
  });

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'ERROR':
        return theme.danger;
      case 'WARN':
        return theme.warning;
      case 'INFO':
        return theme.primary;
      default:
        return theme.textSecondary;
    }
  };

  const handleClear = () => {
    Alert.alert('Xóa nhật ký', 'Bạn có chắc chắn muốn xóa toàn bộ log hiện tại không?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => logger.clearLogs() },
    ]);
  };

  const renderLogItem = ({ item }: { item: LogEntry }) => {
    const timeStr = item.timestamp.split('T')[1]?.slice(0, 8) || item.timestamp;
    const detailsStr = item.details ? JSON.stringify(item.details, null, 2) : null;

    return (
      <View
        style={[
          styles.logItem,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            borderLeftColor: getLevelColor(item.level),
          },
        ]}
      >
        <View style={styles.logHeader}>
          <View style={styles.logHeaderLeft}>
            <Text style={[styles.badge, { color: getLevelColor(item.level) }]}>{item.level}</Text>
            <Text style={[styles.tag, { color: theme.textSecondary }]}>[{item.tag}]</Text>
          </View>
          <Text style={[styles.time, { color: theme.textMuted }]}>{timeStr}</Text>
        </View>

        <Text style={[styles.message, { color: theme.text }]}>{item.message}</Text>

        {detailsStr && (
          <View style={[styles.detailsBox, { backgroundColor: theme.backgroundElement }]}>
            <Text style={[styles.detailsText, { color: theme.textSecondary }]} numberOfLines={4}>
              {detailsStr}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.filterRow}>
          {['ALL', 'INFO', 'WARN', 'ERROR'].map((lvl) => (
            <TouchableOpacity
              key={lvl}
              style={[
                styles.filterBtn,
                filterLevel === lvl
                  ? { backgroundColor: theme.primary }
                  : { backgroundColor: theme.backgroundElement },
              ]}
              onPress={() => setFilterLevel(lvl)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filterLevel === lvl ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                {lvl}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={handleClear} style={styles.clearBtn} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={18} color={theme.danger} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredLogs}
        keyExtractor={(item) => item.id}
        renderItem={renderLogItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              Chưa có log nào được ghi nhận.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
  },
  clearBtn: {
    padding: 6,
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
    gap: 10,
  },
  logItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    fontSize: 11,
    fontWeight: '800',
  },
  tag: {
    fontSize: 11,
    fontWeight: '600',
  },
  time: {
    fontSize: 11,
  },
  message: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  detailsBox: {
    marginTop: 6,
    padding: 8,
    borderRadius: 8,
  },
  detailsText: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
});
