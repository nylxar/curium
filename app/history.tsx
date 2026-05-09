import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  loadHistory,
  deleteFromHistory,
  clearHistory,
  HistoryItem,
} from "@/services/history";
import { Spacing, Radius, FontSize, Colors } from "@/constants/theme";
import { QRCanvas } from "@/components/qr/QRCanvas";
import { DEFAULT_QR_STYLE } from "@/types/qr";

export default function HistoryScreen() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const load = useCallback(async () => {
    setLoading(true);
    const data = await loadHistory();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = useCallback(async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = await deleteFromHistory(id);
    setItems(updated);
  }, []);

  const handleClear = useCallback(() => {
    Alert.alert("Clear History", "Delete all saved QR codes?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All",
        style: "destructive",
        onPress: async () => {
          await clearHistory();
          setItems([]);
        },
      },
    ]);
  }, []);

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <View
      style={[
        styles.card,
        {
          borderColor: item.fgColor + "20",
          backgroundColor: item.bgColor + "15",
        },
      ]}
    >
      <View style={styles.qrThumb}>
        <QRCanvas
          value={item.value}
          size={72}
          qrStyle={{
            ...DEFAULT_QR_STYLE,
            fgColor: item.fgColor,
            bgColor: item.bgColor,
          }}
        />
      </View>
      <View style={styles.info}>
        <Text style={[styles.typeLabel, { color: item.fgColor }]}>
          {item.type.toUpperCase()}
        </Text>
        <Text style={styles.valueText} numberOfLines={2}>
          {item.value}
        </Text>
        <Text style={styles.dateText}>
          {new Date(item.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => handleDelete(item.id)}
        hitSlop={12}
        style={styles.deleteBtn}
      >
        <Ionicons name="trash-outline" size={18} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: Colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>History</Text>
        {items.length > 0 ? (
          <TouchableOpacity onPress={handleClear} hitSlop={12}>
            <Ionicons name="trash-outline" size={22} color="#ef4444" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      {/* List */}
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="albums-outline" size={56} color={Colors.textFaint} />
          <Text style={styles.emptyTitle}>No history yet</Text>
          <Text style={styles.emptySub}>
            QR codes you create will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{
            padding: Spacing.base,
            gap: Spacing.sm,
            paddingBottom: insets.bottom + Spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text },

  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  qrThumb: { borderRadius: Radius.sm, overflow: "hidden" },
  info: { flex: 1, gap: 3 },
  typeLabel: { fontSize: FontSize.xs, fontWeight: "700", letterSpacing: 0.8 },
  valueText: { fontSize: FontSize.sm, color: Colors.text, lineHeight: 18 },
  dateText: { fontSize: FontSize.xs, color: Colors.textMuted },
  deleteBtn: { padding: Spacing.xs },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text },
  emptySub: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: "center",
    maxWidth: 260,
  },
});
