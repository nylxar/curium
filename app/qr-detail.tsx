import { useCallback, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Pressable,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { captureRef } from "react-native-view-shot";
import { File } from "expo-file-system";
import * as FileSystemLegacy from "expo-file-system/legacy";
import {
  loadHistory,
  HistoryItem,
  deleteFromHistory,
} from "@/services/history";
import { QRCanvas } from "@/components/qr/QRCanvas";
import { useTheme } from "@/context/ThemeContext";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";
import { useToast } from "@/components/ui/Toast";

function ActionChip({
  icon,
  label,
  onPress,
  variant = "default",
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  variant?: "default" | "danger";
  colors: any;
}) {
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const isDanger = variant === "danger";
  const accent = isDanger ? colors.error : colors.primary;

  return (
    <Animated.View style={[styles.chipWrap, pressStyle]}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.94, { damping: 18, stiffness: 320 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 18, stiffness: 320 });
        }}
        onPress={onPress}
        style={({ pressed }) => [
          styles.chip,
          {
            backgroundColor: pressed
              ? isDanger
                ? colors.error + "18"
                : colors.surfaceOffset
              : colors.surface,
            borderColor: isDanger ? colors.error + "40" : colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.chipIcon,
            { backgroundColor: isDanger ? colors.error + "18" : accent + "18" },
          ]}
        >
          <Ionicons name={icon} size={16} color={accent} />
        </View>
        <Text
          style={[
            styles.chipLabel,
            {
              color: isDanger ? colors.error : colors.text,
              fontFamily: Fonts.monoBold,
            },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function QRDetailScreen() {
  const { index: indexStr, ids } = useLocalSearchParams<{
    index: string;
    ids: string;
  }>();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();

  const [items, setItems] = useState<HistoryItem[]>([]);
  const [activeIndex, setActive] = useState(Number(indexStr ?? 0));
  const [copied, setCopied] = useState(false);
  const flatRef = useRef<FlatList>(null);
  const qrRefs = useRef<Record<string, View | null>>({});

  useEffect(() => {
    const idList = ids?.split(",") ?? [];
    loadHistory().then((all) => {
      const ordered = idList
        .map((id) => all.find((i) => i.id === id))
        .filter(Boolean) as HistoryItem[];
      setItems(ordered);
      setTimeout(() => {
        flatRef.current?.scrollToIndex({
          index: Number(indexStr ?? 0),
          animated: false,
        });
      }, 50);
    });
  }, []);

  const current = items[activeIndex];

  // Match index.tsx QR sizing
  const QR_SIZE = Math.floor(width) - 32;

  const copyValue = useCallback(
    async (val: string) => {
      const Clipboard = await import("expo-clipboard");
      await Clipboard.setStringAsync(val);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCopied(true);
      toast.success("Copied!", "Value copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    },
    [toast],
  );

  const handleSave = useCallback(async () => {
    if (!current) return;
    const ref = qrRefs.current[current.id];
    if (!ref) return;
    try {
      const { status } = await (
        await import("expo-media-library")
      ).requestPermissionsAsync(true);
      if (status !== "granted") {
        toast.warning("Permission needed", "Allow media access to save QR.");
        return;
      }
      // Wait for native layout to commit before capture.
      await new Promise<void>((r) => setTimeout(r, 200));
      const uri = await captureRef(ref, { format: "png", quality: 1, result: "tmpfile" });
      const { Asset } = await import("expo-media-library");
      await Asset.create(uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success("Saved!", "QR saved to your gallery.");
    } catch {
      toast.error("Error", "Could not save to gallery.");
    }
  }, [current, toast]);

  const handleShare = useCallback(async () => {
    if (!current) return;
    const ref = qrRefs.current[current.id];
    if (!ref) return;
    try {
      // Wait for native layout to commit before capture.
      await new Promise<void>((r) => setTimeout(r, 200));
      const tmpUri = await captureRef(ref, { format: "png", quality: 1, result: "tmpfile" });
      // Copy to persistent directory — tmpfile URIs don't survive Android activity restarts.
      const dest = FileSystemLegacy.documentDirectory + `curium_qr_${Date.now()}.png`;
      const srcFile = new File(tmpUri);
      const destFile = new File(dest);
      await srcFile.copy(destFile);
      const Sharing = await import("expo-sharing");
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(destFile.uri, { mimeType: "image/png" });
      } else {
        toast.warning("Unavailable", "Sharing is not available on this device.");
      }
    } catch {
      toast.error("Error", "Could not share.");
    }
  }, [current, toast]);

  const handleDelete = useCallback(() => {
    if (!current) return;
    toast.confirm(
      "Delete QR",
      "This QR code will be removed from your history.",
      async () => {
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
        toast.success("Deleted", "QR code removed.");
      },
      "Delete",
      true,
    );
  }, [current, items.length, activeIndex, router, toast]);

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    const time = d.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    if (days === 0) return `Today · ${time}`;
    if (days === 1) return `Yesterday · ${time}`;
    if (days < 7) return `${days} days ago · ${time}`;
    return `${d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })} · ${time}`;
  };

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <View style={[styles.page, { width, paddingTop: Spacing.lg }]}>
      {/* Bare QR — no card wrapper, matches index.tsx.  The wrapper's
          borderRadius is driven by the saved `qrCorners` so the outer
          frame matches the inner QR's rounded corners (sharp = 0, soft
          = 8, round = 16, very round = 24, pill = 32).  This is the
          same value QRCanvas uses internally for its inner View, so
          a 32-corner QR shows identical 32 corners in both screens. */}
      <View
        ref={(r) => {
          qrRefs.current[item.id] = r;
        }}
        collapsable={false}
        style={[
          styles.qrBare,
          {
            width: QR_SIZE,
            height: QR_SIZE,
            backgroundColor: item.qrStyle?.bgColor ?? colors.surface,
            borderRadius: item.qrStyle?.qrCorners ?? 20,
          },
        ]}
      >
        <QRCanvas
          value={item.value}
          size={QR_SIZE}
          qrStyle={item.qrStyle}
          skipAnimation
          logoUri={item.qrStyle?.logoUri}
          logoSize={60}
          logoStyle={item.qrStyle?.logoStyle}
          logoBgColor={item.qrStyle?.bgColor}
          logoPosition={item.qrStyle?.logoPosition}
        />
      </View>

      {/* Type pill */}
      <View
        style={[
          styles.typePill,
          {
            backgroundColor: colors.primary + "18",
            borderColor: colors.primary + "40",
          },
        ]}
      >
        <View
          style={[styles.typeDot, { backgroundColor: colors.primary }]}
        />
        <Text
          style={[
            styles.typeText,
            { color: colors.primary, fontFamily: Fonts.monoBold },
          ]}
        >
          {item.type.toUpperCase()}
        </Text>
      </View>

      {/* Value block */}
      <View
        style={[
          styles.valueCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.valueHeader}>
          <Text
            style={[
              styles.valueLabel,
              { color: colors.textFaint, fontFamily: Fonts.mono },
            ]}
          >
            CONTENT
          </Text>
          <Pressable
            onPress={() => copyValue(item.value)}
            hitSlop={6}
            style={({ pressed }) => [
              styles.copyBadge,
              {
                backgroundColor: pressed
                  ? colors.primary + "22"
                  : copied
                    ? colors.success + "22"
                    : colors.surfaceOffset,
                borderColor: pressed
                  ? colors.primary + "60"
                  : copied
                    ? colors.success + "50"
                    : colors.border,
              },
            ]}
          >
            <Ionicons
              name={copied ? "checkmark" : "copy-outline"}
              size={11}
              color={copied ? colors.success : colors.textMuted}
            />
            <Text
              style={[
                styles.copyBadgeText,
                {
                  color: copied ? colors.success : colors.textMuted,
                  fontFamily: Fonts.monoBold,
                },
              ]}
            >
              {copied ? "COPIED" : "TAP TO COPY"}
            </Text>
          </Pressable>
        </View>
        <Text
          style={[
            styles.valueText,
            { color: colors.text, fontFamily: Fonts.mono },
          ]}
          numberOfLines={3}
        >
          {item.value}
        </Text>
        <View
          style={[styles.valueFooter, { borderTopColor: colors.border }]}
        >
          <Ionicons
            name="time-outline"
            size={12}
            color={colors.textFaint}
          />
          <Text
            style={[
              styles.dateText,
              { color: colors.textMuted, fontFamily: Fonts.mono },
            ]}
          >
            {formatDate(item.createdAt)}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* Top bar */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + Spacing.sm,
            backgroundColor: colors.bg,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={12}
          style={[
            styles.backBtn,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.topCenter}>
          <Text
            style={[
              styles.topLabel,
              { color: colors.textFaint, fontFamily: Fonts.mono },
            ]}
          >
            {items.length > 0 ? `${activeIndex + 1} / ${items.length}` : "—"}
          </Text>
        </View>

        <View style={{ width: 36 }} />
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
          if (idx !== activeIndex) {
            setActive(idx);
            Haptics.selectionAsync();
          }
        }}
        getItemLayout={(_, i) => ({
          length: width,
          offset: width * i,
          index: i,
        })}
        initialScrollIndex={Number(indexStr ?? 0)}
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        windowSize={3}
        removeClippedSubviews
        updateCellsBatchingPeriod={50}
        scrollEventThrottle={16}
      />

      {/* Bottom action bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + Spacing.sm,
          },
        ]}
      >
        <View style={styles.actionRow}>
          <ActionChip
            icon="download-outline"
            label="Save"
            onPress={handleSave}
            colors={colors}
          />
          <ActionChip
            icon="share-social-outline"
            label="Share"
            onPress={handleShare}
            colors={colors}
          />
          <ActionChip
            icon="trash-outline"
            label="Delete"
            onPress={handleDelete}
            variant="danger"
            colors={colors}
          />
        </View>
      </View>
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
    zIndex: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  topCenter: {
    alignItems: "center",
    gap: 2,
  },
  topLabel: {
    fontSize: FontSize.xs,
    letterSpacing: 1.5,
  },
  page: {
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  qrBare: {
    // No border, no shadow, no card — just the QR.  borderRadius is
    // set per-render from `item.qrStyle?.qrCorners` so it matches the
    // inner QRCanvas corners exactly (see QRCanvas's `cornerR`).
    overflow: "hidden",
  },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.sm,
  },
  typeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  typeText: {
    fontSize: FontSize.xs,
    letterSpacing: 1.5,
  },
  valueCard: {
    width: "100%",
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  valueHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  valueLabel: {
    fontSize: FontSize.xs,
    letterSpacing: 1.2,
  },
  copyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  copyBadgeText: {
    fontSize: 9,
    letterSpacing: 1,
  },
  valueText: {
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  valueFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.xs,
  },
  dateText: {
    fontSize: FontSize.xs,
  },
  bottomBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  chipWrap: {
    flex: 1,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  chipLabel: {
    fontSize: FontSize.sm,
  },
});
