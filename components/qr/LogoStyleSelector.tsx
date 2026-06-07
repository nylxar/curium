// components/qr/LogoStyleSelector.tsx
//
// Controls for the center-logo styling:
//   • Background shape (none, circle, rounded, square)
//   • Padding slider (0–20%)
//   • Border toggle
//   • Shadow toggle
//
// Text colors use the theme's `colors.text` and `colors.textMuted`
// instead of the QR's `fgColor`.  The QR fg can be a very light or
// very dark color (depending on the active palette), and when it
// matches the sheet's `colors.surface` background, the text becomes
// invisible.  Theme text colors are always readable on the sheet.

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from "react-native";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import * as Haptics from "expo-haptics";
import { LogoStyleConfig, LogoBackground } from "@/types/qr";

const BACKGROUNDS: Array<{
  id: LogoBackground;
  label: string;
  icon: string;
}> = [
  { id: "none", label: "None", icon: "○" },
  { id: "circle", label: "Circle", icon: "●" },
  { id: "rounded", label: "Rounded", icon: "▢" },
  { id: "square", label: "Square", icon: "■" },
];

interface Props {
  value: LogoStyleConfig;
  /** Tint color for the active/highlighted state (QR fg color). */
  fgColor: string;
  bgColor: string;
  onChange: (s: LogoStyleConfig) => void;
}

export function LogoStyleSelector({
  value,
  fgColor,
  bgColor,
  onChange,
}: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      {/* Background shape */}
      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
        BACKGROUND
      </Text>
      <View style={styles.row}>
        {BACKGROUNDS.map((b) => {
          const active = value.background === b.id;
          return (
            <TouchableOpacity
              key={b.id}
              onPress={() => {
                Haptics.selectionAsync();
                onChange({ ...value, background: b.id });
              }}
              style={[
                styles.bgBtn,
                {
                  backgroundColor: active
                    ? fgColor + "18"
                    : colors.surfaceOffset + "60",
                  borderColor: active ? fgColor : colors.border,
                },
              ]}
              activeOpacity={0.6}
            >
              <Text
                style={[
                  styles.bgIcon,
                  { color: active ? fgColor : colors.text },
                ]}
              >
                {b.icon}
              </Text>
              <Text
                style={[
                  styles.bgLabel,
                  { color: active ? fgColor : colors.text },
                ]}
              >
                {b.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Padding slider */}
      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
        PADDING · {value.padding}%
      </Text>
      <View style={styles.sliderRow}>
        {[0, 5, 10, 15, 20].map((p) => {
          const active = Math.abs(value.padding - p) < 1;
          return (
            <TouchableOpacity
              key={p}
              onPress={() => {
                Haptics.selectionAsync();
                onChange({ ...value, padding: p });
              }}
              style={[
                styles.padBtn,
                {
                  backgroundColor: active
                    ? fgColor + "18"
                    : colors.surfaceOffset + "60",
                  borderColor: active ? fgColor : colors.border,
                },
              ]}
              activeOpacity={0.6}
            >
              <Text
                style={[
                  styles.padLabel,
                  { color: active ? fgColor : colors.text },
                ]}
              >
                {p}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Toggles */}
      <View style={styles.toggleRow}>
        <Text style={[styles.toggleLabel, { color: colors.text }]}>
          Border
        </Text>
        <Switch
          value={value.border}
          onValueChange={(v) => {
            Haptics.selectionAsync();
            onChange({ ...value, border: v });
          }}
          trackColor={{ false: colors.border, true: fgColor + "60" }}
          thumbColor={value.border ? fgColor : "#f4f3f4"}
        />
      </View>
      <View style={styles.toggleRow}>
        <Text style={[styles.toggleLabel, { color: colors.text }]}>
          Shadow
        </Text>
        <Switch
          value={value.shadow}
          onValueChange={(v) => {
            Haptics.selectionAsync();
            onChange({ ...value, shadow: v });
          }}
          trackColor={{ false: colors.border, true: fgColor + "60" }}
          thumbColor={value.shadow ? fgColor : "#f4f3f4"}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  sectionLabel: {
    fontSize: 10,
    fontFamily: Fonts.monoBold,
    letterSpacing: 1,
    marginTop: Spacing.sm,
  },
  row: { flexDirection: "row", gap: Spacing.sm },
  bgBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
    gap: 4,
  },
  bgIcon: { fontSize: 18, fontFamily: Fonts.monoBold },
  bgLabel: { fontSize: 9, fontFamily: Fonts.monoMedium },
  sliderRow: { flexDirection: "row", gap: Spacing.sm },
  padBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  padLabel: {
    fontSize: 12,
    fontFamily: Fonts.monoMedium,
    fontWeight: "600",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  toggleLabel: {
    fontSize: FontSize.sm,
    fontFamily: Fonts.monoMedium,
    fontWeight: "600",
  },
});
