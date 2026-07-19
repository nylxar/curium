import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Radius, Spacing, FontSize, Fonts } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { AnimatedSheet } from "@/components/ui/AnimatedSheet";

const NAV_ITEMS = [
  { route: "/", label: "Create", icon: "add-circle-outline" },
  { route: "/scan", label: "Scan", icon: "scan-outline" },
  { route: "/history", label: "History", icon: "albums-outline" },
  { route: "/settings", label: "Settings", icon: "settings-outline" },
] as const;

interface NavRowProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  isLast: boolean;
  index: number;
  openTick: number;
}

// A single row in the menu sheet.  Animates in with a small fade + lift
// (200ms) staggered by `index * 35ms` so the menu feels intentional
// rather than just appearing.  Triggered by `openTick` changing — when
// the sheet reopens, every row plays its entrance again.
function NavRow({
  icon,
  label,
  onPress,
  isLast,
  index,
  openTick,
}: NavRowProps) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0);
  const lift = useSharedValue(8);

  useEffect(() => {
    opacity.value = 0;
    lift.value = 8;
    opacity.value = withDelay(
      60 + index * 35,
      withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) }),
    );
    lift.value = withDelay(
      60 + index * 35,
      withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openTick]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: lift.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={[
          styles.navRow,
          !isLast && styles.navRowDivider,
        ]}
        onPress={() => {
          Haptics.selectionAsync();
          onPress();
        }}
        activeOpacity={0.55}
      >
        <View
          style={[
            styles.navIcon,
            { backgroundColor: colors.surfaceOffset },
          ]}
        >
          <Icon name={icon} size={20} color={colors.text} />
        </View>
        <Text style={[styles.navLabel, { color: colors.text }]}>
          {label}
        </Text>
        <Icon
          name="chevron-forward"
          size={16}
          color={colors.textFaint}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

interface BtnProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
}

// iOS-style action button.  Inactive: subtle pill (theme surfaceOffset
// bg, theme text icon).  Primary: filled pill (theme primary bg, theme
// bg icon) — mirrors the iOS bottom-bar's "elevated" main action
// (e.g. compose button in Mail).  Tap plays a one-shot scale flash
// (0.92 → 1) for haptic-y feedback without springs.
function Btn({ icon, label, onPress, primary, disabled }: BtnProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSequence(
      withSpring(0.9, { damping: 15, stiffness: 400 }),
      withSpring(1, { damping: 15, stiffness: 300 }),
    );
    onPress();
  };
  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <View style={[styles.btnWrap, { opacity: disabled ? 0.4 : 1 }]}>
      <Animated.View style={scaleStyle}>
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={1}
          disabled={disabled}
        >
          <View
            style={[
              styles.btnCircle,
              primary
                ? {
                    backgroundColor: colors.text,
                    shadowColor: colors.text,
                    shadowOpacity: 0.18,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 4,
                  }
                : {
                    backgroundColor: colors.surfaceOffset,
                  },
            ]}
          >
            <Icon
              name={icon}
              size={20}
              color={primary ? colors.bg : colors.text}
            />
          </View>
        </TouchableOpacity>
      </Animated.View>
      <Text
        style={[styles.btnLabel, { color: colors.textMuted }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
      >
        {label}
      </Text>
    </View>
  );
}

interface Props {
  /** @deprecated — tintColor is ignored.  The bar is theme-driven. */
  tintColor?: string;
  /** @deprecated — bgColor is ignored.  The bar is theme-driven. */
  bgColor?: string;
  disabled: boolean;
  onCopy: () => void;
  onShuffle: () => void;
  onShare: () => void;
}

// iOS-style floating action bar.
//
// Design notes:
//   • Glass surface — theme `surface` with a hairline top border (no
//     platform-specific blur; we use the theme surface so the bar
//     reads as part of the app chrome instead of "tinted" by the QR.
//   • The `primary` action (Random / Shuffle) is the elevated pill in
//     the centre — same convention as iOS Mail's compose button.
//   • 1px hairline divider above the bar (theme border).
//   • Bottom safe-area inset is added to the inner padding so the
//     bar clears the home indicator / gesture bar.
//   • Pressed buttons flash a 0.9 → 1 scale, no spring.
export function FabBar({
  disabled,
  onCopy,
  onShuffle,
  onShare,
}: Props) {
  const { colors } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openTick, setOpenTick] = useState(0);
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (menuOpen && !prevOpenRef.current) {
      setOpenTick((t) => t + 1);
    }
    prevOpenRef.current = menuOpen;
  }, [menuOpen]);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const go = (route: string) => {
    setMenuOpen(false);
    requestIdleCallback(() => {
      if (route === "/") {
        // Pop every pushed screen so the existing CreateScreen instance
        // (with its form data and QR style) is revealed instead of
        // pushing a fresh "/" which resets all state.
        // NOTE: router.dismissAll() is not supported by Stack — it
        // throws "POP_TO_TOP was not handled".  router.navigate pops
        // to the existing "/" screen if it's already in the stack.
        router.navigate("/");
      } else {
        router.push(route as any);
      }
    });
  };

  return (
    <>
      <View
        style={[
          styles.barWrap,
          {
            paddingBottom: insets.bottom + Spacing.sm,
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            // Subtle drop shadow on iOS so the bar feels "above" the
            // page content.  Android uses elevation.
            ...Platform.select({
              ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
              },
              android: {
                elevation: 8,
              },
            }),
          },
        ]}
      >
        <View style={styles.row}>
          <Btn
            icon="copy-outline"
            label="Copy"
            onPress={onCopy}
            disabled={disabled}
          />
          <Btn
            icon="shuffle"
            label="Random"
            onPress={onShuffle}
            disabled={disabled}
            primary
          />
          <Btn
            icon="share-outline"
            label="Share"
            onPress={onShare}
            disabled={disabled}
          />
          <Btn
            icon="menu"
            label="Menu"
            onPress={() => setMenuOpen(true)}
          />
        </View>
      </View>

      <AnimatedSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        bgColor={colors.surface}
        borderColor={colors.border}
      >
        {NAV_ITEMS.map((item, i) => (
          <NavRow
            key={item.route}
            icon={item.icon as IconName}
            label={item.label}
            isLast={i === NAV_ITEMS.length - 1}
            index={i}
            openTick={openTick}
            onPress={() => go(item.route)}
          />
        ))}
      </AnimatedSheet>
    </>
  );
}

const styles = StyleSheet.create({
  // The bar is a fixed-height floating surface pinned to the bottom
  // of the parent.  We use a wrapping View (not Animated.View) so
  // there's no animated background that could desync with the row
  // cross-fades.
  barWrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.sm + 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-start",
    paddingHorizontal: Spacing.md,
  },
  btnWrap: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  btnCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  btnLabel: {
    width: "100%",
    fontSize: FontSize.xs,
    textAlign: "center",
    fontFamily: Fonts.monoMedium,
    letterSpacing: 0.2,
    includeFontPadding: false,
  },

  // Nav menu sheet rows — iOS-style list with hairline dividers.
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.xs,
  },
  navRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(127,127,127,0.2)",
  },
  navIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: {
    flex: 1,
    fontSize: FontSize.md,
    fontFamily: Fonts.monoMedium,
    fontWeight: "600",
  },
});
