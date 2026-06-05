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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Asset, requestPermissionsAsync } from "expo-media-library";
import { captureRef } from "react-native-view-shot";
import {
  loadHistory,
  HistoryItem,
  deleteFromHistory,
} from "@/services/history";
import { QRCanvas } from "@/components/qr/QRCanvas";
import { DEFAULT_QR_STYLE } from "@/types/qr";
import { useTheme } from "@/context/ThemeContext";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";

// ─── Animated Action Button ──────────────────────────────────────────────────
function AnimatedActionBtn({
  icon,
  label,
  danger,
  colors,
  onPress,
  index,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  danger?: boolean;
  colors: any;
  onPress: () => void;
  index: number;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    opacity.value = withDelay(index * 80, withTiming(1, { duration: 250 }));
    translateY.value = withDelay(index * 80, withTiming(0, { duration: 300 }));
    return () => {
      opacity.value = 0;
      translateY.value = 10;
    };
  }, [index]);

  return (
    <Animated.View style={[styles.actionBtnWrap, animStyle]}>
      <TouchableOpacity
        style={[
          styles.actionBtn,
          {
            backgroundColor: danger
              ? colors.error + "18"
              : colors.surface,
            borderColor: danger ? colors.error + "40" : colors.border,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.6}
      >
        <Ionicons
          name={icon}
          size={20}
          color={danger ? colors.error : colors.text}
        />
        <Text
          style={[
            styles.actionLabel,
            {
              color: danger ? colors.error : colors.text,
              fontFamily: Fonts.mono,
            },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

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
    const { status } = await requestPermissionsAsync(true);
    if (status !== "granted") return;
    const uri = await captureRef(ref, { format: "png", quality: 1 });
    await Asset.create(uri);
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
      <View
        ref={(r) => {
          qrRefs.current[item.id] = r;
        }}
        collapsable={false}
        style={[styles.qrWrap, { width: QR_SIZE, height: QR_SIZE }]}
      >
        <QRCanvas value={item.value} size={QR_SIZE} qrStyle={item.qrStyle} />
      </View>

      {/* Meta */}
      <View style={styles.meta}>
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
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {[
          { icon: "download-outline" as const, label: "Save", fn: handleSave },
          { icon: "share-outline" as const, label: "Share", fn: handleShare },
          {
            icon: "trash-outline" as const,
            label: "Delete",
            fn: handleDelete,
            danger: true,
          },
        ].map((a, i) => (
          <AnimatedActionBtn
            key={a.label}
            icon={a.icon}
            label={a.label}
            danger={a.danger}
            colors={colors}
            onPress={a.fn}
            index={i}
          />
        ))}
      </View>
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
          {items.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === activeIndex ? colors.primary : colors.border,
                  width: i === activeIndex ? 20 : 6,
                },
              ]}
            />
          ))}
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
  actionBtnWrap: { flex: 1 },
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
