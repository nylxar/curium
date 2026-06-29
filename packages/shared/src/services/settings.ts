import { StorageBackend } from "../utils/storage";

const SETTINGS_KEY = "@curium_settings";

export interface AppSettings {
  haptics: boolean;
  soundOnScan: boolean;
  autoCopy: boolean;
  keepScreenOn: boolean;
}

const DEFAULTS: AppSettings = {
  haptics: true,
  soundOnScan: false,
  autoCopy: false,
  keepScreenOn: false,
};

export function createSettingsService(storage: StorageBackend) {
  async function loadSettings(): Promise<AppSettings> {
    try {
      const raw = await storage.getItem(SETTINGS_KEY);
      if (!raw) return DEFAULTS;
      return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {
      return DEFAULTS;
    }
  }

  async function saveSettings(partial: Partial<AppSettings>): Promise<void> {
    try {
      const current = await loadSettings();
      await storage.setItem(
        SETTINGS_KEY,
        JSON.stringify({ ...current, ...partial }),
      );
    } catch {}
  }

  return { loadSettings, saveSettings };
}
