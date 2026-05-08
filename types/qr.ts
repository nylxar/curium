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

// Eye border radius presets mapped to qrcode-styled borderRadius numbers
export type EyeShape =
  | "sharp"
  | "soft"
  | "round"
  | "pill"
  | "leaf"
  | "diamond"
  | "shield"
  | "dot";

// Piece border radius presets
export type PixelShape =
  | "sharp"
  | "soft"
  | "round"
  | "dots"
  | "liquid"
  | "glued"
  | "diamond"
  | "cross"
  | "star";

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
};

export interface QRStyle {
  colorId: string;
  fgColor: string;
  bgColor: string;
  eyeShape: EyeShape;
  pixelShape: PixelShape;
  logoUri?: string;
  ecl: ECL;
}

export const DEFAULT_QR_STYLE: QRStyle = {
  colorId: "arctic",
  fgColor: "#041520",
  bgColor: "#67e8f9",
  eyeShape: "round",
  pixelShape: "dots",
  logoUri: undefined,
  ecl: "M",
};

// Map our EyeShape names → qrcode-styled borderRadius values
export const EYE_BORDER_RADIUS: Record<EyeShape, number | number[]> = {
  sharp: 0,
  soft: 4,
  round: 50,
  pill: 20,
  leaf: [16, 0, 16, 0],
  diamond: [8, 8, 8, 8],
  shield: [12, 12, 0, 0],
  dot: 50,
};

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
};

export const PIXEL_IS_GLUED: Record<PixelShape, boolean> = {
  sharp: false,
  soft: false,
  round: false,
  dots: false,
  liquid: true,
  glued: true,
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
