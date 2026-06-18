import { QRStyle, DEFAULT_QR_STYLE } from "@/types/qr";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Template {
  id: string;
  name: string;
  createdAt: number;
  qrStyle: QRStyle;
}

const KEY = "curium_templates";

export async function loadTemplates(): Promise<Template[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((item: any) => {
      const qrStyle: QRStyle = {
        ...DEFAULT_QR_STYLE,
        ...(item.qrStyle ?? {}),
        qrCorners: item.qrStyle?.qrCorners ?? DEFAULT_QR_STYLE.qrCorners,
        gradient: {
          ...DEFAULT_QR_STYLE.gradient,
          ...(item.qrStyle?.gradient ?? {}),
        },
        logoStyle: {
          ...DEFAULT_QR_STYLE.logoStyle,
          ...(item.qrStyle?.logoStyle ?? {}),
        },
      };
      return { ...item, qrStyle };
    });
  } catch {
    return [];
  }
}

export async function saveTemplate(
  name: string,
  qrStyle: QRStyle,
): Promise<Template[]> {
  try {
    const existing = await loadTemplates();
    const newTemplate: Template = {
      id: Date.now().toString(),
      name,
      createdAt: Date.now(),
      qrStyle: { ...qrStyle },
    };
    const updated = [newTemplate, ...existing].slice(0, 50);
    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export async function deleteTemplate(id: string): Promise<Template[]> {
  try {
    const existing = await loadTemplates();
    const updated = existing.filter((t) => t.id !== id);
    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export async function renameTemplate(
  id: string,
  name: string,
): Promise<Template[]> {
  try {
    const existing = await loadTemplates();
    const updated = existing.map((t) =>
      t.id === id ? { ...t, name } : t,
    );
    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}
