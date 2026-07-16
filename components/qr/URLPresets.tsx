import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
  Keyboard,
  Dimensions,
  BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useOverlay } from "@/components/ui/Overlay";
import { useTheme } from "@/context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Radius, FontSize, Spacing, Fonts } from "@/constants/theme";

const URL_PRESETS: { label: string; prefix: string }[] = [
  { label: "YouTube", prefix: "https://youtube.com/" },
  { label: "Instagram", prefix: "https://instagram.com/" },
  { label: "TikTok", prefix: "https://tiktok.com/@" },
  { label: "Facebook", prefix: "https://facebook.com/" },
  { label: "X", prefix: "https://x.com/" },
  { label: "LinkedIn", prefix: "https://linkedin.com/in/" },
  { label: "Spotify", prefix: "https://open.spotify.com/" },
  { label: "Telegram", prefix: "https://t.me/" },
  { label: "WhatsApp", prefix: "https://wa.me/" },
  { label: "GitHub", prefix: "https://github.com/" },
  { label: "Twitch", prefix: "https://twitch.tv/" },
  { label: "Discord", prefix: "https://discord.gg/" },
  { label: "Pinterest", prefix: "https://pinterest.com/" },
  { label: "Reddit", prefix: "https://reddit.com/u/" },
  { label: "Snapchat", prefix: "https://snapchat.com/add/" },
  { label: "SoundCloud", prefix: "https://soundcloud.com/" },
];

export function URLPresets({
  tintColor,
  onSelect,
}: {
  tintColor: string;
  onSelect: (prefix: string) => void;
}) {
  const overlay = useOverlay();
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    Keyboard.dismiss();
    setOpen(true);
    const id = overlay.show(
      <PresetSheet
        onSelect={(prefix) => {
          onSelect(prefix);
          overlay.dismiss(id);
          setOpen(false);
        }}
        onClose={() => {
          overlay.dismiss(id);
          setOpen(false);
        }}
      />,
    );
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.trigger,
        { borderColor: tintColor + "40", backgroundColor: tintColor + "10" },
      ]}
      onPress={handleOpen}
    >
      <Text style={[styles.triggerText, { color: tintColor }]}>Quick fill</Text>
      <Ionicons
        name="chevron-down"
        size={14}
        color={tintColor}
        style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}
      />
    </TouchableOpacity>
  );
}

function PresetSheet({
  onSelect,
  onClose,
}: {
  onSelect: (prefix: string) => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: screenH } = Dimensions.get("window");
  const listMax = Math.min(screenH * 0.6, 460);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [onClose]);

  const [scroll, setScroll] = useState({ y: 0, contentH: 0, visibleH: 0 });
  const scrollable = scroll.contentH > scroll.visibleH;

  const onScroll = useCallback(
    (e: { nativeEvent: { contentOffset: { y: number } | null } }) => {
      const y = e.nativeEvent?.contentOffset?.y ?? 0;
      setScroll((s) => ({ ...s, y }));
    },
    [],
  );
  const onContentSizeChange = useCallback(
    (_: number, h: number) => setScroll((s) => ({ ...s, contentH: h })),
    [],
  );
  const onLayout = useCallback(
    (e: { nativeEvent: { layout: { height: number } } }) =>
      setScroll((s) => ({ ...s, visibleH: e.nativeEvent.layout.height })),
    [],
  );

  const thumbTop = scrollable
    ? (scroll.y / scroll.contentH) * scroll.visibleH
    : 0;
  const thumbH = scrollable
    ? Math.max(24, (scroll.visibleH / scroll.contentH) * scroll.visibleH)
    : 0;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable
        style={[StyleSheet.absoluteFill, { backgroundColor: "#000", opacity: 0.32 }]}
        onPress={onClose}
        pointerEvents="auto"
      />
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + Spacing.lg,
          },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        <Text
          style={[
            styles.title,
            { color: colors.textMuted, fontFamily: Fonts.monoMedium },
          ]}
        >
          Quick fill
        </Text>

        <View style={styles.listWrap}>
          <ScrollView
            style={{ maxHeight: listMax }}
            contentContainerStyle={{ paddingRight: Spacing.sm + 4 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onScroll={onScroll}
            onContentSizeChange={onContentSizeChange}
            onLayout={onLayout}
            scrollEventThrottle={16}
          >
            {URL_PRESETS.map((p) => (
              <TouchableOpacity
                key={p.label}
                activeOpacity={0.6}
                style={[styles.item, { borderBottomColor: colors.border + "30" }]}
                onPress={() => onSelect(p.prefix)}
              >
                <Text
                  style={[
                    styles.itemLabel,
                    { color: colors.text, fontFamily: Fonts.monoMedium },
                  ]}
                >
                  {p.label}
                </Text>
                <Text
                  style={[
                    styles.itemPrefix,
                    { color: colors.textMuted, fontFamily: Fonts.mono },
                  ]}
                >
                  {p.prefix}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {scrollable && (
            <View
              style={[
                styles.scrollTrack,
                { backgroundColor: colors.border + "30" },
              ]}
            >
              <View
                style={[
                  styles.scrollThumb,
                  {
                    top: thumbTop,
                    height: thumbH,
                    backgroundColor: colors.text + "25",
                  },
                ]}
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  triggerText: { fontSize: FontSize.xs, fontFamily: Fonts.monoMedium },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xs,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginLeft: 2,
  },
  listWrap: { position: "relative" },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm + 1,
    paddingHorizontal: Spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemLabel: { fontSize: FontSize.sm },
  itemPrefix: { fontSize: FontSize.xs, opacity: 0.6 },
  scrollTrack: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderRadius: 1.5,
  },
  scrollThumb: {
    width: 3,
    borderRadius: 1.5,
    position: "absolute",
  },
});
