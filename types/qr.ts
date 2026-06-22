export type QRType =
  | "url"
  | "text"
  | "email"
  | "phone"
  | "sms"
  | "wifi"
  | "contact"
  | "location";

export type ECL = "L" | "M" | "Q" | "H";

// ─── Eye (finder pattern) shapes ──────────────────────────────────────────────
// Outer ring around the eye.  Each shape is a distinct geometric form.
export type EyeShape =
  | "sharp" // squared corners
  | "soft" // slightly rounded
  | "round" // pill inner, soft outer
  | "pill" // fully pillowed
  | "dot" // full circle
  | "shield" // rounded top, pointed bottom
  | "hexagon" // regular hexagon
  | "octagon" // regular octagon
  | "inpoint" // square with inward-pointing corners
  | "outpoint" // square with outward-pointing corners
  | "leaf"; // leaf/petal shape

// ─── Pupil (finder center) shapes ─────────────────────────────────────────────
// Single-path pupils render ONE SVG path filling the 3×3 center area (like
// dagronf/QRCode).  Clean, iconic, scannable.  "pixel" renders the 3×3
// center as 9 per-module shapes using the current pixelShape (textured grid).
// "none" produces a transparent hole.
export type PupilShape =
  // ─── Classic shapes ──
  | "dot"       // circle filling 3×3
  | "square"    // filled square filling 3×3
  | "diamond"   // 45° rhombus filling 3×3
  | "cross"     // thick cross filling 3×3
  | "hexagon"   // hexagon filling 3×3
  | "octagon"   // octagon filling 3×3
  | "shield"    // shield shape filling 3×3
  | "star"      // 5-point star filling 3×3
  | "heart"     // heart filling 3×3
  | "blob"      // organic blob filling 3×3
  // ─── Material Design 3 expressive shapes ──
  | "dome"      // half-circle (top half, flat bottom)
  | "oval"      // horizontal ellipse
  | "pentagon"  // regular pentagon
  | "scallop"   // wavy/scalloped circle
  | "cloud"     // organic cloud
  | "droplet"   // teardrop
  // ─── Tech shapes ──
  | "microchip"  // microchip/IC shape
  | "hashtag"    // hashtag/pound grid
  // ─── Per-module grid ──
  | "pixel"     // per-module grid (uses current pixelShape)
  | "none";     // transparent hole

// ─── Pixel (data module) shapes ──────────────────────────────────────────────
export type PixelShape =
  | "sharp" // squared
  | "soft" // gentle rounded
  | "round" // pill
  | "dots" // circle
  | "liquid" // organic pill
  | "glued" // slightly rounded, full cell
  | "diamond" // rhombus
  | "cross" // plus shape
  | "star" // 5-point star
  | "triangle" // equilateral triangle
  | "hexagon" // hexagon
  | "plus" // filled plus
  | "heart" // heart
  | "sparkle" // 4-point star / sparkle
  | "chevron" // upward-pointing V
  | "wave" // wavy rectangle
  // ─── Qewie-like anatomical refinement shapes ──
  | "smooth" // gentle corner rounding, clean modern
  | "flow" // organic flowing modules
  | "blob" // organic blob-like shape
  // ─── Circuit / tech shapes ──
  | "pinched-square" // square with pinched-in corners
  | "circuit-board" // circuit-board trace style
  | "hashtag" // hashtag/pound grid
  | "vertical-line" // vertical line per module
  | "horizontal-line"; // horizontal line per module

export interface PixelConfig {
  pieceSize: number;
  pieceBorderRadius: number;
  pieceScale: number;
}

