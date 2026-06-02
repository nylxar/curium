import { useCallback, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as MediaLibrary from "expo-media-library";
import { captureRef } from "react-native-view-shot";
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import {
  loadHistory,
  HistoryItem,
  deleteFromHistory,
} from "@/services/history";
import { QRCanvas } from "@/components/qr/QRCanvas";
import { DEFAULT_QR_STYLE } from "@/types/qr";
import { useTheme } from "@/context/ThemeContext";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";

export default function QRDetailScreen() {
  const { index: indexStr, ids } = useLocalSearchParams<{
    index: string;
    ids: string;
  }>();
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [items, setItems] = useState<HistoryItem[]>([]);
  const [activeIndex, setActive] = useState(Number(indexStr ?? 0));
  const flatRef = useRef<FlatList>(null);
  const qrRefs = useRef<Record<string, View | null>>({});

  // Load only the items matching ids (preserves order)
  useEffect(() => {
    const idList = ids?.split(",") ?? [];
    loadHistory().then((all) => {
      const ordered = idList
        .map((id) => all.find((i) => i.id === id))
        .filter(Boolean) as HistoryItem[];
      setItems(ordered);
      // Scroll to initial index after render
      setTimeout(() => {
        flatRef.current?.scrollToIndex({
          index: Number(indexStr ?? 0),
          animated: false,
        });
      }, 50);
    });
  }, []);

  const current = items[activeIndex];

  const handleSave = async () => {
    if (!current) return;
    const ref = qrRefs.current[current.id];
    if (!ref) return;
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") return;
    const uri = await captureRef(ref, { format: "png", quality: 1 });
    await MediaLibrary.saveToLibraryAsync(uri);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleShare = async () => {
    if (!current) return;
    const ref = qrRefs.current[current.id];
    if (!ref) return;
    const uri = await captureRef(ref, { format: "png", quality: 1 });
    await Share.share({ url: uri, message: current.value });
  };

  const handleDelete = async () => {
    if (!current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await deleteFromHistory(current.id);
    if (items.length === 1) {
      router.back();
      return;
    }
    const next =
      activeIndex >= items.length - 1 ? activeIndex - 1 : activeIndex;
    setItems((p) => p.filter((i) => i.id !== current.id));
    setActive(next);
  };

  const QR_SIZE = Math.min(width * 0.72, 300);

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <View style={[styles.page, { width, paddingTop: insets.top + 64 }]}>
      {/* QR */}
      <Animated.View
        entering={FadeIn.delay(100).duration(400)}
        ref={(r: View | null) => {
          qrRefs.current[item.id] = r;
        }}
        collapsable={false}
        style={[styles.qrWrap, { width: QR_SIZE, height: QR_SIZE }]}
      >
        <QRCanvas value={item.value} size={QR_SIZE} qrStyle={item.qrStyle} />
      </Animated.View>

      {/* Meta */}
      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.meta}>
        <View
          style={[styles.badge, { backgroundColor: colors.primary + "22" }]}
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
          style={[styles.value, { color: colors.text, fontFamily: Fonts.mono }]}
          numberOfLines={4}
        >
          {item.value}
        </Text>
        <Text
          style={[
            styles.date,
            { color: colors.textFaint, fontFamily: Fonts.mono },
          ]}
        >
          {new Date(item.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </Text>
      </Animated.View>

      {/* Actions */}
      <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.actions}>
        {[
          { icon: "download-outline" as const, label: "Save", fn: handleSave },
          { icon: "share-outline" as const, label: "Share", fn: handleShare },
          {
            icon: "trash-outline" as const,
            label: "Delete",
            fn: handleDelete,
            danger: true,
          },
        ].map((a) => (
          <TouchableOpacity
            key={a.label}
            style={[
              styles.actionBtn,
              {
                backgroundColor: a.danger
                  ? colors.error + "18"
                  : colors.surface,
                borderColor: a.danger ? colors.error + "40" : colors.border,
              },
            ]}
            onPress={a.fn}
          >
            <Ionicons
              name={a.icon}
              size={20}
              color={a.danger ? colors.error : colors.text}
            />
            <Text
              style={[
                styles.actionLabel,
                {
                  color: a.danger ? colors.error : colors.text,
                  fontFamily: Fonts.mono,
                },
              ]}
            >
              {a.label}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* Top bar */}
      <View
        style={[
          styles.topBar,
          { paddingTop: insets.top, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={[
            styles.counter,
            { color: colors.textMuted, fontFamily: Fonts.mono },
          ]}
        >
          {items.length > 0 ? `${activeIndex + 1} / ${items.length}` : "—"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        ref={flatRef}
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setActive(idx);
          Haptics.selectionAsync();
        }}
        getItemLayout={(_, i) => ({
          length: width,
          offset: width * i,
          index: i,
        })}
        initialScrollIndex={Number(indexStr ?? 0)}
      />

      {/* Dot indicator */}
      {items.length > 1 && (
        <View
          style={[styles.dots, { paddingBottom: insets.bottom + Spacing.md }]}
        >
          {items.map((_, i) => {
            const isActive = i === activeIndex;
            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: isActive ? colors.primary : colors.border,
                    width: isActive ? 20 : 6,
                  },
                ]}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  counter: { fontSize: FontSize.sm },
  page: {
    alignItems: "center",
    gap: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  qrWrap: { borderRadius: 20, overflow: "hidden" },
  meta: { alignItems: "center", gap: Spacing.sm, width: "100%" },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  badgeText: { fontSize: FontSize.xs },
  value: { fontSize: FontSize.sm, textAlign: "center", lineHeight: 22 },
  date: { fontSize: FontSize.xs },
  actions: { flexDirection: "row", gap: Spacing.sm, width: "100%" },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionLabel: { fontSize: FontSize.xs },
  dots: { flexDirection: "row", justifyContent: "center", gap: Spacing.xs },
  dot: { height: 6, borderRadius: 3 },
});
