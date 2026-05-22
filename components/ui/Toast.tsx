import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";

type ToastType = "success" | "error" | "info";

interface ToastMsg {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastCtx {
  show: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastCtx>({ show: () => {} });

const TOAST_CONFIG: Record<ToastType, { icon: string; bg: string; color: string }> = {
  success: { icon: "checkmark-circle",  bg: "#18181b", color: "#4ade80" },
  error:   { icon: "close-circle",      bg: "#18181b", color: "#f87171" },
  info:    { icon: "information-circle", bg: "#18181b", color: "#60a5fa" },
};

function ToastItem({ msg, onDone }: { msg: ToastMsg; onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const opacity   = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-8)).current;
  const cfg = TOAST_CONFIG[msg.type];

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(opacity,    { toValue: 1, useNativeDriver: true, speed: 20 }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 20 }),
    ]).start();

    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -8, duration: 250, useNativeDriver: true }),
      ]).start(onDone);
    }, 2600);

    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: cfg.bg, top: insets.top + Spacing.sm },
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <Ionicons name={cfg.icon as any} size={18} color={cfg.color} />
      <Text style={[styles.toastText, { fontFamily: Fonts.mono }]}>
        {msg.message}
      </Text>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const counter = useRef(0);

  const show = useCallback((message: string, type: ToastType = "info") => {
    const id = ++counter.current;
    setToasts((p) => [...p, { id, message, type }]);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((p) => p.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toasts.map((msg) => (
        <ToastItem key={msg.id} msg={msg} onDone={() => remove(msg.id)} />
      ))}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full,
    zIndex: 9999,
    // subtle border
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.10)",
    // shadow
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  toastText: {
    color: "#fff",
    fontSize: FontSize.sm,
    fontWeight: "600",
  },
});
