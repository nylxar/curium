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
import { Appearance, StyleSheet, useColorScheme } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkColors, LightColors, AmoledColors, AppTheme } from "@/constants/theme";
import { defaultQRStyle, QRStyle } from "@/types/qr";

interface ThemeCtx {
  theme: AppTheme;
  colors: typeof DarkColors;
  isDark: boolean;
  setTheme: (t: AppTheme) => void;
  qrFg: string;
  qrBg: string;
  setQRColors: (fg: string, bg: string) => void;
  defaultQRStyleForTheme: QRStyle;
  pureDark: boolean;
  setPureDark: (v: boolean) => void;
  ready: boolean;
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
  pureDark: false,
  setPureDark: () => {},
  ready: false,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [initialSystem] = useState(() => Appearance.getColorScheme());
  const resolvedSystem = system ?? initialSystem;

  // Ensure live updates when the device theme changes while the app is
  // running.  useColorScheme() updates on some platforms but not all —
  // Appearance.addChangeListener covers the gaps.
  const [liveSystem, setLiveSystem] = useState(resolvedSystem);
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme) setLiveSystem(colorScheme);
    });
    return () => sub.remove();
  }, []);
  const effectiveSystem = liveSystem;

  const [theme, setThemeState] = useState<AppTheme>("system");
  const [qrFg, setQrFg] = useState("#1c1917");
  const [qrBg, setQrBg] = useState("#fafaf9");
  const [pureDark, setPureDarkState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet([
      "curium_theme",
      "curium_qr_fg",
      "curium_qr_bg",
      "curium_pure_dark",
    ]).then((pairs) => {
      const t = pairs[0][1];
      const fg = pairs[1][1];
      const bg = pairs[2][1];
      const pd = pairs[3][1];
      if (t) setThemeState(t as AppTheme);
      if (fg) setQrFg(fg);
      if (bg) setQrBg(bg);
      if (pd === "true") setPureDarkState(true);
      setReady(true);
    });
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
    const resolvedDark =
      theme === "dark" ||
      (theme === "system" && effectiveSystem === "dark");
    if (resolvedDark && pureDark) return AmoledColors;
    return resolvedDark ? DarkColors : LightColors;
  }, [theme, effectiveSystem, qrFg, qrBg, pureDark]);

  const isDark =
    theme === "dynamic"
      ? isColorDark(qrBg)
      : theme === "dark" ||
        (theme === "system" && effectiveSystem === "dark");

  const defaultQRStyleForTheme = useMemo(
    () => defaultQRStyle(isDark),
    [isDark],
  );

  // ─── Smooth theme transition ──────────────────────────────────────────────
  // When the user switches between light/dark/system/dynamic, capture the
  // OLD background color and fade an overlay from it to transparent.
  //
  // QR color changes in dynamic mode must NOT trigger this overlay —
  // only actual theme switches should.
  //
  // The animation must NOT fire on the initial AsyncStorage restore
  // (default "system" → stored "dark").  To guarantee this, we only
  // animate after the user has explicitly called `setTheme` at least once.
  const overlayOpacity = useSharedValue(0);
  const overlayBg = useSharedValue(LightColors.bg);
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    backgroundColor: overlayBg.value,
  }));
  const prevBgRef = useRef(colors.bg);
  const hasUserInteractedRef = useRef(false);
  const prevThemeRef = useRef(theme);
  const prevEffectiveSystemRef = useRef(effectiveSystem);

  const setTheme = useCallback((t: AppTheme) => {
    hasUserInteractedRef.current = true;
    setThemeState(t);
    AsyncStorage.setItem("curium_theme", t);
  }, []);

  const setPureDark = useCallback((v: boolean) => {
    hasUserInteractedRef.current = true;
    setPureDarkState(v);
    AsyncStorage.setItem("curium_pure_dark", v ? "true" : "false");
  }, []);

  useEffect(() => {
    const themeChanged = prevThemeRef.current !== theme;
    const systemChanged = prevEffectiveSystemRef.current !== effectiveSystem;
    prevThemeRef.current = theme;
    prevEffectiveSystemRef.current = effectiveSystem;

    if (!hasUserInteractedRef.current) {
      prevBgRef.current = colors.bg;
      return;
    }

    if ((themeChanged || systemChanged) && prevBgRef.current !== colors.bg) {
      overlayBg.value = prevBgRef.current;
      overlayOpacity.value = 1;
      overlayOpacity.value = withTiming(0, {
        duration: 260,
        easing: Easing.out(Easing.cubic),
      });
    }
    prevBgRef.current = colors.bg;
  }, [colors.bg, theme, effectiveSystem]);

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
      pureDark,
      setPureDark,
      ready,
    }),
    [
      theme,
      colors,
      isDark,
      setTheme,
      qrFg,
      qrBg,
      setQRColors,
      defaultQRStyleForTheme,
      pureDark,
      setPureDark,
      ready,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, overlayStyle]}
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
