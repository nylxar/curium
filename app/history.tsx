import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { useHistory } from "@/context/HistoryContext";
import { Fonts, Spacing, Radius, FontSize } from "@/constants/theme";
import type { HistoryItem } from "@/services/history";

const TYPE_ICONS: Record<string, string> = {
  url:      "link-outline",
  text:     "text-outline",
  wifi:     "wifi-outline",
  email:    "mail-outline",
  phone:    "call-outline",
  sms:      "chatbubble-outline",
  contact:  "person-outline",
  location: "location-outline",
};

function relativeTime(createdAt: number | string): string {
  const time = typeof createdAt === "number" ? createdAt : new Date(createdAt).getTime();
  const diff = Date.now() - time;
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function formPayloadFor(item: HistoryItem): Record<string, string> {
  const value = item.value;

  switch (item.type) {
    case "url":
      return { url: value };
    case "email": {
      const [to, qs] = value.replace(/^mailto:/i, "").split("?");
      const params = Object.fromEntries(new URLSearchParams(qs ?? ""));
      return { to, subject: params.subject ?? "", body: params.body ?? "" };
    }
    case "phone":
      return { phone: value.replace(/^tel:/i, "") };
    case "sms": {
      const [phone, qs] = value.replace(/^sms:/i, "").split("?");
      const params = Object.fromEntries(new URLSearchParams(qs ?? ""));
      return { phone, message: params.body ?? "" };
    }
    case "wifi":
      return {
        ssid: value.match(/S:([^;]*)/)?.[1] ?? "",
        password: value.match(/P:([^;]*)/)?.[1] ?? "",
        encryption: value.match(/T:([^;]*)/)?.[1] ?? "WPA",
      };
    case "contact":
      return {
        name: value.match(/FN:([^\n]*)/)?.[1] ?? "",
        phone: value.match(/TEL:([^\n]*)/)?.[1] ?? "",
        email: value.match(/EMAIL:([^\n]*)/)?.[1] ?? "",
        org: value.match(/ORG:([^\n]*)/)?.[1] ?? "",
      };
    case "location": {
      const coords = value.replace(/^geo:/i, "").split(",");
      return { lat: coords[0] ?? "", lng: coords[1]?.split("?")[0] ?? "", label: "" };
    }
    case "text":
    default:
      return { text: value };
  }
}

function HistoryCard({
  item,
  onPress,
  onDelete,
  colors,
}: {
  item: HistoryItem;
  onPress: () => void;
  onDelete: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const tint = item.qrStyle?.fgColor ?? colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.72}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      {/* Icon */}
      <View style={[styles.cardIcon, { backgroundColor: tint + "18" }]}>
        <Ionicons
          name={(TYPE_ICONS[item.type] ?? "qr-code-outline") as any}
          size={20}
          color={tint}
        />
      </View>

      {/* Content */}
      <View style={styles.cardBody}>
        <Text
          style={[styles.cardValue, { color: colors.text, fontFamily: Fonts.mono }]}
          numberOfLines={1}
        >
          {item.value}
        </Text>
        <View style={styles.cardMeta}>
          <Text style={[styles.cardType, { color: tint, fontFamily: Fonts.mono }]}>
            {item.type.toUpperCase()}
          </Text>
          <Text style={[styles.cardDot, { color: colors.textFaint }]}>·</Text>
          <Text style={[styles.cardTime, { color: colors.textMuted, fontFamily: Fonts.mono }]}>
            {relativeTime(item.createdAt)}
          </Text>
        </View>
      </View>

      {/* Delete */}
      <TouchableOpacity
        onPress={onDelete}
        hitSlop={10}
        style={styles.cardDelete}
      >
        <Ionicons name="trash-outline" size={16} color={colors.textFaint} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function EmptyState({ colors }: { colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
        <Ionicons name="time-outline" size={36} color={colors.textFaint} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No history yet</Text>
      <Text style={[styles.emptySub, { color: colors.textMuted }]}>
        QR codes you create will appear here.
      </Text>
    </View>
  );
}

export default function HistoryScreen() {
  const { colors } = useTheme();
  const { entries, removeEntry, clearAll } = useHistory();
  const router = useRouter();

  const handleDelete = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      removeEntry(id);
    },
    [removeEntry],
  );

  const handleClearAll = useCallback(() => {
    Alert.alert(
      "Clear History",
      "Delete all history entries? This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            clearAll();
          },
        },
      ],
    );
  }, [clearAll]);

  const handlePress = useCallback(
    (item: HistoryItem) => {
      router.push({
        pathname: "/",
        params: { loadType: item.type, loadData: JSON.stringify(formPayloadFor(item)) },
      });
    },
    [router],
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={["top"]}>
      {/* App bar */}
      <View style={[styles.appBar, { borderBottomColor: colors.border }]}>
        <Text style={[styles.appTitle, { color: colors.text, fontFamily: Fonts.monoBold }]}>
          History
        </Text>
        {entries.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} hitSlop={10}>
            <Text style={[styles.clearBtn, { color: colors.error ?? "#e05" }]}>
              Clear all
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {entries.length === 0 ? (
        <EmptyState colors={colors} />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <HistoryCard
              item={item}
              colors={colors}
              onPress={() => handlePress(item)}
              onDelete={() => handleDelete(item.id)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  appBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  appTitle: { fontSize: FontSize.lg },
  clearBtn:  { fontSize: FontSize.sm, fontWeight: "600" },

  listContent: {
    padding: Spacing.base,
    paddingBottom: Spacing.xxl ?? 48,
  },

  // Card
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1, gap: 3 },
  cardValue: { fontSize: FontSize.sm },
  cardMeta:  { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  cardType:  { fontSize: FontSize.xs, fontWeight: "600" },
  cardDot:   { fontSize: FontSize.xs },
  cardTime:  { fontSize: FontSize.xs },
  cardDelete: { padding: Spacing.xs },

  // Empty
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: "700", textAlign: "center" },
  emptySub:   { fontSize: FontSize.sm, textAlign: "center", maxWidth: 260, lineHeight: 22 },
});
