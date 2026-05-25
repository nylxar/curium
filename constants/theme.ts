// constants/theme.ts — FULL REPLACEMENT

export const Fonts = {
  system: undefined,
  mono: "IBMPlexMono-Regular",
  monoLight: "IBMPlexMono-Light",
  monoText: "IBMPlexMono-Text",
  monoBold: "IBMPlexMono-Bold",
  monoSemiBold: "IBMPlexMono-SemiBold",
  monoMedium: "IBMPlexMono-Medium",
  monoItalic: "IBMPlexMono-Italic",
};

// ─── Slate palette ────────────────────────────────────────────────────────────
const Slate = {
  950: "#020617",
  900: "#0f172a",
  800: "#1e293b",
  700: "#334155",
  600: "#475569",
  500: "#64748b",
  400: "#94a3b8",
  300: "#cbd5e1",
  200: "#e2e8f0",
  100: "#f1f5f9",
  50: "#f8fafc",
};

export type AppTheme = "dark" | "light" | "system" | "dynamic";

export const DarkColors = {
  bg: "#000000",
  surface: "#1c1c1e",
  surfaceOffset: "#2c2c2e",
  border: "#38383a",
  text: "#f5f5f7",
  textMuted: "#aeaeb2",
  textFaint: "#636366",
  primary: "#0a84ff",
  primaryBg: "#0a84ff22",
  success: "#30d158",
  error: "#ff453a",
  warning: "#ffd60a",
};

export const LightColors = {
  bg: "#f2f2f7",
  surface: "#ffffff",
  surfaceOffset: "#f7f7f8",
  border: "#d1d1d6",
  text: "#1d1d1f",
  textMuted: "#6e6e73",
  textFaint: "#c7c7cc",
  primary: "#007aff",
  primaryBg: "#007aff22",
  success: "#34c759",
  error: "#ff3b30",
  warning: "#ff9500",
};

// Default export — dark (slate) as default UI theme
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
  sm: 8,
  md: 12,
  lg: 18,
  xl: 28,
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

// QR color presets
export const QR_COLORS: {
  id: string;
  fg: string;
  bg: string;
  label: string;
}[] = [
  { id: "slate", fg: "#0d1117", bg: "#f0f4f8", label: "Slate" },
  { id: "arctic", fg: "#041520", bg: "#67e8f9", label: "Arctic" },
  { id: "obsidian", fg: "#f8fafc", bg: "#020617", label: "Obsidian" },
  { id: "forest", fg: "#052e16", bg: "#bbf7d0", label: "Forest" },
  { id: "ember", fg: "#431407", bg: "#fed7aa", label: "Ember" },
  { id: "rose", fg: "#4c0519", bg: "#fecdd3", label: "Rose" },
  { id: "violet", fg: "#2e1065", bg: "#ede9fe", label: "Violet" },
  { id: "gold", fg: "#451a03", bg: "#fef08a", label: "Gold" },
  { id: "paper", fg: "#1c1917", bg: "#fafaf9", label: "Paper" },
  { id: "midnight", fg: "#e2e8f0", bg: "#0f172a", label: "Midnight" },
];

{
  /*
// ─── QR Color Presets ─────────────────────────────────────────────────────────
export const QR_COLORS = [
  { id: "cosmic", fg: "#eeeef5", bg: "#080810", label: "Cosmic" }, // intentional dark
  { id: "teal", fg: "#041a18", bg: "#00d4b8", label: "Teal" }, // SWAPPED
  { id: "violet", fg: "#1a0540", bg: "#c4b5fd", label: "Violet" }, // SWAPPED
  { id: "arctic", fg: "#041520", bg: "#67e8f9", label: "Arctic" }, // SWAPPED
  { id: "rose", fg: "#3d0020", bg: "#fda4af", label: "Rose" }, // SWAPPED
  { id: "amber", fg: "#2d1800", bg: "#fde68a", label: "Amber" }, // SWAPPED
  { id: "lime", fg: "#0a1f00", bg: "#bef264", label: "Lime" }, // SWAPPED
  { id: "emerald", fg: "#022010", bg: "#6ee7b7", label: "Emerald" }, // SWAPPED
  { id: "coral", fg: "#2d0e00", bg: "#fdba74", label: "Coral" }, // SWAPPED
  { id: "sky", fg: "#040e1a", bg: "#7dd3fc", label: "Sky" }, // SWAPPED
  { id: "fuchsia", fg: "#2d0040", bg: "#e879f9", label: "Fuchsia" }, // SWAPPED
  { id: "gold", fg: "#1f0e00", bg: "#fcd34d", label: "Gold" }, // SWAPPED
  { id: "indigo", fg: "#0a0a2e", bg: "#a5b4fc", label: "Indigo" }, // SWAPPED
  { id: "pink", fg: "#2d0020", bg: "#f9a8d4", label: "Pink" }, // SWAPPED
  { id: "mint", fg: "#022010", bg: "#a7f3d0", label: "Mint" }, // SWAPPED
  { id: "paper", fg: "#1a1a2e", bg: "#f5f0e8", label: "Paper" }, // already correct
  { id: "ocean", fg: "#020b1a", bg: "#93c5fd", label: "Ocean" }, // SWAPPED
  { id: "lava", fg: "#2d0000", bg: "#fca5a5", label: "Lava" }, // SWAPPED
  { id: 'slate',   fg: '#0f172a', bg: '#e2e8f0', label: 'Slate'   },
  { id: "peach", fg: "#3d0e00", bg: "#fed7aa", label: "Peach" },
  { id: "lavender", fg: "#1e0a40", bg: "#ddd6fe", label: "Lavender" },
  { id: "forest", fg: "#052010", bg: "#86efac", label: "Forest" },
  { id: "sunset", fg: "#2d0e00", bg: "#fdba74", label: "Sunset" },
  { id: "midnight", fg: "#e0e7ff", bg: "#1e1b4b", label: "Midnight" }, // intentional dark
  { id: "cherry", fg: "#1a0008", bg: "#fda4af", label: "Cherry" },
  { id: "steel", fg: "#0c1a2e", bg: "#bae6fd", label: "Steel" },
  { id: "sage", fg: "#0a1f0a", bg: "#bbf7d0", label: "Sage" },
  { id: "dusk", fg: "#e2e8f0", bg: "#334155", label: "Dusk" }, // intentional dark
] as const;
*/
}
