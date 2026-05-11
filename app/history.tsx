import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  loadHistory,
  deleteFromHistory,
  clearHistory,
  HistoryItem,
} from "@/services/history";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { DEFAULT_QR_STYLE } from "@/types/qr";

const THUMB = 80;

export default function HistoryScreen() {
  const { colors } = useTheme();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [query, setQuery] = useState("");
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // useFocusEffect = loads every time screen comes into focus, no delay
  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadHistory().then((data) => {
        if (active) setItems(data);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const filtered = query.trim()
    ? items.filter(
        (i) =>
          i.value.toLowerCase().includes(query.toLowerCase()) ||
          i.type.toLowerCase().includes(query.toLowerCase()),
      )
    : items;

  const handleDelete = useCallback(async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = await deleteFromHistory(id);
    setItems(updated);
  }, []);

  const handleClear = useCallback(() => {
    Alert.alert("Clear History", "Delete all QR codes?", [
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

  const openDetail = (index: number) => {
    // Pass index + serialized items via params
    router.push({
      pathname: "/qr-detail",
      params: {
        index: String(index),
        ids: filtered.map((i) => i.id).join(","),
      },
    });
  };

  const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    url: "link-outline",
    text: "text-outline",
    wifi: "wifi-outline",
    email: "mail-outline",
    phone: "call-outline",
    sms: "chatbubble-outline",
    contact: "person-outline",
    location: "location-outline",
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: HistoryItem;
    index: number;
  }) => (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      onPress={() => openDetail(index)}
      activeOpacity={0.8}
    >
      {/* Icon instead of QR thumbnail */}
      <View style={[styles.iconBox, { backgroundColor: colors.surfaceOffset }]}>
        <Ionicons
          name={TYPE_ICONS[item.type] ?? "qr-code-outline"}
          size={22}
          color={colors.primary}
        />
      </View>

      <View style={styles.info}>
        <View style={styles.row}>
          <View
            style={[styles.badge, { backgroundColor: colors.surfaceOffset }]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: colors.primary, fontFamily: Fonts.monoBold },
              ]}
            >
              {item.type.toUpperCase()}
            </Text>
          </View>
          <Text
            style={[
              styles.date,
              { color: colors.textFaint, fontFamily: Fonts.mono },
            ]}
          >
            {new Date(item.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
          </Text>
        </View>
        <Text
          style={[styles.value, { color: colors.text, fontFamily: Fonts.mono }]}
          numberOfLines={2}
        >
          {item.value}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => handleDelete(item.id)}
        hitSlop={12}
        style={styles.del}
      >
        <Ionicons name="trash-outline" size={16} color={colors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + Spacing.sm,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.title,
            { color: colors.text, fontFamily: Fonts.monoBold },
          ]}
        >
          History
        </Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={handleClear} hitSlop={12}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      {items.length > 0 && (
        <View
          style={[
            styles.searchWrap,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <TextInput
            style={[
              styles.searchInput,
              { color: colors.text, fontFamily: Fonts.mono },
            ]}
            placeholder="Search..."
            placeholderTextColor={colors.textFaint}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons
                name="close-circle"
                size={16}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="albums-outline" size={52} color={colors.textFaint} />
          <Text
            style={[
              styles.emptyTitle,
              { color: colors.text, fontFamily: Fonts.monoBold },
            ]}
          >
            {query ? "No results" : "No history yet"}
          </Text>
          <Text
            style={[
              styles.emptySub,
              { color: colors.textMuted, fontFamily: Fonts.mono },
            ]}
          >
            {query
              ? "Try a different search"
              : "QR codes you create appear here"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={10}
          getItemLayout={(_, i) => ({
            length: 80 + Spacing.sm,
            offset: (80 + Spacing.sm) * i,
            index: i,
          })}
          contentContainerStyle={{
            padding: Spacing.base,
            gap: Spacing.sm,
            paddingBottom: insets.bottom + Spacing.xl,
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
  },
  title: { fontSize: FontSize.lg },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchInput: { flex: 1, fontSize: FontSize.sm, padding: 0 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.md,
    height: 80,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  thumb: { width: THUMB, height: THUMB },
  info: { flex: 1, gap: Spacing.xs },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  badgeText: { fontSize: FontSize.xs },
  date: { fontSize: FontSize.xs },
  value: { fontSize: FontSize.sm, lineHeight: 18 },
  del: { padding: Spacing.xs },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.xxl,
  },
  emptyTitle: { fontSize: FontSize.lg },
  emptySub: { fontSize: FontSize.sm, textAlign: "center" },
});
