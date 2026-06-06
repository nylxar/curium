import { useState, useLayoutEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolateColor,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Radius, Spacing, FontSize, Fonts } from "@/constants/theme";
import { AnimatedSheet } from "@/components/ui/AnimatedSheet";

const NAV_ITEMS = [
  { route: "/", label: "Create", icon: "add-circle-outline" },
  { route: "/scan", label: "Scan", icon: "scan-outline" },
  { route: "/history", label: "History", icon: "albums-outline" },
  { route: "/settings", label: "Settings", icon: "settings-outline" },
] as const;

interface BtnProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  primary?: boolean;
  tintColor: string;
  bgColor: string;
  disabled?: boolean;
}

function Btn({
  icon,
  label,
  onPress,
  primary,
  tintColor,
  bgColor,
  disabled,
}: BtnProps) {
  return (
    <View style={[styles.btnWrap, { opacity: disabled ? 0.4 : 1 }]}>
      <TouchableOpacity
        onPress={() => {
          if (!disabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress();
          }
        }}
        activeOpacity={0.6}
        disabled={disabled}
      >
        <View
          style={[
            styles.btnCircle,
            primary
              ? { backgroundColor: tintColor }
              : {
                  backgroundColor: tintColor + "20",
                  borderWidth: 1,
                  borderColor: tintColor + "35",
                },
          ]}
        >
          <Ionicons name={icon} size={21} color={primary ? bgColor : tintColor} />
        </View>
      </TouchableOpacity>
      <Text style={[styles.btnLabel, { color: tintColor + "cc" }]}>
        {label}
      </Text>
    </View>
  );
}

interface Props {
  tintColor: string;
  bgColor: string;
  disabled: boolean;
  onCopy: () => void;
  onShuffle: () => void;
  onShare: () => void;
}

export function FabBar({
  tintColor,
  bgColor,
  disabled,
  onCopy,
  onShuffle,
  onShare,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Animate the bar's bg + border colors in lock-step with the rest of the
  // screen (QR, rows, GlowPulse).  Without this, the bar snaps instantly to
  // the new color while everything else is mid-transition — visible desync.
  const bgFrom = useSharedValue(bgColor);
  const bgTo = useSharedValue(bgColor);
  const bgProgress = useSharedValue(1);
  const borderColor = tintColor + "20";
  const borderFrom = useSharedValue(borderColor);
  const borderTo = useSharedValue(borderColor);
  const borderProgress = useSharedValue(1);

  useLayoutEffect(() => {
    if (bgColor !== bgTo.value) {
      bgFrom.value = bgTo.value;
      bgTo.value = bgColor;
      bgProgress.value = 0;
      bgProgress.value = withTiming(1, {
        duration: 420,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [bgColor]);

  useLayoutEffect(() => {
    const next = tintColor + "20";
    if (next !== borderTo.value) {
      borderFrom.value = borderTo.value;
      borderTo.value = next;
      borderProgress.value = 0;
      borderProgress.value = withTiming(1, {
        duration: 420,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [tintColor]);

  const animBarStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      bgProgress.value,
      [0, 1],
      [bgFrom.value, bgTo.value],
    ),
    borderTopColor: interpolateColor(
      borderProgress.value,
      [0, 1],
      [borderFrom.value, borderTo.value],
    ),
  }));

  const go = (route: string) => {
    setMenuOpen(false);
    setTimeout(() => router.push(route as any), 80);
  };

  return (
    <>
      <Animated.View
        style={[
          styles.bar,
          {
            paddingBottom: insets.bottom + Spacing.sm,
          },
          animBarStyle,
        ]}
      >
        <View style={styles.row}>
          <Btn
            icon="copy-outline"
            label="Copy"
            tintColor={tintColor}
            bgColor={bgColor}
            onPress={onCopy}
            disabled={disabled}
          />
          <Btn
            icon="shuffle"
            label="Random"
            tintColor={tintColor}
            bgColor={bgColor}
            onPress={onShuffle}
            disabled={disabled}
            primary
          />
          <Btn
            icon="share-outline"
            label="Share"
            tintColor={tintColor}
            bgColor={bgColor}
            onPress={onShare}
            disabled={disabled}
          />
          <Btn
            icon="menu"
            label="Menu"
            tintColor={tintColor}
            bgColor={bgColor}
            onPress={() => setMenuOpen(true)}
          />
        </View>
      </Animated.View>

      <AnimatedSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        bgColor={bgColor}
        borderColor={tintColor + "25"}
      >
        {NAV_ITEMS.map((item, i) => (
          <TouchableOpacity
            key={item.route}
            style={[
              styles.navRow,
              i < NAV_ITEMS.length - 1 && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: tintColor + "20",
              },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              go(item.route);
            }}
            activeOpacity={0.6}
          >
            <View style={[styles.navIcon, { backgroundColor: tintColor + "18" }]}>
              <Ionicons name={item.icon as any} size={20} color={tintColor} />
            </View>
            <Text style={[styles.navLabel, { color: tintColor }]}>
              {item.label}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={tintColor + "40"} />
          </TouchableOpacity>
        ))}
      </AnimatedSheet>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-start",
    paddingHorizontal: Spacing.md,
  },
  btnWrap: { alignItems: "center", gap: Spacing.xs },
  btnCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  btnLabel: { fontSize: FontSize.xs, fontFamily: Fonts.monoMedium, fontWeight: "600" },

  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md + 2,
  },
  navIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: { flex: 1, fontSize: FontSize.md ?? 15, fontFamily: Fonts.monoMedium, fontWeight: "600" },
});
