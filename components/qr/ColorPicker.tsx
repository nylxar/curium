import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  TextInput,
  Dimensions,
} from "react-native";
import Svg, {
  Defs,
  LinearGradient as SvgGrad,
  Stop,
  Rect,
} from "react-native-svg";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
  clamp,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { useOverlay } from "@/components/ui/Overlay";

// ─── Color math (worklet-safe) ────────────────────────────────────────────────
function hsvToHex(h: number, s: number, v: number): string {
  "worklet";
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    const c = v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(5)}${f(3)}${f(1)}`;
}

function hexToHsv(hex: string): [number, number, number] {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return [0, 0, 1];
  const r = parseInt(raw.slice(0, 2), 16) / 255;
  const g = parseInt(raw.slice(2, 4), 16) / 255;
  const b = parseInt(raw.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min;
  const v = max,
    s = max === 0 ? 0 : d / max;
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

function luminance(hex: string): number {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SW = Dimensions.get("window").width;
const PAD = Spacing.lg * 2 + 4;
const SV_SIZE = SW - PAD;
const THUMB = 13;
const BAR_H = 24;
const BAR_W = SW - PAD - 50 - Spacing.md;

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

const HUE_STOPS = [
  { offset: "0", color: "#ff0000" },
  { offset: "0.17", color: "#ffff00" },
  { offset: "0.33", color: "#00ff00" },
  { offset: "0.5", color: "#00ffff" },
  { offset: "0.67", color: "#0000ff" },
  { offset: "0.83", color: "#ff00ff" },
  { offset: "1", color: "#ff0000" },
];

// ─── SVG gradients — pure JS, zero native modules ────────────────────────────
function SvgSVSquare({ hue, size }: { hue: number; size: number }) {
  const pureHue = hsvToHex(hue, 1, 1);
  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <SvgGrad id="s" x1="0" y1="0.5" x2="1" y2="0.5">
          <Stop offset="0" stopColor="#fff" stopOpacity="1" />
          <Stop offset="1" stopColor={pureHue} stopOpacity="1" />
        </SvgGrad>
        <SvgGrad id="v" x1="0.5" y1="0" x2="0.5" y2="1">
          <Stop offset="0" stopColor="#000" stopOpacity="0" />
          <Stop offset="1" stopColor="#000" stopOpacity="1" />
        </SvgGrad>
      </Defs>
      <Rect width={size} height={size} fill="url(#s)" />
      <Rect width={size} height={size} fill="url(#v)" />
    </Svg>
  );
}

function SvgHueBar({ w, h }: { w: number; h: number }) {
  return (
    <Svg width={w} height={h} pointerEvents="none">
      <Defs>
        <SvgGrad id="hue" x1="0" y1="0.5" x2="1" y2="0.5">
          {HUE_STOPS.map((s) => (
            <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </SvgGrad>
      </Defs>
      <Rect width={w} height={h} fill="url(#hue)" rx={h / 2} ry={h / 2} />
    </Svg>
  );
}

// ─── SatVal picker ───────────────────────────────────────────────────────────
function SatValPicker({
  hue,
  initSat,
  initVal,
  onSVChange,
}: {
  hue: number;
  initSat: number;
  initVal: number;
  onSVChange: (s: number, v: number) => void;
}) {
  const tx = useSharedValue(initSat * SV_SIZE);
  const ty = useSharedValue((1 - initVal) * SV_SIZE);

  const gesture = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      "worklet";
      tx.value = clamp(e.x, 0, SV_SIZE);
      ty.value = clamp(e.y, 0, SV_SIZE);
      runOnJS(onSVChange)(tx.value / SV_SIZE, 1 - ty.value / SV_SIZE);
    })
    .onUpdate((e) => {
      "worklet";
      tx.value = clamp(e.x, 0, SV_SIZE);
      ty.value = clamp(e.y, 0, SV_SIZE);
      runOnJS(onSVChange)(tx.value / SV_SIZE, 1 - ty.value / SV_SIZE);
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value - THUMB },
      { translateY: ty.value - THUMB },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={{
          width: SV_SIZE,
          height: SV_SIZE,
          borderRadius: Radius.lg,
          overflow: "hidden",
          alignSelf: "center",
        }}
      >
        <SvgSVSquare hue={hue} size={SV_SIZE} />
        <Animated.View style={[s.svThumb, thumbStyle]} pointerEvents="none" />
      </View>
    </GestureDetector>
  );
}

// ─── Hue bar ────────────────────────────────────────────────────────────────
function HuePicker({
  hue,
  onHueChange,
}: {
  hue: number;
  onHueChange: (h: number) => void;
}) {
  const [innerW, setInnerW] = useState(BAR_W - (BAR_H + 6));
  const trackW = useSharedValue(innerW);
  const tx = useSharedValue((hue / 360) * innerW);

  const gesture = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      "worklet";
      const max = trackW.value;
      tx.value = clamp(e.x, 0, max);
      runOnJS(onHueChange)((tx.value / max) * 360);
    })
    .onUpdate((e) => {
      "worklet";
      const max = trackW.value;
      tx.value = clamp(e.x, 0, max);
      runOnJS(onHueChange)((tx.value / max) * 360);
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
  }));

  const dotColor = hsvToHex(hue, 1, 1);
  const thumbSize = BAR_H + 6;

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={{
          width: BAR_W,
          height: thumbSize,
          justifyContent: "center",
          paddingHorizontal: thumbSize / 2,
        }}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width - thumbSize;
          trackW.value = w;
          setInnerW(w);
        }}
      >
        <SvgHueBar w={innerW} h={BAR_H} />
        <Animated.View
          style={[s.hueThumb, { backgroundColor: dotColor }, thumbStyle]}
          pointerEvents="none"
        />
      </View>
    </GestureDetector>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export interface ColorPickerProps {
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
  const overlay = useOverlay();
  const overlayIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (visible) {
      // Dismiss any lingering overlay first
      if (overlayIdRef.current !== null) {
        overlay.dismiss(overlayIdRef.current);
        overlayIdRef.current = null;
      }
      const id = overlay.show(
        <ColorPickerContent
          initialColor={initialColor}
          title={title}
          onConfirm={(hex) => {
            onConfirm(hex);
            overlay.dismiss(id);
            overlayIdRef.current = null;
          }}
          onClose={() => {
            overlay.dismiss(id);
            overlayIdRef.current = null;
            onClose();
          }}
        />,
      );
      overlayIdRef.current = id;
      return () => {
        if (overlayIdRef.current !== null) {
          overlay.dismiss(overlayIdRef.current);
          overlayIdRef.current = null;
        }
      };
    }
  }, [visible]);

  return null;
}

interface ColorPickerContentProps {
  initialColor: string;
  title: string;
  onConfirm: (hex: string) => void;
  onClose: () => void;
}

function ColorPickerContent({
  initialColor,
  title,
  onConfirm,
  onClose,
}: ColorPickerContentProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [hue, setHue] = useState(0);
  const [sat, setSat] = useState(1);
  const [val, setVal] = useState(1);
  const [hexInput, setHexInput] = useState("");
  const [pickerKey, setPickerKey] = useState(0);
  const wasVisible = useRef(false);

  const sheetY = useSharedValue(1200);
  const bgOp = useSharedValue(0);

  useLayoutEffect(() => {
    const [h, sv, v] = hexToHsv(initialColor);
    setHue(h);
    setSat(sv);
    setVal(v);
    setHexInput(initialColor.replace("#", "").toUpperCase());
    setPickerKey((k) => k + 1);
    wasVisible.current = true;
    sheetY.value = withTiming(0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
    bgOp.value = withTiming(0.5, { duration: 120 });
  }, []);

  const hex = hsvToHex(hue, sat, val);

  const handleHexChange = (raw: string) => {
    const clean = raw
      .replace(/[^0-9A-Fa-f]/g, "")
      .slice(0, 6)
      .toUpperCase();
    setHexInput(clean);
    if (clean.length === 6) {
      const [h, sv, v] = hexToHsv(`#${clean}`);
      setHue(h);
      setSat(sv);
      setVal(v);
      setPickerKey((k) => k + 1);
    }
  };

  const handlePreset = (c: string) => {
    onConfirm(c);
  };

  const handleSV = useCallback((sv: number, v: number) => {
    setSat(sv);
    setVal(v);
  }, []);
  const handleHue = useCallback((h: number) => setHue(h), []);

  const dismiss = () => {
    sheetY.value = withTiming(1200, {
      duration: 180,
      easing: Easing.in(Easing.cubic),
    });
    bgOp.value = withTiming(0, { duration: 140 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  };

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
  }));
  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOp.value,
  }));

  const applyTextColor = luminance(hex) > 0.45 ? "#000" : "#fff";

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <GestureHandlerRootView style={{ flex: 1 }} pointerEvents="box-none">
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: "#000" }, bgStyle]}
          pointerEvents="auto"
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
        </Animated.View>

        <Animated.View
          style={[
            s.sheet,
            { paddingBottom: insets.bottom + Spacing.md },
            sheetStyle,
          ]}
        >
          <View style={s.handle} />
          <Text style={s.title}>{title}</Text>

          <SatValPicker
            key={`sv-${pickerKey}`}
            hue={hue}
            initSat={sat}
            initVal={val}
            onSVChange={handleSV}
          />

          <View style={s.hueRow}>
            <View style={[s.swatch, { backgroundColor: hex }]} />
            <HuePicker key={`hue-${pickerKey}`} hue={hue} onHueChange={handleHue} />
          </View>

          <View style={s.hexRow}>
            <Text style={s.hexHash}>#</Text>
            <TextInput
              style={s.hexInput}
              value={hexInput}
              onChangeText={handleHexChange}
              maxLength={6}
              keyboardType="default"
              autoCapitalize="characters"
              autoCorrect={false}
              spellCheck={false}
              textContentType="none"
              placeholder="FFFFFF"
              placeholderTextColor={colors.textMuted}
              selectionColor={hex}
            />
            <View style={[s.hexDot, { backgroundColor: hex }]} />
          </View>

          <View style={s.presets}>
            {PRESETS.map((c) => {
              const active = hex.toLowerCase() === c.toLowerCase();
              return (
                <TouchableOpacity
                  key={c}
                  onPress={() => handlePreset(c)}
                  style={[
                    s.preset,
                    {
                      backgroundColor: c,
                      borderWidth: active ? 2.5 : 1,
                      borderColor: active ? "#fff" : "rgba(255,255,255,0.12)",
                      transform: [{ scale: active ? 1.14 : 1 }],
                    },
                  ]}
                  activeOpacity={0.75}
                />
              );
            })}
          </View>

          <View style={s.actions}>
            <TouchableOpacity
              style={s.btnCancel}
              onPress={dismiss}
              activeOpacity={0.7}
            >
              <Text style={s.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btnApply, { backgroundColor: hex }]}
              onPress={() => {
                onConfirm(hex);
              }}
              activeOpacity={0.85}
            >
              <Text style={[s.applyTxt, { color: applyTextColor }]}>Apply</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </View>
  );
}

