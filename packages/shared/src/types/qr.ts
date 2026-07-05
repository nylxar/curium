export type QRType =
  | "url"
  | "text"
  | "email"
  | "phone"
  | "sms"
  | "wifi"
  | "contact"
  | "location"
  | "event"
  | "otpauth";

export type ECL = "L" | "M" | "Q" | "H";

export type EyeShape =
  | "sharp"
  | "soft"
  | "round"
  | "pill"
  | "dot"
  | "shield"
  | "hexagon"
  | "octagon"
  | "inpoint"
  | "outpoint"
  | "leaf";

export type PupilShape =
  | "dot"
  | "square"
  | "diamond"
  | "cross"
  | "hexagon"
  | "octagon"
  | "shield"
  | "star"
  | "heart"
  | "blob"
  | "dome"
  | "oval"
  | "pentagon"
  | "scallop"
  | "cloud"
  | "droplet"
  | "microchip"
  | "hashtag"
  | "pixel"
  | "none";

export type PixelShape =
  | "sharp"
  | "soft"
  | "round"
  | "dots"
  | "liquid"
  | "glued"
  | "diamond"
  | "cross"
  | "star"
  | "triangle"
  | "hexagon"
  | "plus"
  | "heart"
  | "sparkle"
  | "chevron"
  | "wave"
  | "smooth"
  | "flow"
  | "blob"
  | "pinched-square"
  | "circuit-board"
  | "hashtag"
  | "vertical-line"
  | "horizontal-line";

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

export type FrameStyle =
  | "none"
  | "thin"
  | "rounded"
  | "thick"
  | "dashed"
  | "dotted"
  | "double";

export type LogoBackground = "none" | "circle" | "rounded" | "square";

export interface LogoStyleConfig {
  background: LogoBackground;
  padding: number;
  border: boolean;
  shadow: boolean;
}

export const LOGO_BACKGROUNDS: LogoBackground[] = [
  "none",
  "circle",
  "rounded",
  "square",
];

export interface GradientConfig {
  enabled: boolean;
  angle: number;
  startColor: string;
  endColor: string;
}

export interface QRStyle {
  colorId: string;
  fgColor: string;
  bgColor: string;
  eyeColor: string;
  pupilColor: string;
  eyeShape: EyeShape;
  pupilShape: PupilShape;
  pixelShape: PixelShape;
  frame: FrameStyle;
  qrCorners: number;
  gradient: GradientConfig;
  logoStyle: LogoStyleConfig;
  logoUri?: string;
  logoPosition?: { x: number; y: number };
  ecl: ECL;
}

export const DEFAULT_QR_STYLE: QRStyle = {
  colorId: "paper",
  fgColor: "#1c1917",
  bgColor: "#fafaf9",
  eyeColor: "#041520",
  pupilColor: "#1c1917",
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

export const DEFAULT_QR_STYLE_DARK: QRStyle = {
  colorId: "paper",
  fgColor: "#f5f0e8",
  bgColor: "#0d0d0f",
  eyeColor: "#f5f0e8",
  pupilColor: "#f5f0e8",
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
export interface EventForm {
  title: string;
  location: string;
  start: string;
  end: string;
  description: string;
}
export interface OTPAuthForm {
  issuer: string;
  account: string;
  secret: string;
  algorithm: "SHA1" | "SHA256" | "SHA512";
  digits: 6 | 8;
  period: number;
}

export type AnyForm =
  | URLForm
  | TextForm
  | EmailForm
  | PhoneForm
  | SMSForm
  | WiFiForm
  | ContactForm
  | LocationForm
  | EventForm
  | OTPAuthForm;
