// constants/theme.ts — FULL REPLACEMENT

export const Fonts = {
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

// Dark theme: black canvas with "paper" (warm off-white) text and accents.
// The "primary" is intentionally near-paper so accent UI (toggles, active
// borders, FAB) reads as ink-on-paper instead of a saturated blue.  This
// gives the app a calm, paper-notebook feel rather than a generic blue
// dashboard look.
export const DarkColors = {
  bg: "#0d0d0f",
  surface: "#161618",
  surfaceOffset: "#1e1e21",
  border: "#2a2a2e",
  text: "#f5f0e8", // paper
  textMuted: "#a8a39a",
  textFaint: "#5a5650",
  primary: "#f5f0e8", // paper accent
  primaryBg: "#f5f0e822",
  success: "#7ad88a",
  error: "#ff6b6b",
  warning: "#f5c46a",
};

// Light theme: paper (warm cream) canvas with ink (near-black) text and
// accents.  Primary is near-black so CTAs, toggles, and active borders
// read as ink rather than a saturated blue.  Same paper-notebook feel as
// dark, just inverted.
export const LightColors = {
  bg: "#f5f0e8", // paper
  surface: "#fbf8f3",
  surfaceOffset: "#ebe6dd",
  border: "#d6cfc1",
  text: "#1a1a1f", // ink
  textMuted: "#5a5650",
  textFaint: "#a8a39a",
  primary: "#1a1a1f", // ink accent
  primaryBg: "#1a1a1f18",
  success: "#2f8a3f",
  error: "#c43d3d",
  warning: "#b07a16",
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

{
  /*
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
*/
}

// ─── QR Color Presets ─────────────────────────────────────────────────────────
// Each entry has been curated for:
//   • Strong contrast between fg and bg (QR codes must scan reliably)
//   • Visually distinct hue from its neighbours in the grid
//   • A coherent "paper / ink / accent" identity that matches the app theme
//
// Layout in the 7-column grid (when sorted by id):
//   1 cosmic  2 teal     3 violet   4 arctic   5 rose     6 amber    7 lime
//   8 emerald 9 coral   10 sky     11 fuchsia 12 gold    13 indigo  14 pink
//  15 mint   16 paper   17 ocean   18 lava    19 slate   20 peach   21 lavender
//  22 forest 23 sunset 24 midnight 25 cherry  26 steel   27 sage
//
// "Paper" is the brand default — it uses the cream/ink pairing that the
// rest of the UI is built on.
export const QR_COLORS = [
  // Row 1 — light pastels
  { id: "paper", fg: "#1c1917", bg: "#fafaf9", label: "Paper" },
  { id: "arctic", fg: "#041520", bg: "#bae6fd", label: "Arctic" },
  { id: "sky", fg: "#040e1a", bg: "#7dd3fc", label: "Sky" },
  { id: "mint", fg: "#022010", bg: "#a7f3d0", label: "Mint" },
  { id: "emerald", fg: "#022010", bg: "#6ee7b7", label: "Emerald" },
  { id: "lime", fg: "#0a1f00", bg: "#bef264", label: "Lime" },
  { id: "amber", fg: "#2d1800", bg: "#fde68a", label: "Amber" },

  // Row 2 — warm + earth
  { id: "gold", fg: "#1f0e00", bg: "#fcd34d", label: "Gold" },
  { id: "peach", fg: "#3d0e00", bg: "#fed7aa", label: "Peach" },
  { id: "coral", fg: "#2d0e00", bg: "#fdba74", label: "Coral" },
  { id: "sunset", fg: "#2d0e00", bg: "#fdba74", label: "Sunset" },
  { id: "lava", fg: "#2d0000", bg: "#fca5a5", label: "Lava" },
  { id: "cherry", fg: "#1a0008", bg: "#fda4af", label: "Cherry" },
  { id: "rose", fg: "#3d0020", bg: "#fecdd3", label: "Rose" },

  // Row 3 — purples, blues, greens
  { id: "pink", fg: "#2d0020", bg: "#f9a8d4", label: "Pink" },
  { id: "fuchsia", fg: "#2d0040", bg: "#e879f9", label: "Fuchsia" },
  { id: "lavender", fg: "#1e0a40", bg: "#ddd6fe", label: "Lavender" },
  { id: "violet", fg: "#1a0540", bg: "#c4b5fd", label: "Violet" },
  { id: "indigo", fg: "#0a0a2e", bg: "#a5b4fc", label: "Indigo" },
  { id: "ocean", fg: "#020b1a", bg: "#93c5fd", label: "Ocean" },
  { id: "steel", fg: "#0c1a2e", bg: "#bae6fd", label: "Steel" },

  // Row 4 — darks + neutrals (intentional dark pairs)
  { id: "teal", fg: "#041a18", bg: "#00d4b8", label: "Teal" },
  { id: "sage", fg: "#0a1f0a", bg: "#bbf7d0", label: "Sage" },
  { id: "forest", fg: "#052010", bg: "#86efac", label: "Forest" },
  { id: "slate", fg: "#0f172a", bg: "#e2e8f0", label: "Slate" },
  { id: "cosmic", fg: "#eeeef5", bg: "#080810", label: "Cosmic" },
  { id: "midnight", fg: "#e0e7ff", bg: "#1e1b4b", label: "Midnight" },
  { id: "dusk", fg: "#e2e8f0", bg: "#334155", label: "Dusk" },
] as const;
