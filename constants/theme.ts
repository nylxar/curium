export const Colors = {
  bg: "#0a0a0a",
  surface: "#111111",
  surface2: "#181818",
  surfaceOffset: "#1f1f1f",
  surfaceActive: "#252525",
  divider: "#2a2a2a",
  border: "#333333",

  text: "#f0f0f0",
  textMuted: "#888888",
  textFaint: "#444444",
  textInverse: "#0a0a0a",

  primary: "#00d4b8",
  primaryDim: "#009e89",
  primaryBg: "#00d4b810",
  primaryGlow: "#00d4b840",

  success: "#4caf7d",
  successBg: "#4caf7d18",
  warning: "#f59e0b",
  warningBg: "#f59e0b18",
  error: "#ef4444",
  errorBg: "#ef444418",

  tabActive: "#00d4b8",
  tabInactive: "#555555",
  tabBg: "#0f0f0f",
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
} as const;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  "2xl": 30,
  "3xl": 38,
} as const;

export const Animation = {
  spring: { damping: 18, stiffness: 200, mass: 0.8 },
  springBouncy: { damping: 12, stiffness: 180, mass: 0.7 },
  timing: { duration: 220 },
} as const;

// ─── Rich QR Color Palette ────────────────────────────────────────────────────
export const QR_COLORS = [
  // Teals & Cyans
  { id: "teal", fg: "#00d4b8", bg: "#0a0a0a", label: "Teal Night" },
  { id: "arctic", fg: "#67e8f9", bg: "#0c1a2e", label: "Arctic" },
  { id: "mint", fg: "#6ee7b7", bg: "#052e16", label: "Forest Mint" },
  // Purples & Violets
  { id: "violet", fg: "#c084fc", bg: "#1a0533", label: "Violet Dusk" },
  { id: "indigo", fg: "#818cf8", bg: "#0f0f2e", label: "Indigo Deep" },
  { id: "lavender", fg: "#a5b4fc", bg: "#1e1b4b", label: "Lavender" },
  // Warm & Fiery
  { id: "coral", fg: "#fb923c", bg: "#1c0a00", label: "Ember" },
  { id: "rose", fg: "#fb7185", bg: "#1f0a10", label: "Rose" },
  { id: "gold", fg: "#fbbf24", bg: "#1a1000", label: "Gold Rush" },
  { id: "amber", fg: "#f59e0b", bg: "#0f0800", label: "Amber" },
  // Blues
  { id: "sky", fg: "#38bdf8", bg: "#0a1628", label: "Sky" },
  { id: "ocean", fg: "#60a5fa", bg: "#0a0f2e", label: "Ocean" },
  // Greens
  { id: "lime", fg: "#a3e635", bg: "#0a1200", label: "Lime" },
  { id: "emerald", fg: "#34d399", bg: "#022c22", label: "Emerald" },
  // Pinks
  { id: "pink", fg: "#f472b6", bg: "#1f0018", label: "Bubblegum" },
  { id: "fuchsia", fg: "#e879f9", bg: "#1a0020", label: "Fuchsia" },
  // Neutrals (classic)
  { id: "ink", fg: "#f0f0f0", bg: "#0a0a0a", label: "Ink Night" },
  { id: "paper", fg: "#1a1a1a", bg: "#f5f0e8", label: "Paper" },
] as const;

export type QRColorId = (typeof QR_COLORS)[number]["id"];

// UI accent palette used across the app
export const ACCENT_PALETTE = [
  "#00d4b8", // teal
  "#67e8f9", // cyan
  "#c084fc", // purple
  "#fb923c", // orange
  "#fb7185", // rose
  "#fbbf24", // gold
  "#38bdf8", // sky
  "#a3e635", // lime
  "#f472b6", // pink
  "#34d399", // emerald
] as const;
