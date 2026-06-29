/**
 * Platform-agnostic storage backend interface.
 * Mobile wraps AsyncStorage, Desktop wraps tauri-plugin-store.
 */
export interface StorageBackend {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
