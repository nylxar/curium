import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  PanResponder,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";

// ─── Color math ──────────────────────────────────────────────────────────────
function hsvToHex(h: number, s: number, v: number): string {
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
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min;
  const vv = max;
  const ss = max === 0 ? 0 : d / max;
  let hh = 0;
  if (d !== 0) {
    if (max === r) hh = ((g - b) / d) % 6;
    else if (max === g) hh = (b - r) / d + 2;
    else hh = (r - g) / d + 4;
    hh = Math.round(hh * 60);
    if (hh < 0) hh += 360;
  }
  return [hh, ss, vv];
}

// ─── Slider (pure RN Animated + PanResponder — no deprecated APIs) ────────────
interface SliderProps {
  value: number;
  onValueChange: (v: number) => void;
  stops: string[];
  width?: number;
}

function Slider({ value, onValueChange, stops, width = 280 }: SliderProps) {
  const THUMB = 24;
  const TRACK = width - THUMB;
  // anim tracks pixel position
  const anim = useRef(new Animated.Value(value * TRACK)).current;
  const posRef = useRef(value * TRACK);
  const valRef = useRef(value);

  // Sync when parent changes value (preset selected)
  useEffect(() => {
    const px = value * TRACK;
    posRef.current = px;
    valRef.current = value;
    Animated.spring(anim, {
      toValue: px,
      useNativeDriver: false,
      speed: 40,
      bounciness: 0,
    }).start();
  }, [value]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        anim.stopAnimation();
      },
      onPanResponderMove: (_, g) => {
        const next = Math.max(0, Math.min(TRACK, posRef.current + g.dx));
        anim.setValue(next);
        const pct = next / TRACK;
        valRef.current = pct;
        onValueChange(pct);
      },
      onPanResponderRelease: (_, g) => {
        posRef.current = Math.max(0, Math.min(TRACK, posRef.current + g.dx));
      },
    }),
  ).current;

  const thumbLeft = anim;

  return (
    <View
      style={{ width, height: THUMB + 8, justifyContent: "center" }}
      {...pan.panHandlers}
    >
      {/* Track segments */}
      <View
        style={{
          height: 12,
          marginHorizontal: THUMB / 2,
          borderRadius: 6,
          flexDirection: "row",
          overflow: "hidden",
        }}
      >
        {stops.slice(0, -1).map((c, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: c }} />
        ))}
      </View>
      {/* Thumb */}
      <Animated.View
        style={{
          position: "absolute",
          left: thumbLeft,
          width: THUMB,
          height: THUMB,
          borderRadius: THUMB / 2,
          backgroundColor: "#fff",
          borderWidth: 2,
          borderColor: "#ccc",
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 1 },
          elevation: 4,
        }}
      />
    </View>
  );
}

// ─── ColorPicker modal ────────────────────────────────────────────────────────
interface ColorPickerProps {
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
}: ColorPickerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [h, setH] = useState(0);
  const [s, setS] = useState(1);
  const [v, setV] = useState(1);

  useEffect(() => {
    if (visible) {
      const [nh, ns, nv] = hexToHsv(initialColor);
      setH(nh);
      setS(ns);
      setV(nv);
    }
  }, [visible, initialColor]);

  const hex = hsvToHex(h, s, v);

  const HUE_STOPS = Array.from({ length: 7 }, (_, i) => hsvToHex(i * 60, 1, 1));
  const SAT_STOPS = ["#ffffff", hsvToHex(h, 1, 1)];
  const VAL_STOPS = ["#000000", hsvToHex(h, s === 0 ? 1 : s, 1)];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.surface,
            paddingBottom: insets.bottom + Spacing.lg,
          },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        <Text
          style={[
            styles.title,
            { color: colors.text, fontFamily: Fonts.monoBold },
          ]}
        >
          {title}
        </Text>

        {/* Preview + hex */}
        <View style={styles.previewRow}>
          <View
            style={[
              styles.previewSwatch,
              { backgroundColor: hex, borderColor: colors.border },
            ]}
          />
          <View
            style={[
              styles.hexBox,
              {
                backgroundColor: colors.surfaceOffset,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.hexText,
                { color: colors.text, fontFamily: Fonts.mono },
              ]}
            >
              {hex.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.sliders}>
          <Text
            style={[
              styles.sliderLabel,
              { color: colors.textMuted, fontFamily: Fonts.mono },
            ]}
          >
            Hue
          </Text>
          <Slider
            value={h / 360}
            onValueChange={(val: number) => setH(Math.round(val * 360))}
            stops={HUE_STOPS}
          />
          <Text
            style={[
              styles.sliderLabel,
              { color: colors.textMuted, fontFamily: Fonts.mono },
            ]}
          >
            Saturation
          </Text>
          <Slider
            value={s}
            onValueChange={(val: number) => setS(val)}
            stops={SAT_STOPS}
          />
          <Text
            style={[
              styles.sliderLabel,
              { color: colors.textMuted, fontFamily: Fonts.mono },
            ]}
          >
            Brightness
          </Text>
          <Slider
            value={v}
            onValueChange={(val: number) => setV(val)}
            stops={VAL_STOPS}
          />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.btn,
              {
                backgroundColor: colors.surfaceOffset,
                borderColor: colors.border,
              },
            ]}
            onPress={onClose}
          >
            <Text
              style={[
                styles.btnText,
                { color: colors.textMuted, fontFamily: Fonts.mono },
              ]}
            >
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: hex, flex: 1.5 }]}
            onPress={() => {
              onConfirm(hex);
              onClose();
            }}
          >
            <Text
              style={[
                styles.btnText,
                { color: "#fff", fontFamily: Fonts.monoBold },
              ]}
            >
              Apply
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "#00000066" },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center" },
  title: { fontSize: FontSize.md, textAlign: "center" },
  previewRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  previewSwatch: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  hexBox: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  hexText: { fontSize: FontSize.base, letterSpacing: 2 },
  sliders: { gap: Spacing.sm },
  sliderLabel: { fontSize: FontSize.xs, marginTop: Spacing.xs },
  actions: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.sm },
  btn: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: "center",
  },
  btnText: { fontSize: FontSize.sm },
});
