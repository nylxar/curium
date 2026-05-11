import { QRStyle } from "@/types/qr";
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
    return raw ? JSON.parse(raw) : [];
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
