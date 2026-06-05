import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  ReactNode,
} from "react";
import { StyleSheet, View } from "react-native";

export interface OverlayEntry {
  id: number;
  content: ReactNode;
}

interface OverlayContextValue {
  show: (content: ReactNode) => number;
  update: (id: number, content: ReactNode) => void;
  dismiss: (id: number) => void;
  dismissAll: () => void;
  overlays: OverlayEntry[];
}

const OverlayContext = createContext<OverlayContextValue | null>(null);

export function useOverlay() {
  const ctx = useContext(OverlayContext);
  if (!ctx) {
    throw new Error("useOverlay must be used within OverlayProvider");
  }
  return ctx;
}

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [overlays, setOverlays] = useState<OverlayEntry[]>([]);
  const counterRef = useRef(0);

  const show = useCallback((content: ReactNode): number => {
    counterRef.current += 1;
    const id = counterRef.current;
    setOverlays((prev) => [...prev, { id, content }]);
    return id;
  }, []);

  const update = useCallback((id: number, content: ReactNode) => {
    setOverlays((prev) =>
      prev.map((o) => (o.id === id ? { ...o, content } : o)),
    );
  }, []);

  const dismiss = useCallback((id: number) => {
    setOverlays((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setOverlays([]);
  }, []);

  return (
    <OverlayContext.Provider
      value={{ show, update, dismiss, dismissAll, overlays }}
    >
      {children}
    </OverlayContext.Provider>
  );
}

export function OverlayHost() {
  const { overlays } = useOverlay();
  if (overlays.length === 0) return null;
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { zIndex: 99999, elevation: 999 },
      ]}
      pointerEvents="box-none"
    >
      {overlays.map((o) => (
        <View
          key={o.id}
          style={StyleSheet.absoluteFill}
          pointerEvents="box-none"
        >
          {o.content}
        </View>
      ))}
    </View>
  );
}
