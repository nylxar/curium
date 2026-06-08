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
import { AnimatedSheet } from "@/components/ui/AnimatedSheet";

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
  /** When true, the one-shot press flash is suppressed entirely. */
  noPressFlash?: boolean;
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
  noPressFlash,
}: OptionRowProps) {
  const { colors } = useTheme();
  // Row bg is THEME-DRIVEN (not QR-color driven).  Using a tierVariant
  // of the QR bg here made option rows swing with every palette
  // change, which felt like the option rows were "part of" the QR
  // instead of part of the app chrome.  Tying them to the theme
  // keeps the screen, rows, and sheet bodies visually consistent
  // across all palettes and themes (light/dark).  The QR fg color
  // still tints the icon and the press flash — that's the only place
  // the active palette leaks into the chrome.
  const rowColor = bgColor ?? colors.surface;

  return (
    <>
      <Pressable
        onPress={() => {
          onOpen?.();
        }}
        // Explicitly opt out of any default hover style (gray wash on web).
        style={() => [{}]}
      >
        <View
          style={[
            styles.row,
            { backgroundColor: rowColor, borderColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.iconBox,
              // Icon-box bg is THEME-driven (not palette-driven).  Using
              // `tintColor + "18"` here was the original problem: when
              // the QR fg is a light color (e.g. "ink" palette with
              // #f5f0e8 fg), the box is barely visible and the icon —
              // also `tintColor` — disappears into it.  Tying the box
              // to `colors.surfaceOffset` keeps it readable on every
              // palette, every theme.  The QR palette still tints the
              // press flash and the active cell highlight, so the
              // identity is preserved where it matters.
              { backgroundColor: colors.surfaceOffset },
            ]}
          >
            <Ionicons name={iconName} size={18} color={colors.text} />
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
        </View>
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
              // Sheet header icon: a subtle palette-tinted bg (so the
              // sheet still reads as belonging to the active palette),
              // but the icon itself is theme text — readable on any
              // bg.  This is the same trade-off as the row icon above.
              { backgroundColor: tintColor + "12" },
            ]}
          >
            <Ionicons name={iconName} size={20} color={colors.text} />
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
          {/* Wrapper view ensures every option modal's children get a
              consistent horizontal gutter and stack vertically with the
              same gap.  Without this wrapper, child grids end up flush
              against the left edge of the sheet and look misaligned. */}
          <View style={styles.sheetBody}>{children}</View>
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
  content: { paddingBottom: Spacing.sm },
  sheetBody: {
    gap: Spacing.md,
    // Subtle horizontal padding keeps child grids inside the sheet's
    // rounded corners and aligned with the header's icon circle.  Too
    // much padding crowds the grids; too little hugs the rounded edges.
    paddingHorizontal: Spacing.xs,
  },
});
