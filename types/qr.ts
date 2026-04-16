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

export interface QRData {
  type: QRType;
  value: string; // final encoded string fed to QR lib
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

export type EyeShape =
  | "square"
  | "circle"
  | "rounded"
  | "extra-rounded"
  | "leaf"
  | "diamond";
export type PixelShape =
  | "square"
  | "circle"
  | "rounded"
  | "dots"
  | "classy"
  | "classy-rounded";

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
  colorId: "ink",
  fgColor: "#f0f0f0",
  bgColor: "#0a0a0a",
  eyeShape: "square",
  pixelShape: "square",
  logoUri: undefined,
  ecl: "M",
};
