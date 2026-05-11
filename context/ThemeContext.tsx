// context/ThemeContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkColors, LightColors, AppTheme } from "@/constants/theme";

interface ThemeCtx {
  theme: AppTheme;
  colors: typeof DarkColors;
  isDark: boolean;
  setTheme: (t: AppTheme) => void;
  accentFg: string;
  accentBg: string;
  setAccent: (fg: string, bg: string) => void;
}

const ThemeContext = createContext<ThemeCtx>({
  theme: "dark",
  colors: DarkColors,
  isDark: true,
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [theme, setThemeState] = useState<AppTheme>("dark");
  const [accentFg, setAccentFg] = useState("#0f172a");
  const [accentBg, setAccentBg] = useState("#e2e8f0");
  const setAccent = useCallback((fg: string, bg: string) => {
    setAccentFg(fg);
    setAccentBg(bg);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem("curium_theme").then((v) => {
      if (v) setThemeState(v as AppTheme);
    });
  }, []);

  const setTheme = (t: AppTheme) => {
    setThemeState(t);
    AsyncStorage.setItem("curium_theme", t);
  };

  const isDark = theme === "dark" || (theme === "system" && system === "dark");
  const colors = useMemo(
    () => ({
      ...(isDark ? DarkColors : LightColors),
      primary: accentFg,
      primaryBg: accentBg + "22",
    }),
    [isDark, accentFg, accentBg],
  );

  return (
    <ThemeContext.Provider
      value={{ theme, colors, isDark, setTheme, accentFg, accentBg, setAccent }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
