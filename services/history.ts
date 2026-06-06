import { QRStyle, DEFAULT_QR_STYLE } from "@/types/qr";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface HistoryItem {
  id: string;
  type: string;
  value: string;
  createdAt: number;
  qrStyle: QRStyle;
}

const KEY = "curium_history";

export async function loadHistory(): Promise<HistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Migrate old items that have fgColor/bgColor instead of qrStyle,
    // and items whose saved qrStyle is missing newer fields (pupil,
    // frame, gradient, logoStyle).
    return parsed.map((item: any) => {
      let qrStyle: QRStyle;
      if (!item.qrStyle) {
        qrStyle = {
          ...DEFAULT_QR_STYLE,
          fgColor: item.fgColor ?? DEFAULT_QR_STYLE.fgColor,
          bgColor: item.bgColor ?? DEFAULT_QR_STYLE.bgColor,
        };
      } else {
        // Backfill any missing field with the current default so older
        // saved items render correctly after a schema change.
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

export async function saveToHistory(
  item: Omit<HistoryItem, "id" | "createdAt">,
): Promise<void> {
  try {
    const existing = await loadHistory();
    const newItem: HistoryItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
    const updated = [newItem, ...existing].slice(0, 100);
    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
  } catch {}
}

export async function deleteFromHistory(id: string): Promise<HistoryItem[]> {
  try {
    const existing = await loadHistory();
    const updated = existing.filter((i) => i.id !== id);
    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
