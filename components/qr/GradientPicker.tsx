// components/qr/GradientPicker.tsx
//
// Toggles a 2-stop linear gradient for the QR foreground.  The user picks:
//   • Whether the gradient is on at all
//   • The start color
//   • The end color
//   • The angle (0/90/180/270 presets + free 15° step slider)
//
// When the user taps a color well, the existing full-screen ColorPicker
// modal opens (we reuse the Overlay machinery).  This keeps gradient
// editing consistent with the rest of the app.

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";
import * as Haptics from "expo-haptics";
import { GradientConfig } from "@/types/qr";
import { ColorPicker } from "./ColorPicker";
import { useState } from "react";

interface Props {
  value: GradientConfig;
  fgColor: string;
  bgColor: string;
  onChange: (g: GradientConfig) => void;
}

const ANGLE_PRESETS: Array<{ value: number; label: string; icon: string }> = [
  { value: 0, label: "Bottom → Top", icon: "↑" },
  { value: 90, label: "Left → Right", icon: "→" },
  { value: 180, label: "Top → Bottom", icon: "↓" },
  { value: 270, label: "Right → Left", icon: "←" },
];

export function GradientPicker({
  value,
  fgColor,
  bgColor,
  onChange,
}: Props) {
  // Which color well is being edited, if any.  Drives the ColorPicker modal.
  const [editing, setEditing] = useState<"start" | "end" | null>(null);

  return (
    <View style={styles.wrap}>
      {/* Toggle */}
      <TouchableOpacity
        onPress={() => {
          Haptics.selectionAsync();
          onChange({ ...value, enabled: !value.enabled });
        }}
        style={[
          styles.toggle,
          {
            backgroundColor: value.enabled
              ? fgColor + "18"
              : bgColor + "08",
            borderColor: value.enabled ? fgColor : fgColor + "20",
          },
        ]}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.toggleDot,
            { backgroundColor: value.enabled ? fgColor : fgColor + "30" },
          ]}
        />
        <Text style={[styles.toggleLabel, { color: fgColor }]}>
          {value.enabled ? "Gradient on" : "Gradient off"}
        </Text>
      </TouchableOpacity>

      {value.enabled && (
        <>
          {/* Preview swatch — two solid color stops approximated via
              overlapping translucent views (the real gradient renders
              inside the QR's SVG, not here). */}
          <View
            style={[
              styles.preview,
              { backgroundColor: value.startColor },
            ]}
          >
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: value.endColor,
                  opacity: 0.55,
                },
              ]}
            />
          </View>

          {/* Color wells */}
          <View style={styles.colorRow}>
            <ColorWell
              label="Start"
              color={value.startColor}
              fg={fgColor}
              onPress={() => setEditing("start")}
            />
            <ColorWell
              label="End"
              color={value.endColor}
              fg={fgColor}
              onPress={() => setEditing("end")}
            />
          </View>

          {/* Angle presets */}
          <Text style={[styles.sectionLabel, { color: fgColor + "99" }]}>
            ANGLE
          </Text>
          <View style={styles.angleRow}>
            {ANGLE_PRESETS.map((p) => {
              const active = Math.abs(value.angle - p.value) < 1;
              return (
                <TouchableOpacity
                  key={p.value}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onChange({ ...value, angle: p.value });
                  }}
                  style={[
                    styles.angleBtn,
                    {
                      backgroundColor: active
                        ? fgColor + "18"
                        : bgColor + "05",
                      borderColor: active ? fgColor : fgColor + "20",
                    },
                  ]}
                  activeOpacity={0.6}
                >
                  <Text
                    style={[
                      styles.angleIcon,
                      { color: active ? fgColor : fgColor + "80" },
                    ]}
                  >
                    {p.icon}
                  </Text>
                  <Text
                    style={[
                      styles.angleLabel,
                      { color: active ? fgColor : fgColor + "70" },
                    ]}
                  >
                    {p.value}°
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Fine-tune slider (0–360, 15° step) */}
          <View style={styles.sliderRow}>
            <Text style={[styles.sliderValue, { color: fgColor }]}>
              {value.angle}°
            </Text>
            <View
              style={[
                styles.sliderTrack,
                { backgroundColor: fgColor + "15" },
              ]}
            >
              {Array.from({ length: 24 }).map((_, i) => {
                const a = i * 15;
                const active = Math.abs(a - value.angle) < 8;
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      Haptics.selectionAsync();
                      onChange({ ...value, angle: a });
                    }}
                    style={[
                      styles.tick,
                      {
                        backgroundColor: active ? fgColor : fgColor + "30",
                        height: active ? 16 : 8,
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>

          <ColorPicker
            visible={editing !== null}
            initialColor={
              editing === "start" ? value.startColor : value.endColor
            }
            title={editing === "start" ? "Gradient Start" : "Gradient End"}
            onConfirm={(c) => {
              if (editing === "start") {
                onChange({ ...value, startColor: c });
              } else if (editing === "end") {
                onChange({ ...value, endColor: c });
              }
              setEditing(null);
            }}
            onClose={() => setEditing(null)}
          />
        </>
      )}
    </View>
  );
}

function ColorWell({
  label,
  color,
  fg,
  onPress,
}: {
  label: string;
  color: string;
  fg: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.wellWrap}>
      <Text style={[styles.wellLabel, { color: fg + "99" }]}>{label}</Text>
      <TouchableOpacity
        onPress={() => {
          Haptics.selectionAsync();
          onPress();
        }}
        style={[
          styles.well,
          { borderColor: fg + "25" },
        ]}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.wellSwatch,
            { backgroundColor: color, borderColor: fg + "20" },
          ]}
        />
        <Text style={[styles.wellHex, { color: fg }]}>
          {color.toUpperCase()}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  toggleDot: { width: 8, height: 8, borderRadius: 4 },
  toggleLabel: {
    fontSize: FontSize.sm,
    fontFamily: Fonts.monoMedium,
    fontWeight: "600",
  },
  preview: {
    height: 36,
    borderRadius: Radius.sm,
    overflow: "hidden",
  },
  colorRow: { flexDirection: "row", gap: Spacing.sm },
  wellWrap: { flex: 1, gap: 4 },
  wellLabel: {
    fontSize: 10,
    fontFamily: Fonts.monoBold,
    letterSpacing: 0.5,
  },
  well: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  wellSwatch: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
  },
  wellHex: {
    fontSize: 10,
    fontFamily: Fonts.mono,
    letterSpacing: 0.5,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: Fonts.monoBold,
    letterSpacing: 1,
    marginTop: Spacing.sm,
  },
  angleRow: { flexDirection: "row", gap: Spacing.sm },
  angleBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    gap: 2,
  },
  angleIcon: { fontSize: 16, fontFamily: Fonts.monoBold },
  angleLabel: { fontSize: 9, fontFamily: Fonts.mono },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  sliderValue: {
    fontSize: 11,
    fontFamily: Fonts.monoBold,
    width: 36,
    textAlign: "right",
  },
  sliderTrack: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 16,
    paddingHorizontal: 4,
    borderRadius: Radius.full,
  },
  tick: { width: 2, borderRadius: 1 },
});
