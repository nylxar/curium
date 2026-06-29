import { QRStyle, DEFAULT_QR_STYLE } from "../types/qr";
import { StorageBackend } from "../utils/storage";

export interface HistoryItem {
  id: string;
  type: string;
  value: string;
  createdAt: number;
  qrStyle: QRStyle;
}

const KEY = "curium_history";

export function createHistoryService(storage: StorageBackend) {
  async function loadHistory(): Promise<HistoryItem[]> {
    try {
      const raw = await storage.getItem(KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return parsed.map((item: any) => {
        let qrStyle: QRStyle;
        if (!item.qrStyle) {
          qrStyle = {
            ...DEFAULT_QR_STYLE,
            fgColor: item.fgColor ?? DEFAULT_QR_STYLE.fgColor,
            bgColor: item.bgColor ?? DEFAULT_QR_STYLE.bgColor,
          };
        } else {
          qrStyle = {
            ...DEFAULT_QR_STYLE,
            ...item.qrStyle,
            qrCorners: item.qrStyle.qrCorners ?? DEFAULT_QR_STYLE.qrCorners,
            gradient: {
              ...DEFAULT_QR_STYLE.gradient,
              ...(item.qrStyle.gradient ?? {}),
            },
            logoStyle: {
              ...DEFAULT_QR_STYLE.logoStyle,
              ...(item.qrStyle.logoStyle ?? {}),
            },
          };
        }
        return { ...item, qrStyle };
      });
    } catch {
      return [];
    }
  }

  async function saveToHistory(
    item: Omit<HistoryItem, "id" | "createdAt">,
  ): Promise<void> {
    try {
      const existing = await loadHistory();
      const now = Date.now();
      const idx = existing.findIndex(
        (i) => i.value === item.value && i.type === item.type,
      );
      if (idx >= 0) {
        const updated = existing.map((e, i) =>
          i === idx
            ? { ...e, qrStyle: item.qrStyle, createdAt: now }
            : e,
        );
        const [moved] = updated.splice(idx, 1);
        updated.unshift(moved);
        await storage.setItem(KEY, JSON.stringify(updated.slice(0, 100)));
      } else {
        const newItem: HistoryItem = {
          ...item,
          id: now.toString(),
          createdAt: now,
        };
        const updated = [newItem, ...existing].slice(0, 100);
        await storage.setItem(KEY, JSON.stringify(updated));
      }
    } catch {}
  }

  async function deleteFromHistory(id: string): Promise<HistoryItem[]> {
    try {
      const existing = await loadHistory();
      const updated = existing.filter((i) => i.id !== id);
      await storage.setItem(KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  }

  async function clearHistory(): Promise<void> {
    await storage.removeItem(KEY);
  }

  return { loadHistory, saveToHistory, deleteFromHistory, clearHistory };
}
