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
export type EyeShape = "sharp" | "soft" | "round" | "pill" | "leaf" | "diamond";

// Piece border radius presets
export type PixelShape =
  | "sharp"
  | "soft"
  | "round"
  | "dots"
  | "liquid"
  | "glued";

export interface PixelConfig {
  pieceSize: number;
  pieceBorderRadius: number;
  pieceScale: number;
}

export const PIXEL_CONFIG: Record<PixelShape, PixelConfig> = {
  sharp: { pieceSize: 9, pieceBorderRadius: 0, pieceScale: 1.0 },
  soft: { pieceSize: 9, pieceBorderRadius: 2, pieceScale: 0.98 },
  round: { pieceSize: 9, pieceBorderRadius: 4, pieceScale: 0.95 },
  dots: { pieceSize: 7, pieceBorderRadius: 3.5, pieceScale: 0.9 }, // perfect circles, gap prevents bleed
  liquid: { pieceSize: 8, pieceBorderRadius: 3, pieceScale: 0.92 },
  glued: { pieceSize: 9, pieceBorderRadius: 3, pieceScale: 1.0 },
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
  soft: 6,
  round: 12,
  pill: 50,
  leaf: [20, 0, 20, 0],
  diamond: [10, 10, 0, 0],
};

// Map our PixelShape names → qrcode-styled pieceBorderRadius
export const PIXEL_BORDER_RADIUS: Record<PixelShape, number> = {
  sharp: 0,
  soft: 3,
  round: 8,
  dots: 50,
  liquid: 14,
  glued: 10,
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
