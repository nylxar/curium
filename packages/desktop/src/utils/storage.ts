import type { HistoryEntry, Template } from "../types";

function isTauri() {
  return typeof window !== "undefined" && !!(window as any).__TAURI__;
}

async function getStore() {
  const Tauri = (window as any).__TAURI__;
  if (!Tauri) return null;
  const Store = Tauri?.store?.Store;
  if (!Store) return null;
  try {
    const store = await Store.load("data.json");
    return store;
  } catch {
    return null;
  }
}

export async function loadHistory(): Promise<HistoryEntry[]> {
  const store = await getStore();
  if (store) {
    try {
      return (await store.get("history")) ?? [];
    } catch {
      return [];
    }
  }
  try {
    const raw = localStorage.getItem("curium_history");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveHistoryToStorage(history: HistoryEntry[]) {
  const store = await getStore();
  if (store) {
    try {
      await store.set("history", history);
      await store.save();
      return;
    } catch {}
  }
  localStorage.setItem("curium_history", JSON.stringify(history));
}

export async function loadTemplates(): Promise<Template[]> {
  const store = await getStore();
  if (store) {
    try {
      return (await store.get("templates")) ?? [];
    } catch {
      return [];
    }
  }
  try {
    const raw = localStorage.getItem("curium_templates");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveTemplatesToStorage(templates: Template[]) {
  const store = await getStore();
  if (store) {
    try {
      await store.set("templates", templates);
      await store.save();
      return;
    } catch {}
  }
  localStorage.setItem("curium_templates", JSON.stringify(templates));
}
