export const Colors = {
  // === SURFACES — Deep cosmic dark ===
  bg: "#080810", // near-black with blue tint
  surface: "#0f0f1a", // cards
  surface2: "#161625", // elevated cards
  surfaceOffset: "#1c1c2e", // inputs
  surfaceActive: "#22223a", // pressed state
  divider: "#252540",
  border: "#2e2e50",

  // === TEXT ===
  text: "#eeeef5",
  textMuted: "#8888aa",
  textFaint: "#44445a",
  textInverse: "#080810",

  // === PRIMARY — Electric Violet-Teal ===
  primary: "#7c6ffa", // vivid purple-blue
  primaryDim: "#5a50cc",
  primaryBg: "#7c6ffa18",
  primaryGlow: "#7c6ffa50",

  // === ACCENT 2 — Teal ===
  teal: "#00d4b8",
  tealBg: "#00d4b815",

  // === ACCENT 3 — Rose ===
  rose: "#f472b6",
  roseBg: "#f472b615",

  // === ACCENT 4 — Amber ===
  amber: "#fbbf24",
  amberBg: "#fbbf2415",

  // === SEMANTIC ===
  success: "#34d399",
  successBg: "#34d39918",
  warning: "#fbbf24",
  warningBg: "#fbbf2418",
  error: "#f87171",
  errorBg: "#f8717118",

  // === TAB ===
  tabActive: "#7c6ffa",
  tabInactive: "#44445a",
  tabBg: "#0a0a14",
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
  "4xl": 56,
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

// ─── QR Color Presets ─────────────────────────────────────────────────────────
export const QR_COLORS = [
  { id: "ink", fg: "#eeeef5", bg: "#080810", label: "Cosmic" },
  { id: "teal", fg: "#00d4b8", bg: "#030f0e", label: "Teal Night" },
  { id: "violet", fg: "#a78bfa", bg: "#0d0520", label: "Violet" },
  { id: "arctic", fg: "#67e8f9", bg: "#041520", label: "Arctic" },
  { id: "rose", fg: "#fb7185", bg: "#1f0010", label: "Rose" },
  { id: "amber", fg: "#fbbf24", bg: "#120a00", label: "Amber" },
  { id: "lime", fg: "#a3e635", bg: "#060f00", label: "Lime" },
  { id: "emerald", fg: "#34d399", bg: "#021a10", label: "Emerald" },
  { id: "coral", fg: "#fb923c", bg: "#150600", label: "Ember" },
  { id: "sky", fg: "#38bdf8", bg: "#040e1a", label: "Sky" },
  { id: "fuchsia", fg: "#e879f9", bg: "#150020", label: "Fuchsia" },
  { id: "gold", fg: "#f59e0b", bg: "#0f0800", label: "Gold" },
  { id: "indigo", fg: "#818cf8", bg: "#06061e", label: "Indigo" },
  { id: "pink", fg: "#f472b6", bg: "#180010", label: "Pink" },
  { id: "mint", fg: "#6ee7b7", bg: "#021510", label: "Mint" },
  { id: "paper", fg: "#1a1a2e", bg: "#f5f0e8", label: "Paper" },
  { id: "ocean", fg: "#60a5fa", bg: "#020b1a", label: "Ocean" },
  { id: "lava", fg: "#ff6b6b", bg: "#150505", label: "Lava" },
] as const;

export type QRColorId = (typeof QR_COLORS)[number]["id"];

export const ACCENT_PALETTE = [
  "#7c6ffa",
  "#00d4b8",
  "#f472b6",
  "#fbbf24",
  "#38bdf8",
  "#a3e635",
  "#fb923c",
  "#34d399",
] as const;