export const PIXEL_CONFIG: Record<PixelShape, PixelConfig> = {
  sharp: { pieceSize: 10, pieceBorderRadius: 0, pieceScale: 1.0 },
  soft: { pieceSize: 10, pieceBorderRadius: 3, pieceScale: 0.96 },
  round: { pieceSize: 10, pieceBorderRadius: 5, pieceScale: 0.92 },
  dots: { pieceSize: 8, pieceBorderRadius: 4, pieceScale: 0.88 },
  liquid: { pieceSize: 10, pieceBorderRadius: 4, pieceScale: 0.9 },
  glued: { pieceSize: 10, pieceBorderRadius: 2, pieceScale: 1.0 },
  diamond: { pieceSize: 10, pieceBorderRadius: 2, pieceScale: 0.88 },
  cross: { pieceSize: 10, pieceBorderRadius: 0, pieceScale: 0.88 },
  star: { pieceSize: 9, pieceBorderRadius: 1, pieceScale: 0.88 },
  triangle: { pieceSize: 10, pieceBorderRadius: 0, pieceScale: 0.88 },
  hexagon: { pieceSize: 10, pieceBorderRadius: 0, pieceScale: 0.9 },
  plus: { pieceSize: 10, pieceBorderRadius: 0, pieceScale: 0.88 },
  heart: { pieceSize: 10, pieceBorderRadius: 0, pieceScale: 0.86 },
  sparkle: { pieceSize: 10, pieceBorderRadius: 0, pieceScale: 0.9 },
  chevron: { pieceSize: 10, pieceBorderRadius: 0, pieceScale: 0.84 },
  wave: { pieceSize: 10, pieceBorderRadius: 2, pieceScale: 0.82 },
  smooth: { pieceSize: 10, pieceBorderRadius: 3, pieceScale: 0.96 },
  flow: { pieceSize: 10, pieceBorderRadius: 4, pieceScale: 0.94 },
  blob: { pieceSize: 10, pieceBorderRadius: 5, pieceScale: 0.92 },
  "pinched-square": { pieceSize: 10, pieceBorderRadius: 1, pieceScale: 0.92 },
  "circuit-board": { pieceSize: 10, pieceBorderRadius: 0, pieceScale: 0.94 },
  hashtag: { pieceSize: 10, pieceBorderRadius: 0, pieceScale: 0.88 },
  "vertical-line": { pieceSize: 4, pieceBorderRadius: 0, pieceScale: 0.92 },
  "horizontal-line": { pieceSize: 10, pieceBorderRadius: 0, pieceScale: 0.4 },
};

// ─── Frame / quiet-zone styles ────────────────────────────────────────────────
// The frame is a decorative border wrapped around the QR canvas.  The QR
// itself doesn't change — we add a View with a border on the outside.
export type FrameStyle =
  | "none" // no frame
  | "thin" // 1px solid border
  | "rounded" // 14px corner radius, 1.5px border
  | "thick" // 4px solid border
  | "dashed" // 2px dashed border
  | "dotted" // 1.5px dotted border
  | "double"; // double border (outer 1px + 4px gap + 1px)

// ─── Logo style ───────────────────────────────────────────────────────────────
// The center logo is now wrapped in a styled background.  This makes logos
// scan reliably (background gives the modules a quiet zone) while also
// looking like a designed badge.
export type LogoBackground = "none" | "circle" | "rounded" | "square";

export interface LogoStyleConfig {
  background: LogoBackground; // shape of the backing card
  padding: number; // 0–20% of logo size, gap between logo edge and modules
  border: boolean; // 1.5px border around the logo
  shadow: boolean; // soft drop shadow for depth
}

export const LOGO_BACKGROUNDS: LogoBackground[] = [
  "none",
  "circle",
  "rounded",
  "square",
];

// ─── Gradient ────────────────────────────────────────────────────────────────
// When enabled, the foreground is rendered as a 2-stop linear gradient
// instead of a solid color.  Angle is degrees, 0 = bottom-to-top.
export interface GradientConfig {
  enabled: boolean;
  angle: number; // 0–360
  startColor: string;
  endColor: string;
}

// ─── QRStyle ─────────────────────────────────────────────────────────────────
export interface QRStyle {
  colorId: string;
  fgColor: string;
  bgColor: string;
  eyeColor: string;
  eyeShape: EyeShape;
  pupilShape: PupilShape;
  pixelShape: PixelShape;
  frame: FrameStyle;
  /** Corner radius of the QR canvas itself, in pixels.  0 = sharp,
   *  larger values = more rounded.  Default is 20. */
  qrCorners: number;
  gradient: GradientConfig;
  logoStyle: LogoStyleConfig;
  logoUri?: string;
  /** Position of the logo plate inside the QR canvas (pixels from top-left).
   *  Persisted so saved/shared QRs keep the user's placement. */
  logoPosition?: { x: number; y: number };
  ecl: ECL;
}

