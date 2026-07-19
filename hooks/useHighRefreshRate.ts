import { useEffect } from "react";
import { Platform } from "react-native";

/**
 * Applies the high refresh rate preference at runtime.
 *
 * On Android 11+ (API 30), uses preferredDisplayModeId to switch
 * the display to 120 Hz on capable panels. Reads/writes SharedPreferences
 * via the native HighRefreshRate module.
 *
 * On iOS, this is a no-op — iOS manages refresh rate automatically.
 */
export function useHighRefreshRate(enabled: boolean) {
  useEffect(() => {
    if (Platform.OS !== "android") return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const NativeModule = require("high-refresh-rate").default;
      NativeModule?.setEnabled?.(enabled);
    } catch {
      // Module not available (e.g. Expo Go, web)
    }
  }, [enabled]);
}

export function useHighRefreshRateSupported(): boolean {
  if (Platform.OS !== "android") return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const NativeModule = require("high-refresh-rate").default;
    return NativeModule?.isSupported?.() ?? false;
  } catch {
    return false;
  }
}

export function getHighRefreshRateEnabled(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const NativeModule = require("high-refresh-rate").default;
    return NativeModule?.isEnabled?.() ?? false;
  } catch {
    return false;
  }
}
