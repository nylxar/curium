import type { HistoryEntry, Template } from "../types";

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem("curium_history");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHistoryToStorage(history: HistoryEntry[]) {
  localStorage.setItem("curium_history", JSON.stringify(history));
}

export function loadTemplates(): Template[] {
  try {
    const raw = localStorage.getItem("curium_templates");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTemplatesToStorage(templates: Template[]) {
  localStorage.setItem("curium_templates", JSON.stringify(templates));
}
