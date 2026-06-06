import { ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";
import { tierVariant } from "@/constants/colorUtils";
import { AnimatedSheet } from "@/components/ui/AnimatedSheet";
import { useEffect, useLayoutEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  interpolateColor,
} from "react-native-reanimated";

interface OptionRowProps {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  preview?: ReactNode;
  tintColor: string;
  bgColor?: string;
  onOpen?: () => void;
  onClose?: () => void;
  sheetOpen?: boolean;
  sheetSubtitle?: string;
  children?: ReactNode;
}

export function OptionRow({
  label,
  iconName,
  preview,
  tintColor,
  bgColor,
  onOpen,
  onClose,
  sheetOpen: externalOpen,
  sheetSubtitle,
  children,
}: OptionRowProps) {
  const { colors } = useTheme();
  // 3-tier hierarchy:
  //   • bgColor (QR canvas)            = original
  //   • row color (this row)           = mid tier
  //   • screen bg (in index.tsx)       = lightest tier
  // We still accept a custom bgColor prop; if absent, we derive the mid tier
  // from the active palette so the depth is consistent.
  const rowColor = bgColor ?? tierVariant(colors.surface, 0.05);

  // Animate the row bg color so it cross-fades in lock-step with the QR and
  // screen bg transitions.  Otherwise the rows snap to the new color while
  // the screen bg is still mid-transition, producing a "mixed color" glitch.
  const bgFrom = useSharedValue(rowColor);
  const bgTo = useSharedValue(rowColor);
  const bgProgress = useSharedValue(1);
  const pressOpacity = useSharedValue(0);

  useLayoutEffect(() => {
    if (rowColor !== bgTo.value) {
      bgFrom.value = bgTo.value;
      bgTo.value = rowColor;
      bgProgress.value = 0;
      bgProgress.value = withTiming(1, {
        duration: 420,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [rowColor]);

  const animBgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      bgProgress.value,
      [0, 1],
      [bgFrom.value, bgTo.value],
    ),
  }));
  const pressStyle = useAnimatedStyle(() => ({
    opacity: pressOpacity.value,
  }));

  return (
    <>
      <Pressable
        onPress={() => {
          // One-shot press flash (in 80ms → out 200ms).  We intentionally
          // avoid onPressIn/onPressOut so the press state can't get stuck
          // "on" if a modal opens and captures the touch release event.
          pressOpacity.value = withSequence(
            withTiming(1, { duration: 80, easing: Easing.out(Easing.quad) }),
            withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) }),
          );
          onOpen?.();
        }}
      >
        <Animated.View
          style={[
            styles.row,
            animBgStyle,
            { borderColor: colors.border, overflow: "hidden" },
          ]}
        >
          {/* Press overlay — sits on top of the cross-faded bg, fades in
              briefly while the user is pressing.  The overlay color is a
              darker tier of the row color so the press feels physical. */}
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colors.surfaceOffset },
              pressStyle,
            ]}
          />
          <View
            style={[styles.iconBox, { backgroundColor: tintColor + "18" }]}
          >
            <Ionicons name={iconName} size={18} color={tintColor} />
          </View>
          <Text
            style={[
              styles.label,
              { color: colors.text, fontFamily: Fonts.monoMedium },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          <View style={styles.right}>
            {preview ? <View style={styles.preview}>{preview}</View> : null}
            <View
              style={[
                styles.chevronWrap,
                { backgroundColor: colors.surfaceOffset },
              ]}
            >
              <Ionicons
                name="chevron-forward"
                size={14}
                color={colors.textMuted}
              />
            </View>
          </View>
        </Animated.View>
      </Pressable>

      <AnimatedSheet
        visible={!!externalOpen}
        onClose={onClose ?? (() => {})}
        bgColor={colors.surface}
        borderColor={colors.border}
      >
        <View style={styles.sheetHeader}>
          <View
            style={[
              styles.sheetIconCircle,
              { backgroundColor: tintColor + "18" },
            ]}
          >
            <Ionicons name={iconName} size={20} color={tintColor} />
          </View>
          <View style={styles.sheetTitles}>
            <Text
              style={[
                styles.sheetTitle,
                { color: colors.text, fontFamily: Fonts.monoBold },
              ]}
            >
              {label}
            </Text>
            {sheetSubtitle ? (
              <Text
                style={[
                  styles.sheetSubtitle,
                  { color: colors.textMuted, fontFamily: Fonts.mono },
                ]}
              >
                {sheetSubtitle}
              </Text>
            ) : null}
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            style={({ pressed }) => [
              styles.sheetClose,
              {
                backgroundColor: pressed
                  ? colors.surfaceOffset
                  : colors.surfaceOffset + "80",
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="close" size={16} color={colors.textMuted} />
          </Pressable>
        </View>

        <View
          style={[
            styles.sheetAccent,
            { backgroundColor: tintColor + "50" },
          ]}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </AnimatedSheet>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    flex: 1,
    fontSize: FontSize.base,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  preview: {
    alignItems: "flex-end",
  },
  chevronWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingTop: Spacing.xs,
  },
  sheetIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitles: {
    flex: 1,
    gap: 2,
  },
  sheetTitle: {
    fontSize: FontSize.lg,
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
  },
  sheetClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  sheetAccent: {
    height: 2,
    borderRadius: 1,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    alignSelf: "flex-start",
    width: 36,
  },
  scroll: { maxHeight: 500 },
  content: { gap: Spacing.sm, paddingBottom: Spacing.sm },
});
