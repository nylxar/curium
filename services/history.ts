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
    const now = Date.now();
    // If an item with the same value and type already exists, update its
    // qrStyle (and bump it to the top) instead of creating a duplicate.
    // This solves the "saved without logo" bug: the first auto-save fires
    // without the logo (2.5 s debounce), then the user picks a logo and
    // the second save merges into the existing entry rather than creating
    // a second entry without the logo at the top of the list.
    const idx = existing.findIndex(
      (i) => i.value === item.value && i.type === item.type,
    );
    if (idx >= 0) {
      const updated = existing.map((e, i) =>
        i === idx
          ? { ...e, qrStyle: item.qrStyle, createdAt: now }
          : e,
      );
      // Move the updated item to the top
      const [moved] = updated.splice(idx, 1);
      updated.unshift(moved);
      await AsyncStorage.setItem(KEY, JSON.stringify(updated.slice(0, 100)));
    } else {
      const newItem: HistoryItem = {
        ...item,
        id: now.toString(),
        createdAt: now,
      };
      const updated = [newItem, ...existing].slice(0, 100);
      await AsyncStorage.setItem(KEY, JSON.stringify(updated));
    }
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
