import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastAction {
  label: string;
  onPress: () => void;
}

export interface ToastOptions {
  title: string;
  message?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: ToastAction;
}

interface ToastEntry extends Required<Omit<ToastOptions, "message" | "action">> {
  id: number;
  message?: string;
  action?: ToastAction;
}

interface ToastContextValue {
  show: (opts: ToastOptions) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  confirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmLabel?: string,
    danger?: boolean,
  ) => void;
  dismiss: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

const VARIANT_META: Record<
  ToastVariant,
  { icon: keyof typeof Ionicons.glyphMap }
> = {
  success: { icon: "checkmark-circle" },
  error: { icon: "close-circle" },
  info: { icon: "information-circle" },
  warning: { icon: "warning" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastEntry | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counterRef = useRef(0);

  const dismiss = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setToast(null);
  }, []);

  const show = useCallback((opts: ToastOptions) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    counterRef.current += 1;
    const entry: ToastEntry = {
      id: counterRef.current,
      title: opts.title,
      message: opts.message,
      variant: opts.variant ?? "info",
      duration: opts.duration ?? 2400,
      action: opts.action,
    };
    setToast(entry);

    if (!entry.action) {
      timeoutRef.current = setTimeout(() => {
        setToast(null);
        timeoutRef.current = null;
      }, entry.duration);
    }
  }, []);

  const success = useCallback(
    (title: string, message?: string) => show({ title, message, variant: "success" }),
    [show],
  );
  const error = useCallback(
    (title: string, message?: string) => show({ title, message, variant: "error" }),
    [show],
  );
  const info = useCallback(
    (title: string, message?: string) => show({ title, message, variant: "info" }),
    [show],
  );
  const warning = useCallback(
    (title: string, message?: string) => show({ title, message, variant: "warning" }),
    [show],
  );

  const confirm = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      confirmLabel = "Confirm",
      danger = false,
    ) => {
      show({
        title,
        message,
        variant: danger ? "warning" : "info",
        duration: 6000,
        action: {
          label: confirmLabel,
          onPress: () => {
            onConfirm();
          },
        },
      });
    },
    [show],
  );

  return (
    <ToastContext.Provider
      value={{ show, success, error, info, warning, confirm, dismiss }}
    >
      {children}
      {toast && <ToastView toast={toast} onDismiss={dismiss} />}
    </ToastContext.Provider>
  );
}

function ToastView({
  toast,
  onDismiss,
}: {
  toast: ToastEntry;
  onDismiss: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const meta = VARIANT_META[toast.variant];

  // Simple slide-down + fade — iOS style
  const enterY = useSharedValue(-100);
  const enterOpacity = useSharedValue(0);

  useEffect(() => {
    enterY.value = withSpring(0, {
      damping: 26,
      stiffness: 320,
      mass: 0.8,
    });
    enterOpacity.value = withTiming(1, { duration: 180 });
  }, [toast.id]);

  const handleDismiss = () => {
    enterY.value = withTiming(-100, { duration: 200, easing: Easing.in(Easing.cubic) });
    enterOpacity.value = withTiming(0, { duration: 160 }, (f) => {
      if (f) runOnJS(onDismiss)();
    });
  };

  const containerStyle = useAnimatedStyle(() => ({
    opacity: enterOpacity.value,
    transform: [{ translateY: enterY.value }],
  }));

  // iOS uses a neutral white/grey color for icons in dark toasts
  const iconColor = "#ffffff";

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        { top: insets.top + Spacing.xs },
        containerStyle,
      ]}
    >
      <View style={styles.card}>
        {/* Icon */}
        <Ionicons name={meta.icon} size={20} color={iconColor} />

        {/* Text block */}
        <View style={styles.text}>
          <Text style={styles.title} numberOfLines={1}>
            {toast.title}
          </Text>
          {toast.message ? (
            <Text style={styles.message} numberOfLines={2}>
              {toast.message}
            </Text>
          ) : null}
        </View>

        {/* Optional action or close button */}
        {toast.action ? (
          <Pressable
            onPress={() => {
              toast.action?.onPress();
              handleDismiss();
            }}
            hitSlop={8}
            style={({ pressed }) => [
              styles.actionBtn,
              { opacity: pressed ? 0.5 : 1 },
            ]}
          >
            <Text style={styles.actionLabel}>{toast.action.label}</Text>
          </Pressable>
        ) : (
          <Pressable onPress={handleDismiss} hitSlop={8} style={styles.dismissBtn}>
            <Ionicons name="close" size={16} color="rgba(255,255,255,0.5)" />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: Spacing.base,
    right: Spacing.base,
    zIndex: 9999,
    elevation: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm + 2,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: 14,
    backgroundColor: "rgba(28, 28, 30, 0.96)",
    // iOS-style shadow
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  text: {
    flex: 1,
    gap: 1,
  },
  title: {
    fontSize: FontSize.sm,
    color: "#ffffff",
    fontFamily: Fonts.monoBold,
    letterSpacing: 0.1,
  },
  message: {
    fontSize: 12,
    color: "rgba(235, 235, 245, 0.62)",
    fontFamily: Fonts.mono,
    lineHeight: 16,
  },
  actionBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  actionLabel: {
    fontSize: FontSize.sm,
    color: "#0a84ff",
    fontFamily: Fonts.monoBold,
  },
  dismissBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
