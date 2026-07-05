import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { QRType } from "@/types/qr";
import { useTheme } from "@/context/ThemeContext";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";
import { AnimatedSheet } from "@/components/ui/AnimatedSheet";

interface Props {
  selected: QRType;
  /** Tint color (QR fg) — used only for the press flash and the
   *  active cell highlight in the picker.  Inactive cells, the
   *  row bg, and the icons are theme-driven. */
  tintColor: string;
  /** @deprecated — bgColor prop is kept for API compatibility but
   *  unused; the row bg is `colors.surface` (theme-driven). */
  bgColor?: string;
  onChange: (t: QRType) => void;
}

const TYPES: {
  id: QRType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: "url", label: "URL", icon: "link-outline" },
  { id: "text", label: "Text", icon: "text-outline" },
  { id: "wifi", label: "WiFi", icon: "wifi-outline" },
  { id: "email", label: "Email", icon: "mail-outline" },
  { id: "phone", label: "Phone", icon: "call-outline" },
  { id: "sms", label: "SMS", icon: "chatbubble-outline" },
  { id: "contact", label: "Contact", icon: "person-outline" },
  { id: "location", label: "Location", icon: "location-outline" },
  { id: "event", label: "Event", icon: "calendar-outline" },
  { id: "otpauth", label: "OTP Auth", icon: "key-outline" },
];

export function TypeSelector({ selected, tintColor, onChange }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const current = TYPES.find((t) => t.id === selected)!;

  // Row bg is THEME-driven (not palette-driven).  See OptionRow for
  // the rationale: a palette-tinted row makes the chrome feel like
  // part of the QR; tying it to `colors.surface` keeps the chrome
  // consistent across palettes and themes.  The QR palette still
  // tints the press flash and the active cell highlight.
  return (
    <>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          setOpen(true);
        }}
        style={() => [{}]}
      >
        <View
          style={[
            styles.row,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Icon-box bg is theme-driven so the icon stays readable
              on light-fg palettes (ink).  See OptionRow. */}
          <View
            style={[
              styles.rowIcon,
              { backgroundColor: colors.surfaceOffset },
            ]}
          >
            <Ionicons name={current.icon} size={18} color={colors.text} />
          </View>
          <View style={styles.rowText}>
            <Text
              style={[
                styles.rowLabel,
                { color: colors.textMuted, fontFamily: Fonts.mono },
              ]}
            >
              QR Type
            </Text>
            <Text
              style={[
                styles.rowSub,
                {
                  color: colors.text,
                  fontFamily: Fonts.monoMedium,
                },
              ]}
            >
              {current.label}
            </Text>
          </View>
          <View
            style={[
              styles.rowChevron,
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
      </Pressable>

      <AnimatedSheet
        visible={open}
        onClose={() => setOpen(false)}
        bgColor={colors.surface}
        borderColor={colors.border}
      >
        <Text
          style={[
            styles.sheetTitle,
            { color: colors.text, fontFamily: Fonts.monoBold },
          ]}
        >
          Select QR Type
        </Text>
        <View style={styles.grid}>
          {TYPES.map((t) => {
            const active = t.id === selected;
            return (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.cell,
                  {
                    // Active cell uses the QR palette tint (this is the
                    // "selected" affordance).  Inactive cells use the
                    // theme — that's the user's "chrome".
                    backgroundColor: active
                      ? tintColor + "18"
                      : colors.surfaceOffset,
                    borderColor: active ? tintColor : colors.border,
                    borderWidth: active ? 2 : 1,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  onChange(t.id);
                  setOpen(false);
                }}
                activeOpacity={0.6}
              >
                <Ionicons
                  name={t.icon}
                  size={22}
                  color={active ? tintColor : colors.textMuted}
                />
                <Text
                  style={[
                    styles.cellLabel,
                    {
                      color: active ? tintColor : colors.textMuted,
                      fontFamily: active ? Fonts.monoBold : Fonts.mono,
                    },
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </AnimatedSheet>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  rowChevron: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: FontSize.xs, marginBottom: 1 },
  rowSub: { fontSize: FontSize.base },

  sheetTitle: {
    fontSize: FontSize.md,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    justifyContent: "center",
  },
  cell: {
    width: 72,
    aspectRatio: 1,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  cellLabel: { fontSize: FontSize.xs },
});
