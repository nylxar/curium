import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  generateSVG,
  QRStyle,
  QRType,
  DEFAULT_QR_STYLE,
  QR_COLORS,
} from "@curium/shared";
import { zipSync, strToU8 } from "fflate";
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
  Shuffle,
  ExternalLink,
  Shield,
  EyeOff,
  Lock,
  X as XIcon,
  Check,
  Coffee,
  CreditCard,
  BadgeInfo,
  Cpu,
} from "lucide-react";
import { QRPreview } from "./components/QRPreview";
import { LogoOverlay } from "./components/LogoOverlay";
import { StylePanel } from "./components/StylePanel";
import { ExportBar } from "./components/ExportBar";
import { TitleBar, useIsTauri } from "./components/TitleBar";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { Splash } from "./components/Splash";
import { Welcome } from "./components/Welcome";
import { WhatsNew } from "./components/WhatsNew";
import { BatchPanel } from "./components/BatchPanel";
import { animateThemeTransition, bounceButton } from "./utils/animations";
import { gsap } from "gsap";
import buildInfo from "./build-info.json";

// ─── QR Type encoding ────────────────────────────────────────────────────────
interface FormState {
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

const DEFAULT_FORMS: FormState = {
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

function encodeQR(type: QRType, forms: FormState): string {
  switch (type) {
    case "url": {
      const u = forms.url.url.trim();
      if (!u) return "";
      return u.startsWith("http") ? u : `https://${u}`;
    }
    case "text":
      return forms.text.text.trim();
    case "email": {
      const { to, subject, body } = forms.email;
      if (!to.trim()) return "";
      return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
    case "phone": {
      const p = forms.phone.phone.trim();
      return p ? `tel:${p}` : "";
    }
    case "sms": {
      const { phone, message } = forms.sms;
      if (!phone.trim()) return "";
      return `sms:${phone}${message ? `?body=${encodeURIComponent(message)}` : ""}`;
    }
    case "wifi": {
      const { ssid, password, encryption } = forms.wifi;
      if (!ssid.trim()) return "";
      return `WIFI:T:${encryption};S:${ssid};P:${password};;`;
    }
    case "contact": {
      const { name, phone, email, org } = forms.contact;
      if (!name.trim()) return "";
      return `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${phone}\nEMAIL:${email}\nORG:${org}\nEND:VCARD`;
    }
    case "location": {
      const { lat, lng, label } = forms.location;
      if (!lat.trim() || !lng.trim()) return "";
      return `geo:${lat},${lng}${label ? `?q=${lat},${lng}(${encodeURIComponent(label)})` : ""}`;
    }
    case "event": {
      const { title, location, start, end, description } = forms.event;
      if (!title.trim()) return "";
      const fmtDate = (d: string) => d ? d.replace(/[-: ]/g, "").replace(/(\d{8})(\d{4})/, "$1T$2") : "";
      const lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "BEGIN:VEVENT",
        `SUMMARY:${title}`,
      ];
      if (location) lines.push(`LOCATION:${location}`);
      if (start) lines.push(`DTSTART:${fmtDate(start)}`);
      if (end) lines.push(`DTEND:${fmtDate(end)}`);
      if (description) lines.push(`DESCRIPTION:${description}`);
      lines.push("END:VEVENT", "END:VCALENDAR");
      return lines.join("\n");
    }
    case "otpauth": {
      const { issuer, account, secret, algorithm, digits, period } = forms.otpauth;
      if (!secret.trim()) return "";
      const label = issuer ? `${encodeURIComponent(issuer)}:${encodeURIComponent(account || issuer)}` : encodeURIComponent(account);
      const params = new URLSearchParams({ secret, algorithm, digits: String(digits), period: String(period) });
      return `otpauth://totp/${label}?${params.toString()}`;
    }
    default:
      return "";
  }
}

function decodeQR(
  data: string,
): { type: QRType; form: FormState[QRType] } | null {
  if (!data) return null;
  if (data.startsWith("WIFI:")) {
    const ssid = data.match(/S:([^;]+)/)?.[1] ?? "";
    const password = data.match(/P:([^;]+)/)?.[1] ?? "";
    const encryption = (data.match(/T:([^;]+)/)?.[1] ?? "WPA") as
      "WPA" | "WEP" | "nopass";
    return { type: "wifi", form: { ssid, password, encryption } };
  }
  if (data.startsWith("mailto:")) {
    const rest = data.slice(7);
    const qi = rest.indexOf("?");
    const to = qi >= 0 ? decodeURIComponent(rest.slice(0, qi)) : rest;
    const params =
      qi >= 0 ? new URLSearchParams(rest.slice(qi)) : new URLSearchParams();
    return {
      type: "email",
      form: {
        to,
        subject: params.get("subject") ?? "",
        body: params.get("body") ?? "",
      },
    };
  }
  if (data.startsWith("tel:")) {
    return { type: "phone", form: { phone: data.slice(4) } };
  }
  if (data.startsWith("sms:")) {
    const rest = data.slice(4);
    const qi = rest.indexOf("?");
    const phone = qi >= 0 ? rest.slice(0, qi) : rest;
    const params =
      qi >= 0 ? new URLSearchParams(rest.slice(qi + 1)) : new URLSearchParams();
    return { type: "sms", form: { phone, message: params.get("body") ?? "" } };
  }
  if (data.startsWith("BEGIN:VCARD")) {
    const name = data.match(/FN:(.+)/m)?.[1] ?? "";
    const phone = data.match(/TEL:(.+)/m)?.[1] ?? "";
    const email = data.match(/EMAIL:(.+)/m)?.[1] ?? "";
    const org = data.match(/ORG:(.+)/m)?.[1] ?? "";
    return { type: "contact", form: { name, phone, email, org } };
  }
  if (data.startsWith("BEGIN:VCALENDAR")) {
    const title = data.match(/SUMMARY:(.+)/m)?.[1] ?? "";
    const location = data.match(/LOCATION:(.+)/m)?.[1] ?? "";
    const start = data.match(/DTSTART:(.+)/m)?.[1] ?? "";
    const end = data.match(/DTEND:(.+)/m)?.[1] ?? "";
    const description = data.match(/DESCRIPTION:(.+)/m)?.[1] ?? "";
    return { type: "event", form: { title, location, start, end, description } };
  }
  if (data.startsWith("otpauth://")) {
    const params = new URLSearchParams(data.split("?")[1] ?? "");
    const label = decodeURIComponent(data.split("?")[0].replace("otpauth://totp/", ""));
    const colonIdx = label.indexOf(":");
    const issuer = colonIdx >= 0 ? label.slice(0, colonIdx) : "";
    const account = colonIdx >= 0 ? label.slice(colonIdx + 1) : label;
    return {
      type: "otpauth",
      form: {
        issuer,
        account,
        secret: params.get("secret") ?? "",
        algorithm: (params.get("algorithm") ?? "SHA1") as "SHA1" | "SHA256" | "SHA512",
        digits: Number(params.get("digits") ?? "6") as 6 | 8,
        period: Number(params.get("period") ?? "30"),
      },
    };
  }
  if (data.startsWith("geo:")) {
    const match = data.match(/geo:([^,]+),([^?]+)/);
    const lat = match?.[1] ?? "";
    const lng = match?.[2] ?? "";
    const labelMatch = data.match(/\(([^)]+)\)/);
    return {
      type: "location",
      form: { lat, lng, label: labelMatch?.[1] ?? "" },
    };
  }
  if (data.startsWith("http://") || data.startsWith("https://")) {
    return { type: "url", form: { url: data } };
  }
  return { type: "text", form: { text: data } };
}

// ─── Shuffle pools ───────────────────────────────────────────────────────────
const SHUFFLE_EYES: QRStyle["eyeShape"][] = [
  "sharp",
  "soft",
  "round",
  "pill",
  "dot",
  "shield",
  "hexagon",
  "octagon",
];
const SHUFFLE_PUPILS: QRStyle["pupilShape"][] = [
  "dot",
  "square",
  "diamond",
  "cross",
  "hexagon",
  "octagon",
  "shield",
  "star",
  "heart",
  "blob",
  "dome",
  "oval",
  "pentagon",
  "scallop",
  "cloud",
  "droplet",
];
const SHUFFLE_PIXELS: QRStyle["pixelShape"][] = [
  "sharp",
  "soft",
  "round",
  "dots",
  "liquid",
  "glued",
  "smooth",
  "flow",
  "blob",
  "diamond",
  "cross",
  "star",
  "triangle",
  "hexagon",
  "plus",
  "heart",
  "sparkle",
  "pinched-square",
  "circuit-board",
  "hashtag",
  "vertical-line",
  "horizontal-line",
];

const QR_TYPES: { id: QRType; label: string }[] = [
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

// ─── Tab definitions ─────────────────────────────────────────────────────────
type TabId =
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

const TOP_TABS: { id: TabId; icon: typeof QrCode; label: string }[] = [
  { id: "generate", icon: QrCode, label: "Generate" },
  { id: "style", icon: Palette, label: "Style" },
  { id: "adjust", icon: SlidersHorizontal, label: "Adjust" },
  { id: "batch", icon: Layers, label: "Batch" },
  { id: "templates", icon: Bookmark, label: "Templates" },
  { id: "history", icon: History, label: "History" },
];

const BOTTOM_TABS: { id: TabId; icon: typeof History; label: string }[] = [
  { id: "settings", icon: Settings, label: "Settings" },
  { id: "about", icon: Info, label: "About" },
  { id: "info", icon: Cpu, label: "Info" },
  { id: "support", icon: LifeBuoy, label: "Support" },
];

// ─── Templates persistence ───────────────────────────────────────────────────
interface Template {
  id: string;
  name: string;
  style: QRStyle;
}

function loadTemplates(): Template[] {
  try {
    const raw = localStorage.getItem("curium_templates");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTemplatesToStorage(templates: Template[]) {
  localStorage.setItem("curium_templates", JSON.stringify(templates));
}

// ─── History persistence ─────────────────────────────────────────────────────
interface HistoryEntry {
  id: string;
  data: string;
  style: QRStyle;
  svg: string;
  createdAt: number;
}

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem("curium_history");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistoryToStorage(history: HistoryEntry[]) {
  localStorage.setItem("curium_history", JSON.stringify(history));
}

// ─── Tab Panels ──────────────────────────────────────────────────────────────

function GeneratePanel({
  activeType,
  setActiveType,
  forms,
  updateForm,
}: {
  activeType: QRType;
  setActiveType: (t: QRType) => void;
  forms: FormState;
  updateForm: <K extends keyof FormState>(
    type: K,
    partial: Partial<FormState[K]>,
  ) => void;
}) {
  return (
    <>
      <div className="section">
        <div className="section-title">QR Type</div>
        <div className="btn-row">
          {QR_TYPES.map((t) => (
            <button
              key={t.id}
              className={`btn ${activeType === t.id ? "btn-primary" : ""}`}
              onClick={() => setActiveType(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-title">Data</div>
        {activeType === "url" && (
          <input
            className="input"
            placeholder="https://example.com"
            value={forms.url.url}
            onChange={(e) => updateForm("url", { url: e.target.value })}
          />
        )}
        {activeType === "text" && (
          <textarea
            className="input"
            placeholder="Enter any text..."
            value={forms.text.text}
            onChange={(e) => updateForm("text", { text: e.target.value })}
            rows={4}
          />
        )}
        {activeType === "email" && (
          <div className="input-group">
            <input
              className="input"
              placeholder="To"
              value={forms.email.to}
              onChange={(e) => updateForm("email", { to: e.target.value })}
            />
            <input
              className="input"
              placeholder="Subject"
              value={forms.email.subject}
              onChange={(e) => updateForm("email", { subject: e.target.value })}
            />
            <textarea
              className="input"
              placeholder="Body"
              value={forms.email.body}
              onChange={(e) => updateForm("email", { body: e.target.value })}
              rows={2}
            />
          </div>
        )}
        {activeType === "phone" && (
          <input
            className="input"
            placeholder="+1 234 567 890"
            value={forms.phone.phone}
            onChange={(e) => updateForm("phone", { phone: e.target.value })}
          />
        )}
        {activeType === "sms" && (
          <div className="input-group">
            <input
              className="input"
              placeholder="Phone"
              value={forms.sms.phone}
              onChange={(e) => updateForm("sms", { phone: e.target.value })}
            />
            <input
              className="input"
              placeholder="Message (optional)"
              value={forms.sms.message}
              onChange={(e) => updateForm("sms", { message: e.target.value })}
            />
          </div>
        )}
        {activeType === "wifi" && (
          <div className="input-group">
            <input
              className="input"
              placeholder="SSID"
              value={forms.wifi.ssid}
              onChange={(e) => updateForm("wifi", { ssid: e.target.value })}
            />
            <input
              className="input"
              placeholder="Password"
              value={forms.wifi.password}
              onChange={(e) => updateForm("wifi", { password: e.target.value })}
            />
            <div className="btn-row">
              {(["WPA", "WEP", "nopass"] as const).map((enc) => (
                <button
                  key={enc}
                  className={`btn ${forms.wifi.encryption === enc ? "btn-primary" : ""}`}
                  onClick={() => updateForm("wifi", { encryption: enc })}
                >
                  {enc === "nopass" ? "None" : enc}
                </button>
              ))}
            </div>
          </div>
        )}
        {activeType === "contact" && (
          <div className="input-group">
            <input
              className="input"
              placeholder="Name"
              value={forms.contact.name}
              onChange={(e) => updateForm("contact", { name: e.target.value })}
            />
            <input
              className="input"
              placeholder="Phone"
              value={forms.contact.phone}
              onChange={(e) => updateForm("contact", { phone: e.target.value })}
            />
            <input
              className="input"
              placeholder="Email"
              value={forms.contact.email}
              onChange={(e) => updateForm("contact", { email: e.target.value })}
            />
            <input
              className="input"
              placeholder="Organization"
              value={forms.contact.org}
              onChange={(e) => updateForm("contact", { org: e.target.value })}
            />
          </div>
        )}
        {activeType === "location" && (
          <div className="input-group">
            <input
              className="input"
              placeholder="Latitude"
              value={forms.location.lat}
              onChange={(e) => updateForm("location", { lat: e.target.value })}
            />
            <input
              className="input"
              placeholder="Longitude"
              value={forms.location.lng}
              onChange={(e) => updateForm("location", { lng: e.target.value })}
            />
            <input
              className="input"
              placeholder="Label (optional)"
              value={forms.location.label}
              onChange={(e) =>
                updateForm("location", { label: e.target.value })
              }
            />
          </div>
        )}
        {activeType === "event" && (
          <div className="input-group">
            <input
              className="input"
              placeholder="Event title"
              value={forms.event.title}
              onChange={(e) => updateForm("event", { title: e.target.value })}
            />
            <input
              className="input"
              placeholder="Location (optional)"
              value={forms.event.location}
              onChange={(e) => updateForm("event", { location: e.target.value })}
            />
            <input
              className="input"
              type="datetime-local"
              placeholder="Start"
              value={forms.event.start}
              onChange={(e) => updateForm("event", { start: e.target.value })}
            />
            <input
              className="input"
              type="datetime-local"
              placeholder="End"
              value={forms.event.end}
              onChange={(e) => updateForm("event", { end: e.target.value })}
            />
            <textarea
              className="input"
              placeholder="Description (optional)"
              value={forms.event.description}
              onChange={(e) => updateForm("event", { description: e.target.value })}
              rows={2}
            />
          </div>
        )}
        {activeType === "otpauth" && (
          <div className="input-group">
            <input
              className="input"
              placeholder="Issuer (e.g. Google)"
              value={forms.otpauth.issuer}
              onChange={(e) => updateForm("otpauth", { issuer: e.target.value })}
            />
            <input
              className="input"
              placeholder="Account (e.g. user@email.com)"
              value={forms.otpauth.account}
              onChange={(e) => updateForm("otpauth", { account: e.target.value })}
            />
            <input
              className="input"
              placeholder="Secret key (base32)"
              value={forms.otpauth.secret}
              onChange={(e) => updateForm("otpauth", { secret: e.target.value })}
            />
            <div className="btn-row">
              {(["SHA1", "SHA256", "SHA512"] as const).map((a) => (
                <button
                  key={a}
                  className={`btn ${forms.otpauth.algorithm === a ? "btn-primary" : ""}`}
                  onClick={() => updateForm("otpauth", { algorithm: a })}
                >
                  {a}
                </button>
              ))}
            </div>
            <div className="btn-row">
              {([6, 8] as const).map((d) => (
                <button
                  key={d}
                  className={`btn ${forms.otpauth.digits === d ? "btn-primary" : ""}`}
                  onClick={() => updateForm("otpauth", { digits: d })}
                >
                  {d} digits
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function TemplatesPanel({
  templates,
  templateName,
  setTemplateName,
  onSave,
  onDelete,
  onApply,
}: {
  templates: Template[];
  templateName: string;
  setTemplateName: (s: string) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  onApply: (t: Template) => void;
}) {
  return (
    <>
      <div className="section">
        <div className="section-title">Save Current Style</div>
        <div className="btn-row">
          <input
            className="input"
            placeholder="Template name..."
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={onSave}>
            Save
          </button>
        </div>
      </div>
      {templates.length > 0 && (
        <div className="section">
          <div className="section-title">Saved ({templates.length})</div>
          <div className="list">
            {templates.map((t) => (
              <div
                key={t.id}
                className="list-item"
                onClick={() => onApply(t)}
                style={{ cursor: "pointer" }}
              >
                <div className="list-item-info">
                  <div className="list-item-value">{t.name}</div>
                </div>
                <button
                  className="btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(t.id);
                  }}
                  style={{ fontSize: 10, padding: "4px 8px" }}
                >
                  Del
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function HistoryPanel({
  history,
  onClear,
  onLoad,
  onApply,
}: {
  history: HistoryEntry[];
  onClear: () => void;
  onLoad: (entry: HistoryEntry) => void;
  onApply: (entry: HistoryEntry) => void;
}) {
  return (
    <>
      <div className="section">
        <div className="section-title">History ({history.length})</div>
        {history.length > 0 ? (
          <button className="btn btn-danger" onClick={onClear}>
            Clear All
          </button>
        ) : (
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            No history yet
          </p>
        )}
      </div>
      {history.length > 0 && (
        <div className="list">
          {history.map((h) => (
            <div key={h.id} className="list-item" onClick={() => onLoad(h)}>
              <div className="list-item-info">
                <div className="list-item-value" style={{ fontSize: 11 }}>
                  {h.data.length > 40 ? h.data.slice(0, 40) + "..." : h.data}
                </div>
                <div className="list-item-date">
                  {new Date(h.createdAt).toLocaleTimeString()}
                </div>
              </div>
              <button
                className="btn btn-sm"
                title="Load into editor"
                onClick={(e) => { e.stopPropagation(); onApply(h); }}
              >
                Load
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function SettingsPanel({
  theme,
  setTheme,
}: {
  theme: "dark" | "light" | "amoled" | "system";
  setTheme: (t: "dark" | "light" | "amoled" | "system") => void;
}) {
  return (
    <>
      <div className="section">
        <div className="section-title">Theme</div>
        <div className="btn-row">
          {(["system", "dark", "light", "amoled"] as const).map((t) => (
            <button
              key={t}
              className={`btn ${theme === t ? "btn-primary" : ""}`}
              onClick={() => setTheme(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="section">
        <div className="section-title">Keyboard Shortcuts</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "4px 0",
            }}
          >
            <span>Shuffle style</span>
            <kbd
              style={{
                background: "var(--bg)",
                padding: "2px 6px",
                borderRadius: 4,
                fontSize: 11,
              }}
            >
              Space
            </kbd>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "4px 0",
            }}
          >
            <span>Export SVG</span>
            <kbd
              style={{
                background: "var(--bg)",
                padding: "2px 6px",
                borderRadius: 4,
                fontSize: 11,
              }}
            >
              Ctrl+S
            </kbd>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "4px 0",
            }}
          >
            <span>Export PNG</span>
            <kbd
              style={{
                background: "var(--bg)",
                padding: "2px 6px",
                borderRadius: 4,
                fontSize: 11,
              }}
            >
              Ctrl+Shift+S
            </kbd>
          </div>
        </div>
      </div>
    </>
  );
}

function AboutPanel() {
  const PROBLEMS = [
    "Most QR tools inject tracking parameters into your codes",
    "They log every scan — time, location, device, referrer",
    "They sell this data to advertisers, or worse, leak it",
    "They lock basic features behind paywalls and subscriptions",
    "They require accounts for basic features like saving or customizing",
  ];
  const DIFFERENCES = [
    "Zero network requests — not even a ping",
    "No accounts, no sign-ups, no email collection",
    "No analytics, no telemetry, no crash reporting",
    "Full customization offline — colors, shapes, logos, eyes, etc.",
    "Open source — anyone can audit the code",
  ];

  return (
    <>
      <div className="section">
        <div className="section-title">What is this</div>
        <p
          style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.8 }}
        >
          Curium is a QR code generator, customizer, and scanner. It runs
          entirely on your device. No servers. No accounts. No cloud. Your QR
          codes, your data, your rules.
        </p>
      </div>
      <div className="section">
        <div className="section-title">Why it exists</div>
        <p
          style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.8 }}
        >
          Every QR code generator on the internet does the same thing: they let
          you create a code, then they track you, log your data, or serve you
          ads. Most of them are free because you are the product.
        </p>
        <p
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            lineHeight: 1.8,
            marginTop: 12,
          }}
        >
          Curium exists because a QR code is a simple thing. It does not need a
          server. It does not need your location. It does not need to phone
          home. It is math — and math works offline.
        </p>
      </div>
      <div className="section">
        <div className="section-title">The problem</div>
        <div className="point-list">
          {PROBLEMS.map((p, i) => (
            <div key={i} className="point-row">
              <XIcon size={14} className="point-icon-error" />
              <span className="point-text">{p}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="section">
        <div className="section-title">What Curium does differently</div>
        <div className="point-list">
          {DIFFERENCES.map((d, i) => (
            <div key={i} className="point-row">
              <Check size={14} className="point-icon-success" />
              <span className="point-text">{d}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="section">
        <div className="section-title">
          Against capitalism for simple things
        </div>
        <p
          style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.8 }}
        >
          A QR code is a 35-year-old standard. It is public domain math. The
          idea that companies can charge you for generating a QR code — or
          worse, track you for doing it — is absurd.
        </p>
        <p
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            lineHeight: 1.8,
            marginTop: 12,
          }}
        >
          Curium rejects the idea that every digital tool must be a SaaS
          product. Some things should just work. Some things should be free.
          Some things should respect your privacy by default, not as a premium
          feature.
        </p>
      </div>
      <div className="section">
        <div className="section-title">The future</div>
        <p
          style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.8 }}
        >
          Curium is not just an app. It is a statement. Every feature we ship
          proves that a tool can be powerful, beautiful, and free — without
          compromising your privacy.
        </p>
        <p
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            lineHeight: 1.8,
            marginTop: 12,
          }}
        >
          We are building the definitive QR tool. Not the one that makes the
          most money. The one that makes all others unnecessary.
        </p>
      </div>
    </>
  );
}

function InfoPanel() {
  const isTauri = typeof window !== "undefined" && !!(window as any).__TAURI__;

  return (
    <>
      <div className="section">
        <div className="section-title">Build</div>
        <div className="info-grid">
          <div className="info-row">
            <span className="info-label">Version</span>
            <span className="info-value">0.5.7</span>
          </div>
          <div className="info-row">
            <span className="info-label">Platform</span>
            <span className="info-value">
              {isTauri ? "Desktop (Tauri)" : "Desktop (Web)"}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Runtime</span>
            <span className="info-value">
              {isTauri ? "React + Tauri" : "React + rsbuild"}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Renderer</span>
            <span className="info-value">
              {isTauri
                ? navigator.userAgent.includes("Edg")
                  ? "WebView2"
                  : "WebKitGTK"
                : "Browser"}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Commit</span>
            <span className="info-value">
              {buildInfo.shortCommit}
              {buildInfo.isDirty ? " +" : ""}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Branch</span>
            <span className="info-value">{buildInfo.branch}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Built</span>
            <span className="info-value">
              {buildInfo.buildDate.split("T")[0]}
            </span>
          </div>
        </div>
      </div>
      <div className="section">
        <div className="section-title">Links</div>
        <div className="link-list">
          <a
            className="link-row"
            href="https://github.com/nylxar/curium"
            target="_blank"
            rel="noreferrer"
          >
            <span>Source Code</span>
            <ExternalLink size={14} />
          </a>
          <a
            className="link-row"
            href="https://github.com/nylxar/curium/issues"
            target="_blank"
            rel="noreferrer"
          >
            <span>Report an Issue</span>
            <ExternalLink size={14} />
          </a>
          <a
            className="link-row"
            href="https://x.com/nylxar"
            target="_blank"
            rel="noreferrer"
          >
            <span>Follow Nylxar</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
      <div className="section" style={{ textAlign: "center", marginTop: 24 }}>
        <p
          style={{
            fontSize: 10,
            color: "var(--text-faint)",
            letterSpacing: 0.5,
          }}
        >
          Made with cats · Open source · Free forever
        </p>
        <p
          style={{
            fontSize: 10,
            color: "var(--text-faint)",
            letterSpacing: 0.5,
            marginTop: 4,
          }}
        >
          &copy; {new Date().getFullYear()} Curium
        </p>
      </div>
    </>
  );
}

function SupportPanel() {
  const OPTIONS = [
    {
      icon: Coffee,
      label: "Ko-fi",
      url: "https://ko-fi.com/nylxar",
      color: "#FF5E5B",
    },
    {
      icon: CreditCard,
      label: "PayPal",
      url: "https://www.paypal.com/ncp/payment/DUAR5EJ7A3RV8",
      color: "#003087",
    },
    {
      icon: CreditCard,
      label: "Gumroad",
      url: "https://nylxar.gumroad.com/coffee",
      color: "#FF90E8",
    },
  ];

  return (
    <>
      <div
        className="section"
        style={{ textAlign: "center", marginBottom: 24 }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            background: "var(--primary-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 12px",
          }}
        >
          <LifeBuoy size={24} style={{ color: "var(--primary)" }} />
        </div>
        <div className="section-title" style={{ marginBottom: 4 }}>
          Support Curium
        </div>
        <p
          style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}
        >
          If Curium saved you from another bloat, spyware, data-hungry,
          ad-filled QR tool, then consider supporting its development.
        </p>
      </div>
      <div className="link-list">
        {OPTIONS.map((opt, i) => (
          <a
            key={i}
            className="link-row"
            href={opt.url}
            target="_blank"
            rel="noreferrer"
          >
            <opt.icon size={16} style={{ color: opt.color }} />
            <span>{opt.label}</span>
            <ExternalLink
              size={14}
              style={{ marginLeft: "auto", opacity: 0.4 }}
            />
          </a>
        ))}
      </div>
      <p
        style={{
          fontSize: 11,
          color: "var(--text-faint)",
          textAlign: "center",
          marginTop: 24,
          lineHeight: 1.6,
        }}
      >
        Every contribution helps in introducing new features and customizations.
      </p>
    </>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  const [theme, setTheme] = useState<"dark" | "light" | "amoled" | "system">(
    () => {
      try {
        const stored = localStorage.getItem("curium_theme");
        if (
          stored === "dark" ||
          stored === "light" ||
          stored === "amoled" ||
          stored === "system"
        )
          return stored;
      } catch {}
      return "dark";
    },
  );
  const [resolvedTheme, setResolvedTheme] = useState<
    "dark" | "light" | "amoled"
  >("dark");
  const isTauri = useIsTauri();
  const shuffleBtnRef = useRef<HTMLButtonElement>(null);

  // Resolve system theme
  useEffect(() => {
    if (theme !== "system") {
      setResolvedTheme(theme);
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const resolve = () => setResolvedTheme(mq.matches ? "light" : "dark");
    resolve();
    mq.addEventListener("change", resolve);
    return () => mq.removeEventListener("change", resolve);
  }, [theme]);

  // Sync resolved theme to body, html, and .app
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    document.body.setAttribute("data-theme", resolvedTheme);
    document.body.style.background = "";
    localStorage.setItem("curium_theme", theme);
    animateThemeTransition();
  }, [resolvedTheme, theme]);

  // Onboarding: show welcome → whats-new on first launch
  const [onboarding, setOnboarding] = useState<"welcome" | "whatsnew" | "done">(
    () => {
      try {
        if (!localStorage.getItem("curium_onboarded")) return "welcome";
        if (localStorage.getItem("curium_last_seen_version") !== "0.5.7")
          return "whatsnew";
      } catch {}
      return "done";
    },
  );

  const [activeTab, setActiveTab] = useState<TabId>("generate");
  const sidePanelRef = useRef<HTMLDivElement>(null);

  // Snappy tab transition (150ms)
  useEffect(() => {
    if (!sidePanelRef.current) return;
    gsap.fromTo(
      sidePanelRef.current,
      { opacity: 0.5, y: 4 },
      { opacity: 1, y: 0, duration: 0.15, ease: "power2.out" },
    );
  }, [activeTab]);
  const [activeType, setActiveType] = useState<QRType>("text");
  const [forms, setForms] = useState<FormState>(DEFAULT_FORMS);
  const [qrStyle, setQrStyle] = useState<QRStyle>(DEFAULT_QR_STYLE);
  const [templates, setTemplates] = useState<Template[]>(loadTemplates);
  const [templateName, setTemplateName] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  const skipHistorySave = useRef(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ── Batch state ────────────────────────────────────────────────────────────
  const [batchInput, setBatchInput] = useState("");
  const [batchExporting, setBatchExporting] = useState(false);
  const [batchStyles, setBatchStyles] = useState<QRStyle[]>([]);

  interface BatchEntry {
    id: string;
    name: string;
    data: string;
  }

  const batchEntries = useMemo<BatchEntry[]>(() => {
    const lines = batchInput.split("\n").map((l) => l.trim()).filter(Boolean);
    return lines.map((data, i) => ({
      id: `${i}-${data}`,
      name: `qr-${i + 1}`,
      data,
    }));
  }, [batchInput]);

  const batchSvgs = useMemo(() => {
    return batchEntries.map((e, i) => ({
      ...e,
      svg: e.data
        ? generateSVG(e.data, batchStyles[i] ?? qrStyle, 256, false)
        : null,
    }));
  }, [batchEntries, qrStyle, batchStyles]);

  const doBatchExport = useCallback(
    async (format: "svg" | "png") => {
      if (batchSvgs.length === 0) return;
      setBatchExporting(true);
      try {
        const files: Record<string, Uint8Array> = {};
        const ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
        const dir = `curium-batch-${ts}`;

        for (const e of batchSvgs) {
          if (!e.svg) continue;
          const name = e.name.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40);

          if (format === "svg") {
            files[`${dir}/${name}.svg`] = strToU8(e.svg);
          } else {
            const canvas = document.createElement("canvas");
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext("2d");
            if (!ctx) continue;
            const img = new Image();
            const blob = new Blob([e.svg], { type: "image/svg+xml" });
            const url = URL.createObjectURL(blob);
            await new Promise<void>((resolve) => {
              img.onload = () => {
                ctx.drawImage(img, 0, 0, 512, 512);
                URL.revokeObjectURL(url);
                canvas.toBlob((pngBlob) => {
                  if (pngBlob)
                    pngBlob.arrayBuffer().then((buf) => {
                      files[`${dir}/${name}.png`] = new Uint8Array(buf);
                    });
                  resolve();
                }, "image/png");
              };
              img.onerror = () => {
                URL.revokeObjectURL(url);
                resolve();
              };
              img.src = url;
            });
          }
        }

        const zipped = zipSync(files, { level: 0 });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(
          new Blob([zipped], { type: "application/zip" }),
        );
        a.download = `curium-batch-${ts}.zip`;
        a.click();
        URL.revokeObjectURL(a.href);
      } finally {
        setBatchExporting(false);
      }
    },
    [batchSvgs],
  );

  const handleBatchCSVImport = useCallback((imported: BatchEntry[]) => {
    const lines = imported.map((e) => e.data);
    setBatchInput(lines.join("\n"));
  }, []);

  const handleBatchStyleShuffle = useCallback(() => {
    const count = batchEntries.length;
    if (count === 0) return;
    const styles: QRStyle[] = Array.from({ length: count }, () => {
      const r = QR_COLORS[Math.floor(Math.random() * QR_COLORS.length)];
      const eye = SHUFFLE_EYES[Math.floor(Math.random() * SHUFFLE_EYES.length)];
      const pupil =
        SHUFFLE_PUPILS[Math.floor(Math.random() * SHUFFLE_PUPILS.length)];
      const pixel =
        SHUFFLE_PIXELS[Math.floor(Math.random() * SHUFFLE_PIXELS.length)];
      return {
        ...qrStyle,
        colorId: r.id,
        fgColor: r.fg,
        bgColor: r.bg,
        eyeColor: r.fg,
        pupilColor: r.fg,
        eyeShape: eye,
        pupilShape: pupil,
        pixelShape: pixel,
      };
    });
    setBatchStyles(styles);
  }, [batchEntries.length, qrStyle]);

  const qrValue = useMemo(
    () => encodeQR(activeType, forms),
    [activeType, forms],
  );

  const svg = useMemo(
    () =>
      qrValue ? generateSVG(qrValue, qrStyle, 512, !!qrStyle.logoUri) : null,
    [qrValue, qrStyle],
  );

  // Export SVG always includes the logo
  const exportSvg = useMemo(
    () => (qrValue ? generateSVG(qrValue, qrStyle, 512, false) : null),
    [qrValue, qrStyle],
  );

  const doExportSVG = useCallback(() => {
    if (!exportSvg) return;
    const ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
    const blob = new Blob([exportSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `curium-qr-${ts}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportSvg]);

  const doExportPNG = useCallback(() => {
    if (!exportSvg) return;
    const ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    const blob = new Blob([exportSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 1024, 1024);
      URL.revokeObjectURL(url);
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) return;
        const pngUrl = URL.createObjectURL(pngBlob);
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = `curium-qr-${ts}.png`;
        a.click();
        URL.revokeObjectURL(pngUrl);
      }, "image/png");
    };
    img.src = url;
  }, [exportSvg]);

  // Save to history — debounced: waits for user to stop typing/adjusting
  const lastSavedData = useRef<string>("");
  const lastSavedStyleKey = useRef<string>("");
  const historyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestQrValue = useRef(qrValue);
  const latestQrStyle = useRef(qrStyle);
  const latestSvg = useRef(svg);
  latestQrValue.current = qrValue;
  latestQrStyle.current = qrStyle;
  latestSvg.current = svg;

  useEffect(() => {
    if (skipHistorySave.current || !svg || !qrValue) return;
    const styleKey = JSON.stringify(qrStyle);
    const dataChanged = lastSavedData.current !== qrValue;
    const styleChanged = lastSavedStyleKey.current !== styleKey;

    if (!dataChanged && !styleChanged) return;

    if (historyTimer.current) clearTimeout(historyTimer.current);

    historyTimer.current = setTimeout(() => {
      if (skipHistorySave.current) return;
      const curValue = latestQrValue.current;
      const curStyle = latestQrStyle.current;
      const curSvg = latestSvg.current;
      const curStyleKey = JSON.stringify(curStyle);

      // Update saved markers AFTER dedup check, not before.
      // This ensures rapid field edits (e.g. filling event form) only
      // produce one history entry — the timer resets on each keystroke,
      // and only the final state after the user stops typing is saved.
      if (
        lastSavedData.current === curValue &&
        lastSavedStyleKey.current === curStyleKey
      )
        return;
      lastSavedData.current = curValue;
      lastSavedStyleKey.current = curStyleKey;

      const entry: HistoryEntry = {
        id: Date.now().toString(),
        data: curValue,
        style: { ...curStyle },
        svg: curSvg ?? "",
        createdAt: Date.now(),
      };
      setHistory((prev) => {
        const prevKey =
          prev.length > 0
            ? prev[0].data + "|" + JSON.stringify(prev[0].style)
            : "";
        const key = curValue + "|" + curStyleKey;
        if (prevKey === key) return prev;
        return [entry, ...prev].slice(0, 100);
      });
    }, 5000);

    return () => {
      if (historyTimer.current) clearTimeout(historyTimer.current);
    };
  }, [svg, qrValue, qrStyle]);

  // Persist history to localStorage whenever it changes
  useEffect(() => {
    try {
      saveHistoryToStorage(history);
    } catch {}
  }, [history]);

  const updateStyle = useCallback(
    (partial: Partial<QRStyle>) => setQrStyle((s) => ({ ...s, ...partial })),
    [],
  );

  const updateForm = useCallback(
    <K extends keyof FormState>(type: K, partial: Partial<FormState[K]>) =>
      setForms((f) => ({ ...f, [type]: { ...f[type], ...partial } })),
    [],
  );

  const handleShuffle = useCallback(() => {
    if (shuffleBtnRef.current) bounceButton(shuffleBtnRef.current);
    const r = QR_COLORS[Math.floor(Math.random() * QR_COLORS.length)];
    const eye = SHUFFLE_EYES[Math.floor(Math.random() * SHUFFLE_EYES.length)];
    const pupil =
      SHUFFLE_PUPILS[Math.floor(Math.random() * SHUFFLE_PUPILS.length)];
    const pixel =
      SHUFFLE_PIXELS[Math.floor(Math.random() * SHUFFLE_PIXELS.length)];
    setQrStyle((p) => ({
      ...p,
      colorId: r.id,
      fgColor: r.fg,
      bgColor: r.bg,
      eyeColor: r.fg,
      pupilColor: r.fg,
      eyeShape: eye,
      pupilShape: pupil,
      pixelShape: pixel,
    }));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      )
        return;

      if (e.code === "Space" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleShuffle();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (e.shiftKey) doExportPNG();
        else doExportSVG();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleShuffle, doExportSVG, doExportPNG]);

  const saveTemplate = useCallback(() => {
    if (!templateName.trim()) return;
    const t: Template = {
      id: Date.now().toString(),
      name: templateName.trim(),
      style: { ...qrStyle },
    };
    const updated = [t, ...templates].slice(0, 50);
    setTemplates(updated);
    saveTemplatesToStorage(updated);
    setTemplateName("");
  }, [templateName, qrStyle, templates]);

  const deleteTemplate = useCallback(
    (id: string) => {
      const updated = templates.filter((t) => t.id !== id);
      setTemplates(updated);
      saveTemplatesToStorage(updated);
    },
    [templates],
  );

  const applyTemplate = useCallback((t: Template) => {
    setQrStyle({ ...t.style });
  }, []);

  const clearHistory = useCallback(() => {
    setConfirmOpen(true);
  }, []);

  const confirmClearHistory = useCallback(() => {
    setConfirmOpen(false);
    setHistory([]);
    saveHistoryToStorage([]);
  }, []);

  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<HistoryEntry | null>(null);

  const switchTab = useCallback((tab: TabId) => {
    setSelectedHistoryEntry(null);
    setActiveTab(tab);
  }, []);

  const loadHistoryEntry = useCallback((entry: HistoryEntry) => {
    setSelectedHistoryEntry(entry);
  }, []);

  const applyHistoryEntry = useCallback((entry: HistoryEntry) => {
    skipHistorySave.current = true;
    lastSavedData.current = entry.data;
    lastSavedStyleKey.current = JSON.stringify(entry.style);
    const decoded = decodeQR(entry.data);
    if (decoded) {
      setActiveType(decoded.type);
      setForms((f) => ({ ...f, [decoded.type]: decoded.form }));
    }
    setQrStyle({ ...entry.style });
    setSelectedHistoryEntry(null);
    setActiveTab("generate");
    setTimeout(() => {
      skipHistorySave.current = false;
    }, 500);
  }, []);

  const handleLogoPositionChange = useCallback(
    (pos: { x: number; y: number }) => {
      setQrStyle((s) => ({ ...s, logoPosition: pos }));
    },
    [],
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "generate":
        return (
          <GeneratePanel
            activeType={activeType}
            setActiveType={setActiveType}
            forms={forms}
            updateForm={updateForm}
          />
        );
      case "style":
        return <StylePanel style={qrStyle} onUpdate={updateStyle} />;
      case "adjust":
        return (
          <StylePanel style={qrStyle} onUpdate={updateStyle} section="adjust" />
        );
      case "batch":
        return (
          <BatchPanel
            input={batchInput}
            onInputChange={setBatchInput}
            entries={batchEntries}
            exporting={batchExporting}
            onExportSVG={() => doBatchExport("svg")}
            onExportPNG={() => doBatchExport("png")}
            onImportCSV={handleBatchCSVImport}
            onShuffleStyles={handleBatchStyleShuffle}
          />
        );
      case "templates":
        return (
          <TemplatesPanel
            templates={templates}
            templateName={templateName}
            setTemplateName={setTemplateName}
            onSave={saveTemplate}
            onDelete={deleteTemplate}
            onApply={applyTemplate}
          />
        );
      case "history":
        return (
          <HistoryPanel
            history={history}
            onClear={clearHistory}
            onLoad={loadHistoryEntry}
            onApply={applyHistoryEntry}
          />
        );
      case "settings":
        return <SettingsPanel theme={theme} setTheme={setTheme} />;
      case "about":
        return <AboutPanel />;
      case "info":
        return <InfoPanel />;
      case "support":
        return <SupportPanel />;
      default:
        return null;
    }
  };

  return (
    <div
      className="app"
      data-theme={resolvedTheme}
      {...(isTauri ? { "data-tauri": "" } : {})}
    >
      <Splash />
      {(onboarding === "whatsnew" || onboarding === "welcome") && (
        <WhatsNew
          onDone={() => {
            localStorage.setItem("curium_last_seen_version", "0.5.7");
            setOnboarding("done");
          }}
        />
      )}
      {onboarding === "welcome" && (
        <Welcome
          onDone={() => {
            localStorage.setItem("curium_onboarded", "true");
            setOnboarding("whatsnew");
          }}
        />
      )}
      {isTauri && <TitleBar />}
      {/* ── Tab Bar ── */}
      <div className="tab-bar">
        <div className="tab-bar-top">
          {TOP_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => switchTab(tab.id)}
                title={tab.label}
              >
                <Icon size={18} />
              </button>
            );
          })}
        </div>
        <div className="tab-bar-bottom">
          {BOTTOM_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => switchTab(tab.id)}
                title={tab.label}
              >
                <Icon size={18} />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Side Panel ── */}
      <div className="side-panel" ref={sidePanelRef}>
        <div className="app-brand">
          <span className="app-brand-name">Curium</span>
        </div>
        {renderTabContent()}
      </div>

      {/* ── Main Area ── */}
      <div className="main">
        {activeTab === "batch" ? (
          batchSvgs.length > 0 ? (
            <div className="batch-grid">
              {batchSvgs.map((e) =>
                e.svg ? (
                  <div key={e.id} className="batch-item" title={e.data}>
                    <div
                      className="batch-qr"
                      dangerouslySetInnerHTML={{ __html: e.svg }}
                    />
                    <div className="batch-label">{e.name}</div>
                  </div>
                ) : null,
              )}
            </div>
          ) : (
            <div className="batch-empty">
              Enter data in the side panel to generate batch QR codes
            </div>
          )
        ) : selectedHistoryEntry ? (
          <>
            <div className="qr-card qr-animate">
              <div className="qr-container">
                <QRPreview svg={selectedHistoryEntry.svg ?? ""} />
              </div>
            </div>
            <div className="history-detail-meta">
              <div className="history-detail-label">Data</div>
              <div className="history-detail-value">{selectedHistoryEntry.data}</div>
              <div className="history-detail-label" style={{ marginTop: 12 }}>Created</div>
              <div className="history-detail-value">
                {new Date(selectedHistoryEntry.createdAt).toLocaleString()}
              </div>
            </div>
            <div className="action-row">
              <button
                className="btn btn-primary"
                onClick={() => applyHistoryEntry(selectedHistoryEntry)}
              >
                Load into Editor
              </button>
            </div>
          </>
        ) : (
          <>
            <div className={`qr-card ${svg ? "qr-animate" : ""}`}>
              <div className="qr-container">
                <QRPreview svg={svg} />
                {qrStyle.logoUri && svg && (
                  <LogoOverlay
                    uri={qrStyle.logoUri}
                    style={qrStyle.logoStyle}
                    bgColor={qrStyle.bgColor}
                    initialPosition={qrStyle.logoPosition}
                    onPositionChange={handleLogoPositionChange}
                  />
                )}
              </div>
            </div>
            {svg && (
              <div className="action-row">
                <button
                  className="btn btn-icon"
                  ref={shuffleBtnRef}
                  onClick={handleShuffle}
                  title="Shuffle"
                >
                  <Shuffle size={16} />
                </button>
                <ExportBar
                  svg={exportSvg ?? svg}
                  input={qrValue}
                  onExportSVG={doExportSVG}
                  onExportPNG={doExportPNG}
                />
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Clear History"
        message="This will remove all history entries. This cannot be undone."
        confirmLabel="Clear All"
        onConfirm={confirmClearHistory}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