// ─── Styles — using app Colors token ─────────────────────────────────────────
const s = StyleSheet.create({
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#f8f6f3",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e8e4df",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d4cfc8",
    alignSelf: "center",
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSize.xs,
    fontFamily: Fonts.monoMedium,
    color: "#8a857c",
    textAlign: "center",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  svThumb: {
    position: "absolute",
    width: THUMB * 2,
    height: THUMB * 2,
    borderRadius: THUMB,
    borderWidth: 2.5,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  hueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  swatch: {
    width: 50,
    height: BAR_H + 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "#e0dbd4",
  },
  hueThumb: {
    position: "absolute",
    top: 0,
    left: 0,
    width: BAR_H + 6,
    height: BAR_H + 6,
    borderRadius: (BAR_H + 6) / 2,
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  hexRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "#e0dbd4",
    paddingHorizontal: Spacing.md,
    height: 44,
    gap: 4,
  },
  hexHash: { fontSize: FontSize.base, fontFamily: Fonts.mono, color: "#8a857c" },
  hexInput: {
    flex: 1,
    fontSize: FontSize.base,
    fontFamily: Fonts.monoBold,
    color: "#1a1a1a",
    letterSpacing: 3,
    padding: 0,
  },
  hexDot: { width: 18, height: 18, borderRadius: 9 },
  presets: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingVertical: 4,
  },
  preset: { width: 34, height: 34, borderRadius: 17 },
  actions: { flexDirection: "row", gap: Spacing.sm, paddingTop: Spacing.xs },
  btnCancel: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: "#e0dbd4",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  cancelTxt: {
    fontSize: FontSize.sm,
    fontFamily: Fonts.monoMedium,
    color: "#8a857c",
    fontWeight: "500",
  },
  btnApply: {
    flex: 1.6,
    paddingVertical: 13,
    borderRadius: Radius.full,
    alignItems: "center",
  },
  applyTxt: { fontSize: FontSize.sm, fontFamily: Fonts.monoBold, fontWeight: "700" },
});
