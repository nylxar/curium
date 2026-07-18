import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Icon, type IconName } from "@/components/ui/Icon";
import * as Haptics from "expo-haptics";
import {
  loadHistory,
  deleteFromHistory,
  clearHistory,
  HistoryItem,
} from "@/services/history";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/components/ui/Toast";
import { DEFAULT_QR_STYLE } from "@/types/qr";

const THUMB = 80;

// Pulsing skeleton placeholder — same dimensions as AnimatedHistoryCard.
function SkeletonCard({ colors }: { colors: any }) {
  const pulse = useSharedValue(0.4);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 900, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0.4, { duration: 900, easing: Easing.inOut(Easing.cubic) }),
      ),
      -1,
    );
  }, []);

  const skel = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        skel,
      ]}
    >
      <View
        style={[styles.iconBox, { backgroundColor: colors.surfaceOffset }]}
      />
      <View style={styles.info}>
        <View style={styles.row}>
          <View
            style={[styles.badge, { backgroundColor: colors.surfaceOffset }]}
          />
          <View
            style={[
              styles.skelLine,
              { backgroundColor: colors.surfaceOffset, width: 52 },
            ]}
          />
        </View>
        <View
          style={[
            styles.skelLine,
            { backgroundColor: colors.surfaceOffset, width: "85%" },
          ]}
        />
        <View
          style={[
            styles.skelLine,
            { backgroundColor: colors.surfaceOffset, width: "60%" },
          ]}
        />
      </View>
    </Animated.View>
  );
}

function AnimatedHistoryCard({
  item,
  index,
  colors,
  onSelect,
  onDelete,
}: {
  item: HistoryItem;
  index: number;
  colors: any;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const translateY = useSharedValue(12);
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const isDeleting = useSharedValue(false);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const deleteBgStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < -40 ? 1 : 0,
  }));

  // Staggered entrance — runs once on mount, not on every focus
  useEffect(() => {
    translateY.value = withDelay(
      Math.min(index * 25, 200),
      withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) }),
    );
    opacity.value = withDelay(
      Math.min(index * 25, 200),
      withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) }),
    );
  }, [index]);

  const triggerDelete = useCallback(() => {
    "worklet";
    if (isDeleting.value) return;
    isDeleting.value = true;
    translateX.value = withTiming(
      -400,
      { duration: 260, easing: Easing.in(Easing.cubic) },
      () => {
        runOnJS(onDelete)();
      },
    );
  }, [onDelete]);

  const pan = Gesture.Pan()
    .activeOffsetX([-30, 30])
    .onUpdate((e) => {
      if (isDeleting.value) return;
      translateX.value = Math.min(0, e.translationX);
    })
    .onEnd((e) => {
      if (isDeleting.value) return;
      if (e.translationX < -80 || e.velocityX < -500) {
        translateX.value = withTiming(-80, {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        });
      } else {
        translateX.value = withTiming(0, {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        });
      }
    });

  const singleTap = Gesture.Tap()
    .maxDuration(250)
    .onEnd(() => {
      "worklet";
      // If card is swiped open, snap back instead of navigating
      if (translateX.value < -10) {
        translateX.value = withTiming(0, {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        });
      } else {
        runOnJS(onSelect)();
      }
    });

  const composed = Gesture.Simultaneous(pan, singleTap);

  const TYPE_ICONS: Record<string, IconName> = {
    url: "link-outline",
    text: "text-outline",
    wifi: "wifi-outline",
    email: "mail-outline",
    phone: "call-outline",
    sms: "chatbubble-outline",
    contact: "person-outline",
    location: "globe-outline",
  };

  return (
    <View style={styles.swipeWrap}>
      {/* Delete background — revealed when card swiped left */}
      <Animated.View style={[styles.deleteBg, deleteBgStyle]}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            triggerDelete();
          }}
          activeOpacity={0.7}
          style={styles.deleteBtnInner}
        >
          <Icon name="trash-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <GestureDetector gesture={composed}>
        <Animated.View style={animStyle}>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={[styles.iconBox, { backgroundColor: colors.surfaceOffset }]}>
              <Icon
                name={TYPE_ICONS[item.type] ?? "qr-code-outline"}
                size={22}
                color={colors.primary}
              />
            </View>

            <View style={styles.info}>
              <View style={styles.row}>
                <View style={[styles.badge, { backgroundColor: colors.surfaceOffset }]}>
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
                style={[
                  styles.value,
                  { color: colors.text, fontFamily: Fonts.mono },
                ]}
                numberOfLines={2}
              >
                {item.value}
              </Text>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export default function HistoryScreen() {
  const { colors } = useTheme();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();

  // Reload history on every screen focus so new entries created elsewhere
  // appear immediately.  The skeleton placeholder only shows on the very
  // first load — subsequent focuses silently refresh the list.
  const firstLoad = useRef(true);
  useFocusEffect(
    useCallback(() => {
      let aborted = false;
      loadHistory().then((data) => {
        if (aborted) return;
        setItems(data);
        if (firstLoad.current) {
          firstLoad.current = false;
          setLoading(false);
        }
      });
      return () => {
        aborted = true;
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
    toast.confirm(
      "Clear History",
      "Delete all QR codes?",
      async () => {
        await clearHistory();
        setItems([]);
      },
      "Clear All",
      true,
    );
  }, [toast]);

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

  const renderItem = ({
    item,
    index,
  }: {
    item: HistoryItem;
    index: number;
  }) => (
    <AnimatedHistoryCard
      item={item}
      index={index}
      colors={colors}
      onSelect={() => openDetail(index)}
      onDelete={() => handleDelete(item.id)}
    />
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
            <Icon name="trash-outline" size={20} color={colors.error} />
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
          <Icon name="search-outline" size={16} color={colors.textMuted} />
          <TextInput
            style={[
              styles.searchInput,
              { color: colors.text, fontFamily: Fonts.mono },
            ]}
            placeholder="Search..."
            placeholderTextColor={colors.textFaint}
            value={query}
            onChangeText={setQuery}
            selectionColor={colors.primary + "60"}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Icon
                name="close-circle"
                size={16}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      {loading ? (
        <View
          style={{
            padding: Spacing.base,
            gap: Spacing.sm,
            paddingBottom: insets.bottom + Spacing.xl,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} colors={colors} />
          ))}
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="albums-outline" size={52} color={colors.textFaint} />
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
  swipeWrap: {
    position: "relative",
    overflow: "hidden",
    borderRadius: Radius.lg,
  },
  deleteBg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#dc2626",
    borderRadius: Radius.lg,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: Spacing.lg,
  },
  deleteBtnInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  skelLine: { height: 10, borderRadius: 4 },
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
