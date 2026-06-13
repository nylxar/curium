import AsyncStorage from "@react-native-async-storage/async-storage";

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

export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export async function saveSettings(partial: Partial<AppSettings>): Promise<void> {
  try {
    const current = await loadSettings();
    await AsyncStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ ...current, ...partial }),
    );
  } catch {}
}
