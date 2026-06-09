import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from "react";
import { StyleSheet, useColorScheme } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkColors, LightColors, AppTheme } from "@/constants/theme";
import { defaultQRStyle, QRStyle } from "@/types/qr";

interface ThemeCtx {
  theme: AppTheme;
  colors: typeof DarkColors;
  isDark: boolean;
  setTheme: (t: AppTheme) => void;
  qrFg: string;
  qrBg: string;
  setQRColors: (fg: string, bg: string) => void;
  /** The QR style that matches the current theme (light → paper default,
   *  dark → paper-dark default).  Use this as the initial value of any
   *  `useState<QRStyle>(...)` that should respect the user's theme. */
  defaultQRStyleForTheme: QRStyle;
}

const ThemeContext = createContext<ThemeCtx>({
  theme: "system",
  colors: LightColors,
  isDark: false,
  setTheme: () => {},
  qrFg: "#1c1917",
  qrBg: "#fafaf9",
  setQRColors: () => {},
  defaultQRStyleForTheme: defaultQRStyle(false),
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  // Default to "system" so the app follows device dark/light mode without
  // waiting for AsyncStorage.  Users can pin to light, dark, or dynamic
  // from Settings.
  const [theme, setThemeState] = useState<AppTheme>("system");
  const [qrFg, setQrFg] = useState("#1c1917");
  const [qrBg, setQrBg] = useState("#fafaf9");

  useEffect(() => {
    AsyncStorage.multiGet([
      "curium_theme",
      "curium_qr_fg",
      "curium_qr_bg",
    ]).then((pairs) => {
      const t = pairs[0][1];
      const fg = pairs[1][1];
      const bg = pairs[2][1];
      if (t) setThemeState(t as AppTheme);
      if (fg) setQrFg(fg);
      if (bg) setQrBg(bg);
    });
  }, []);

  const setTheme = useCallback((t: AppTheme) => {
    setThemeState(t);
    AsyncStorage.setItem("curium_theme", t);
  }, []);

  const setQRColors = useCallback((fg: string, bg: string) => {
    setQrFg(fg);
    setQrBg(bg);
    AsyncStorage.multiSet([
      ["curium_qr_fg", fg],
      ["curium_qr_bg", bg],
    ]);
  }, []);

  const colors = useMemo(() => {
    if (theme === "dynamic") {
      // Build entire palette from QR colors
      // qrBg = background, qrFg = text/accent
      const isQrDark = isColorDark(qrBg);
      const base = isQrDark ? DarkColors : LightColors;
      return {
        ...base,
        bg: qrBg,
        surface: blendHex(qrBg, isQrDark ? "#ffffff" : "#000000", 0.05),
        surfaceOffset: blendHex(qrBg, isQrDark ? "#ffffff" : "#000000", 0.1),
        border: blendHex(qrBg, isQrDark ? "#ffffff" : "#000000", 0.15),
        text: qrFg,
        textMuted: blendHex(qrFg, qrBg, 0.45),
        textFaint: blendHex(qrFg, qrBg, 0.7),
        primary: qrFg,
        primaryBg: qrFg + "22",
      };
    }
    const isDark =
      theme === "dark" || (theme === "system" && system === "dark");
    return isDark ? DarkColors : LightColors;
  }, [theme, system, qrFg, qrBg]);

  const isDark =
    theme === "dynamic"
      ? isColorDark(qrBg)
      : theme === "dark" || (theme === "system" && system === "dark");

  const defaultQRStyleForTheme = useMemo(
    () => defaultQRStyle(isDark),
    [isDark],
  );

  const value = useMemo<ThemeCtx>(
    () => ({
      theme,
      colors,
      isDark,
      setTheme,
      qrFg,
      qrBg,
      setQRColors,
      defaultQRStyleForTheme,
    }),
    [theme, colors, isDark, setTheme, qrFg, qrBg, setQRColors, defaultQRStyleForTheme],
  );

  // ─── Smooth theme transition ──────────────────────────────────────────────
  // When the theme *setting* changes (light/dark/system/dynamic via Settings),
  // briefly show an overlay at the new background color and fade it out so the
  // switch feels like a cross-fade rather than a snap.  We track `theme`
  // instead of `colors.bg` so the animation does NOT fire on every QR-palette
  // shuffle in dynamic mode.
  const overlayOpacity = useSharedValue(0);
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));
  const prevThemeRef = useRef(theme);

  useEffect(() => {
    if (prevThemeRef.current !== theme) {
      prevThemeRef.current = theme;
      overlayOpacity.value = 0;
      overlayOpacity.value = withTiming(1, {
        duration: 160,
        easing: Easing.out(Easing.cubic),
      }, () => {
        overlayOpacity.value = withTiming(0, {
          duration: 200,
          easing: Easing.in(Easing.cubic),
        });
      });
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }, overlayStyle]}
      />
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isColorDark(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Perceived luminance
  return 0.299 * r + 0.587 * g + 0.114 * b < 128;
}

function blendHex(hex1: string, hex2: string, t: number): string {
  const r1 = parseInt(hex1.slice(1, 3), 16),
    g1 = parseInt(hex1.slice(3, 5), 16),
    b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16),
    g2 = parseInt(hex2.slice(3, 5), 16),
    b2 = parseInt(hex2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
