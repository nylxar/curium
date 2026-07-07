import type { QRType } from "@curium/shared";
import type { FormState } from "../types";

export function encodeQR(type: QRType, forms: FormState): string {
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
      const fmtDate = (d: string) => d ? d.replace(/[-: ]/g, "").replace(/(\d{8})T(\d{4})$/, "$1T$200") : "";
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

export function decodeQR(
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
    const startRaw = data.match(/DTSTART:(.+)/m)?.[1] ?? "";
    const endRaw = data.match(/DTEND:(.+)/m)?.[1] ?? "";
    const description = data.match(/DESCRIPTION:(.+)/m)?.[1] ?? "";
    const parseDate = (s: string) => {
      const m = s.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/);
      return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}` : s;
    };
    return { type: "event", form: { title, location, start: parseDate(startRaw), end: parseDate(endRaw), description } };
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
