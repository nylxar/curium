import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  clamp,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { useTheme } from "@/context/ThemeContext";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";

// ─── Color math ───────────────────────────────────────────────────────────────
function hsvToHex(h: number, s: number, v: number): string {
  "worklet";
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    const val = v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
    return Math.round(val * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(5)}${f(3)}${f(1)}`;
}

function hexToHsv(hex: string): [number, number, number] {
  const c = hex.replace("#", "");
  if (c.length !== 6) return [0, 0, 1];
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min;
  const v = max;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = h * 60;
    if (h < 0) h += 360;
  }
  return [h, s, v];
}

function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

// Perceived luminance — determines if text on color should be black or white
function perceivedLuminance(hex: string): number {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SV_SIZE = 256;
const THUMB_R = 12;
const BAR_H = 26;
const SWATCH_W = 44;

const HUE_STOPS = [
  "#ff0000",
  "#ff8000",
  "#ffff00",
  "#80ff00",
  "#00ff00",
  "#00ff80",
  "#00ffff",
  "#0080ff",
  "#0000ff",
  "#8000ff",
  "#ff00ff",
  "#ff0080",
  "#ff0000",
];

// Presets: 6 rows × 6 cols = 36. Chosen for diversity + all have legible text.
const PRESETS = [
  "#000000",
  "#1a1a2e",
  "#0f3460",
  "#16213e",
  "#2d132c",
  "#1b1b2f",
  "#e94560",
  "#c62a47",
  "#ff6b6b",
  "#ff8e53",
  "#ff6392",
  "#ff4757",
  "#ff9f43",
  "#ffd460",
  "#f9ca24",
  "#badc58",
  "#6ab04c",
  "#218c74",
  "#06d6a0",
  "#00b894",
  "#0abde3",
  "#48dbfb",
  "#3b82f6",
  "#2475b0",
  "#7209b7",
  "#8338ec",
  "#a855f7",
  "#c77dff",
  "#e040fb",
  "#ff6ce5",
  "#ffffff",
  "#f5f5f5",
  "#dfe6e9",
  "#b2bec3",
  "#636e72",
  "#2d3436",
];

// ─── 2D SatVal Square ─────────────────────────────────────────────────────────
interface SatValProps {
  hue: number;
  sat: number;
  val: number;
  onChangeSV: (s: number, v: number) => void;
}

function SatValPicker({ hue, sat, val, onChangeSV }: SatValProps) {
  const tx = useSharedValue(sat * SV_SIZE);
  const ty = useSharedValue((1 - val) * SV_SIZE);

  // Sync when preset is tapped — spring the thumb there
  useEffect(() => {
    tx.value = withSpring(sat * SV_SIZE, {
      damping: 22,
      stiffness: 300,
      mass: 0.5,
    });
    ty.value = withSpring((1 - val) * SV_SIZE, {
      damping: 22,
      stiffness: 300,
      mass: 0.5,
    });
  }, [sat, val]);

  const gesture = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      const nx = clamp(e.x, 0, SV_SIZE);
      const ny = clamp(e.y, 0, SV_SIZE);
      tx.value = nx;
      ty.value = ny;
      // scheduleOnRN — correct modern API (Reanimated v4 / react-native-worklets)
      scheduleOnRN(onChangeSV)(nx / SV_SIZE, 1 - ny / SV_SIZE);
    })
    .onUpdate((e) => {
      const nx = clamp(e.x, 0, SV_SIZE);
      const ny = clamp(e.y, 0, SV_SIZE);
      tx.value = nx;
      ty.value = ny;
      scheduleOnRN(onChangeSV)(nx / SV_SIZE, 1 - ny / SV_SIZE);
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value - THUMB_R },
      { translateY: ty.value - THUMB_R },
    ],
  }));

  const pureHue = hsvToHex(hue, 1, 1);

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.svBox}>
        <LinearGradient
          colors={["#ffffff", pureHue]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={["transparent", "#000000"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Animated.View style={[styles.svThumb, thumbStyle]} />
      </View>
    </GestureDetector>
  );
}

// ─── Hue Bar ──────────────────────────────────────────────────────────────────
interface HueProps {
  hue: number;
  barWidth: number;
  onChangeHue: (h: number) => void;
}

function HueBar({ hue, barWidth, onChangeHue }: HueProps) {
  const tx = useSharedValue((hue / 360) * barWidth);

  useEffect(() => {
    tx.value = withSpring((hue / 360) * barWidth, {
      damping: 22,
      stiffness: 300,
    });
  }, [hue, barWidth]);

  const gesture = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      tx.value = clamp(e.x, 0, barWidth);
      scheduleOnRN(onChangeHue)((clamp(e.x, 0, barWidth) / barWidth) * 360);
    })
    .onUpdate((e) => {
      tx.value = clamp(e.x, 0, barWidth);
      scheduleOnRN(onChangeHue)((tx.value / barWidth) * 360);
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value - (BAR_H + 4) / 2 }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={{ width: barWidth, height: BAR_H + 4, justifyContent: "center" }}
      >
        <LinearGradient
          colors={HUE_STOPS}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ height: BAR_H, borderRadius: BAR_H / 2 }}
        />
        <Animated.View
          style={[
            styles.hueThumb,
            {
              backgroundColor: hsvToHex(hue, 1, 1),
            },
            thumbStyle,
          ]}
        />
      </View>
    </GestureDetector>
  );
}

// ─── Main ColorPicker ─────────────────────────────────────────────────────────
interface Props {
  visible: boolean;
  initialColor: string;
  title: string;
  onConfirm: (hex: string) => void;
  onClose: () => void;
}

export function ColorPicker({
  visible,
  initialColor,
  title,
  onConfirm,
  onClose,
}: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [h, setH] = useState(0);
  const [s, setS] = useState(1);
  const [v, setV] = useState(1);
  const [hexInput, setHexInput] = useState("");
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const [nh, ns, nv] = hexToHsv(initialColor);
    setH(nh);
    setS(ns);
    setV(nv);
    setHexInput(initialColor.replace("#", "").toUpperCase());
  }, [visible, initialColor]);

  const hex = hsvToHex(h, s, v);

  useEffect(() => {
    setHexInput(hex.replace("#", "").toUpperCase());
  }, [h, s, v]);

  const handleHexChange = (raw: string) => {
    const cleaned = raw
      .replace(/[^0-9A-Fa-f]/g, "")
      .slice(0, 6)
      .toUpperCase();
    setHexInput(cleaned);
    if (cleaned.length === 6) {
      const full = `#${cleaned}`;
      if (isValidHex(full)) {
        const [nh, ns, nv] = hexToHsv(full);
        setH(nh);
        setS(ns);
        setV(nv);
      }
    }
  };

  // Stable references — safe to capture inside scheduleOnRN worklet closures
  const handleSV = (ns: number, nv: number) => {
    setS(ns);
    setV(nv);
  };
  const handleHue = (nh: number) => setH(nh);

  const applyTextColor = perceivedLuminance(hex) > 0.45 ? "#000000" : "#ffffff";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={StyleSheet.absoluteFillObject}>
        <Pressable
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: "#00000070" },
          ]}
          onPress={onClose}
        />
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
                paddingBottom: insets.bottom + Spacing.md,
              },
            ]}
          >
            {/* ── Handle ─────────────────────────────────── */}
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            {/* ── Title ──────────────────────────────────── */}
            <Text style={[styles.title, { color: colors.textMuted }]}>
              {title}
            </Text>

            {/* ── 2D picker ──────────────────────────────── */}
            <SatValPicker hue={h} sat={s} val={v} onChangeSV={handleSV} />

            {/* ── Hue bar + swatch row ───────────────────── */}
            <View
              style={styles.hueRow}
              onLayout={(e) => {
                setBarWidth(e.nativeEvent.layout.width - SWATCH_W - Spacing.md);
              }}
            >
              {/* Swatch — tapping it copies hex */}
              <View
                style={[
                  styles.swatch,
                  {
                    backgroundColor: hex,
                    borderColor: colors.border,
                  },
                ]}
              />
              {barWidth > 0 && (
                <HueBar hue={h} barWidth={barWidth} onChangeHue={handleHue} />
              )}
            </View>

            {/* ── Hex input ──────────────────────────────── */}
            <View
              style={[
                styles.hexRow,
                {
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.hexHash, { color: colors.textMuted }]}>
                #
              </Text>
              <TextInput
                style={[styles.hexInput, { color: colors.text }]}
                value={hexInput}
                onChangeText={handleHexChange}
                maxLength={6}
                autoCapitalize="characters"
                autoCorrect={false}
                spellCheck={false}
                placeholder="FFFFFF"
                placeholderTextColor={colors.textFaint}
                selectionColor={hex}
              />
              <View style={[styles.hexDot, { backgroundColor: hex }]} />
            </View>

            {/* ── Presets ────────────────────────────────── */}
            <View style={styles.presets}>
              {PRESETS.map((c) => {
                const active = hex.toLowerCase() === c.toLowerCase();
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => {
                      const [nh, ns, nv] = hexToHsv(c);
                      setH(nh);
                      setS(ns);
                      setV(nv);
                    }}
                    style={[
                      styles.preset,
                      {
                        backgroundColor: c,
                        borderColor: active ? colors.text : colors.border,
                        borderWidth: active ? 2.5 : 1,
                        transform: [{ scale: active ? 1.2 : 1 }],
                      },
                    ]}
                    activeOpacity={0.75}
                  />
                );
              })}
            </View>

            {/* ── Actions ────────────────────────────────── */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[
                  styles.btnCancel,
                  {
                    backgroundColor: colors.surfaceOffset,
                    borderColor: colors.border,
                  },
                ]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={[styles.btnText, { color: colors.textMuted }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnApply, { backgroundColor: hex }]}
                onPress={() => {
                  onConfirm(hex);
                  onClose();
                }}
                activeOpacity={0.85}
              >
                <Text style={[styles.btnText, { color: applyTextColor }]}>
                  Apply
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSize.sm,
    fontFamily: Fonts.mono,
    textAlign: "center",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  svBox: {
    width: SV_SIZE,
    height: SV_SIZE,
    borderRadius: Radius.lg,
    overflow: "hidden",
    alignSelf: "center",
  },
  svThumb: {
    position: "absolute",
    width: THUMB_R * 2,
    height: THUMB_R * 2,
    borderRadius: THUMB_R,
    borderWidth: 2.5,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 8,
  },
  hueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  swatch: {
    width: SWATCH_W,
    height: BAR_H + 4,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  hueThumb: {
    position: "absolute",
    top: -3,
    width: BAR_H + 6,
    height: BAR_H + 6,
    borderRadius: (BAR_H + 6) / 2,
    borderWidth: 3,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 8,
  },
  hexRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    height: 46,
    gap: Spacing.xs,
  },
  hexHash: { fontSize: FontSize.base, fontFamily: Fonts.mono },
  hexInput: {
    flex: 1,
    fontSize: FontSize.base,
    fontFamily: Fonts.mono,
    letterSpacing: 2,
  },
  hexDot: { width: 20, height: 20, borderRadius: 10 },
  presets: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  preset: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: "center",
  },
  btnApply: {
    flex: 1.6,
    paddingVertical: 14,
    borderRadius: Radius.full,
    alignItems: "center",
  },
  btnText: { fontSize: FontSize.sm, fontFamily: Fonts.monoBold },
});
