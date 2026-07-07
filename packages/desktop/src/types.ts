import type { QRType, QRStyle } from "@curium/shared";
import {
  QrCode,
  Palette,
  SlidersHorizontal,
  Layers,
  Bookmark,
  History,
  Settings,
  Info,
  LifeBuoy,
  Cpu,
} from "lucide-react";

export interface FormState {
  url: { url: string };
  text: { text: string };
  email: { to: string; subject: string; body: string };
  phone: { phone: string };
  sms: { phone: string; message: string };
  wifi: {
    ssid: string;
    password: string;
    encryption: "WPA" | "WEP" | "nopass";
  };
  contact: { name: string; phone: string; email: string; org: string };
  location: { lat: string; lng: string; label: string };
  event: { title: string; location: string; start: string; end: string; description: string };
  otpauth: { issuer: string; account: string; secret: string; algorithm: "SHA1" | "SHA256" | "SHA512"; digits: 6 | 8; period: number };
}

export const DEFAULT_FORMS: FormState = {
  url: { url: "" },
  text: { text: "" },
  email: { to: "", subject: "", body: "" },
  phone: { phone: "" },
  sms: { phone: "", message: "" },
  wifi: { ssid: "", password: "", encryption: "WPA" },
  contact: { name: "", phone: "", email: "", org: "" },
  location: { lat: "", lng: "", label: "" },
  event: { title: "", location: "", start: "", end: "", description: "" },
  otpauth: { issuer: "", account: "", secret: "", algorithm: "SHA1", digits: 6, period: 30 },
};

export interface Template {
  id: string;
  name: string;
  style: QRStyle;
}

export interface HistoryEntry {
  id: string;
  data: string;
  style: QRStyle;
  svg: string;
  createdAt: number;
}

export type TabId =
  | "generate"
  | "style"
  | "adjust"
  | "batch"
  | "templates"
  | "history"
  | "settings"
  | "about"
  | "info"
  | "support";

export const QR_TYPES: { id: QRType; label: string }[] = [
  { id: "url", label: "URL" },
  { id: "text", label: "Text" },
  { id: "wifi", label: "WiFi" },
  { id: "email", label: "Email" },
  { id: "phone", label: "Phone" },
  { id: "sms", label: "SMS" },
  { id: "contact", label: "Contact" },
  { id: "location", label: "Location" },
  { id: "event", label: "Event" },
  { id: "otpauth", label: "OTP Auth" },
];

export const TOP_TABS: { id: TabId; icon: typeof QrCode; label: string }[] = [
  { id: "generate", icon: QrCode, label: "Generate" },
  { id: "style", icon: Palette, label: "Style" },
  { id: "adjust", icon: SlidersHorizontal, label: "Adjust" },
  { id: "batch", icon: Layers, label: "Batch" },
  { id: "templates", icon: Bookmark, label: "Templates" },
  { id: "history", icon: History, label: "History" },
];

export const BOTTOM_TABS: { id: TabId; icon: typeof History; label: string }[] = [
  { id: "settings", icon: Settings, label: "Settings" },
  { id: "about", icon: Info, label: "About" },
  { id: "info", icon: Cpu, label: "Info" },
  { id: "support", icon: LifeBuoy, label: "Support" },
];
