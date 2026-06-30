export const Fonts = {
  mono: "IBMPlexMono-Regular",
  monoLight: "IBMPlexMono-Light",
  monoText: "IBMPlexMono-Text",
  monoBold: "IBMPlexMono-Bold",
  monoSemiBold: "IBMPlexMono-SemiBold",
  monoMedium: "IBMPlexMono-Medium",
  monoItalic: "IBMPlexMono-Italic",
};

export type AppTheme = "dark" | "light" | "system" | "dynamic";

export const DarkColors = {
  bg: "#0d0d0f",
  surface: "#161618",
  surfaceOffset: "#1e1e21",
  border: "#2a2a2e",
  text: "#f5f0e8",
  textMuted: "#a8a39a",
  textFaint: "#5a5650",
  primary: "#f5f0e8",
  primaryBg: "#f5f0e822",
  success: "#7ad88a",
  error: "#ff6b6b",
  warning: "#f5c46a",
};

export const AmoledColors: typeof DarkColors = {
  ...DarkColors,
  bg: "#000000",
  surface: "#0a0a0a",
  surfaceOffset: "#141414",
  border: "#1e1e1e",
};

export const LightColors = {
  bg: "#f5f0e8",
  surface: "#fbf8f3",
  surfaceOffset: "#ebe6dd",
  border: "#d6cfc1",
  text: "#1a1a1f",
  textMuted: "#5a5650",
  textFaint: "#a8a39a",
  primary: "#1a1a1f",
  primaryBg: "#1a1a1f18",
  success: "#2f8a3f",
  error: "#c43d3d",
  warning: "#b07a16",
};

export const Colors = DarkColors;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
};

export const QR_COLORS = [
  { id: "paper", fg: "#1c1917", bg: "#fafaf9", label: "Paper" },
  { id: "arctic", fg: "#041520", bg: "#bae6fd", label: "Arctic" },
  { id: "sky", fg: "#040e1a", bg: "#7dd3fc", label: "Sky" },
  { id: "mint", fg: "#022010", bg: "#a7f3d0", label: "Mint" },
  { id: "emerald", fg: "#022010", bg: "#6ee7b7", label: "Emerald" },
  { id: "lime", fg: "#0a1f00", bg: "#bef264", label: "Lime" },
  { id: "amber", fg: "#2d1800", bg: "#fde68a", label: "Amber" },
  { id: "gold", fg: "#1f0e00", bg: "#fcd34d", label: "Gold" },
  { id: "peach", fg: "#3d0e00", bg: "#fed7aa", label: "Peach" },
  { id: "coral", fg: "#2d0e00", bg: "#fdba74", label: "Coral" },
  { id: "sunset", fg: "#2d0e00", bg: "#fdba74", label: "Sunset" },
  { id: "lava", fg: "#2d0000", bg: "#fca5a5", label: "Lava" },
  { id: "cherry", fg: "#1a0008", bg: "#fda4af", label: "Cherry" },
  { id: "rose", fg: "#3d0020", bg: "#fecdd3", label: "Rose" },
  { id: "pink", fg: "#2d0020", bg: "#f9a8d4", label: "Pink" },
  { id: "fuchsia", fg: "#2d0040", bg: "#e879f9", label: "Fuchsia" },
  { id: "lavender", fg: "#1e0a40", bg: "#ddd6fe", label: "Lavender" },
  { id: "violet", fg: "#1a0540", bg: "#c4b5fd", label: "Violet" },
  { id: "indigo", fg: "#0a0a2e", bg: "#a5b4fc", label: "Indigo" },
  { id: "ocean", fg: "#020b1a", bg: "#93c5fd", label: "Ocean" },
  { id: "steel", fg: "#0c1a2e", bg: "#bae6fd", label: "Steel" },
  { id: "teal", fg: "#041a18", bg: "#00d4b8", label: "Teal" },
  { id: "sage", fg: "#0a1f0a", bg: "#bbf7d0", label: "Sage" },
  { id: "forest", fg: "#052010", bg: "#86efac", label: "Forest" },
  { id: "slate", fg: "#0f172a", bg: "#e2e8f0", label: "Slate" },
  { id: "cosmic", fg: "#eeeef5", bg: "#080810", label: "Cosmic" },
  { id: "midnight", fg: "#e0e7ff", bg: "#1e1b4b", label: "Midnight" },
  { id: "dusk", fg: "#e2e8f0", bg: "#334155", label: "Dusk" },
] as const;

// CSS variable mappings for web/desktop
export const CSS_VARIABLES = {
  dark: {
    "--bg": DarkColors.bg,
    "--surface": DarkColors.surface,
    "--surface-offset": DarkColors.surfaceOffset,
    "--border": DarkColors.border,
    "--text": DarkColors.text,
    "--text-muted": DarkColors.textMuted,
    "--text-faint": DarkColors.textFaint,
    "--primary": DarkColors.primary,
    "--primary-bg": DarkColors.primaryBg,
    "--success": DarkColors.success,
    "--error": DarkColors.error,
    "--warning": DarkColors.warning,
  },
  light: {
    "--bg": LightColors.bg,
    "--surface": LightColors.surface,
    "--surface-offset": LightColors.surfaceOffset,
    "--border": LightColors.border,
    "--text": LightColors.text,
    "--text-muted": LightColors.textMuted,
    "--text-faint": LightColors.textFaint,
    "--primary": LightColors.primary,
    "--primary-bg": LightColors.primaryBg,
    "--success": LightColors.success,
    "--error": LightColors.error,
    "--warning": LightColors.warning,
  },
} as const;
