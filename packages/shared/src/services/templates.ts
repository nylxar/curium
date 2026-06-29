import { QRStyle, DEFAULT_QR_STYLE } from "../types/qr";
import { StorageBackend } from "../utils/storage";

export interface Template {
  id: string;
  name: string;
  createdAt: number;
  qrStyle: QRStyle;
}

const KEY = "curium_templates";

export function createTemplatesService(storage: StorageBackend) {
  async function loadTemplates(): Promise<Template[]> {
    try {
      const raw = await storage.getItem(KEY);
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

  async function saveTemplate(
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
      await storage.setItem(KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  }

  async function deleteTemplate(id: string): Promise<Template[]> {
    try {
      const existing = await loadTemplates();
      const updated = existing.filter((t) => t.id !== id);
      await storage.setItem(KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  }

  async function renameTemplate(
    id: string,
    name: string,
  ): Promise<Template[]> {
    try {
      const existing = await loadTemplates();
      const updated = existing.map((t) =>
        t.id === id ? { ...t, name } : t,
      );
      await storage.setItem(KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  }

  return { loadTemplates, saveTemplate, deleteTemplate, renameTemplate };
}