export const DEFAULT_QR_STYLE: QRStyle = {
  colorId: "paper",
  fgColor: "#1c1917",
  bgColor: "#fafaf9",
  eyeColor: "#041520",
  eyeShape: "round",
  pupilShape: "dot",
  pixelShape: "dots",
  frame: "none",
  qrCorners: 20,
  gradient: {
    enabled: false,
    angle: 0,
    startColor: "#1c1917",
    endColor: "#44403c",
  },
  logoStyle: {
    background: "rounded",
    padding: 0,
    border: false,
    shadow: false,
  },
  ecl: "M",
};

// Mirror of DEFAULT_QR_STYLE for the dark theme.  The fg/bg are inverted
// (ink on paper → paper on ink), the eye picks up the same ink, and the
// brand identity ("paper") is preserved so a saved-history QR style still
// reads as "paper" regardless of which theme the user is on.
export const DEFAULT_QR_STYLE_DARK: QRStyle = {
  colorId: "paper",
  fgColor: "#f5f0e8",
  bgColor: "#0d0d0f",
  eyeColor: "#f5f0e8",
  eyeShape: "round",
  pupilShape: "dot",
  pixelShape: "dots",
  frame: "none",
  qrCorners: 20,
  gradient: {
    enabled: false,
    angle: 0,
    startColor: "#f5f0e8",
    endColor: "#a8a29e",
  },
  logoStyle: {
    background: "rounded",
    padding: 0,
    border: false,
    shadow: false,
  },
  ecl: "M",
};

/**
 * Returns the right default for the current theme.  Use this everywhere
 * `useState<QRStyle>(DEFAULT_QR_STYLE)` is currently hardcoded so the
 * QR's fg/bg match the screen theme.
 */
export function defaultQRStyle(isDark: boolean): QRStyle {
  return isDark ? DEFAULT_QR_STYLE_DARK : DEFAULT_QR_STYLE;
}

export type SheetId =
  | "fgColor"
  | "bgColor"
  | "eyeColor"
  | "eye"
  | "pupil"
  | "pixel"
  | "frame"
  | "gradient"
  | "logo"
  | "logoStyle"
  | "ecl"
  | null;

// Map our PixelShape names → qrcode-styled pieceBorderRadius
export const PIXEL_BORDER_RADIUS: Record<PixelShape, number> = {
  sharp: 0,
  soft: 3,
  round: 8,
  dots: 50,
  liquid: 14,
  glued: 10,
  diamond: 2,
  cross: 0,
  star: 1,
  triangle: 0,
  hexagon: 0,
  plus: 0,
  heart: 0,
  sparkle: 0,
  chevron: 0,
  wave: 2,
  smooth: 4,
  flow: 6,
  blob: 8,
  "pinched-square": 1,
  "circuit-board": 0,
  hashtag: 0,
  "vertical-line": 0,
  "horizontal-line": 0,
};

export interface QRData {
  type: QRType;
  value: string;
}

export interface URLForm {
  url: string;
}
export interface TextForm {
  text: string;
}
export interface EmailForm {
  to: string;
  subject: string;
  body: string;
}
export interface PhoneForm {
  phone: string;
}
export interface SMSForm {
  phone: string;
  message: string;
}
export interface WiFiForm {
  ssid: string;
  password: string;
  encryption: "WPA" | "WEP" | "nopass";
}
export interface ContactForm {
  name: string;
  phone: string;
  email: string;
  org: string;
}
export interface LocationForm {
  lat: string;
  lng: string;
  label: string;
}

export type AnyForm =
  | URLForm
  | TextForm
  | EmailForm
  | PhoneForm
  | SMSForm
  | WiFiForm
  | ContactForm
  | LocationForm;
