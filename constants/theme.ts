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
  { id: "slate", fg: "#0f172a", bg: "#cbd5e1", label: "Slate" },
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
