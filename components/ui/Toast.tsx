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

interface ConfirmEntry {
  id: number;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  danger: boolean;
  onConfirm: () => void;
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
  const [confirmEntry, setConfirmEntry] = useState<ConfirmEntry | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counterRef = useRef(0);

  const dismiss = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setToast(null);
  }, []);

  const dismissConfirm = useCallback(() => {
    setConfirmEntry(null);
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
      counterRef.current += 1;
      setConfirmEntry({
        id: counterRef.current,
        title,
        message,
        confirmLabel,
        cancelLabel: "Cancel",
        danger,
        onConfirm,
      });
    },
    [],
  );

  return (
    <ToastContext.Provider
      value={{ show, success, error, info, warning, confirm, dismiss }}
    >
      {children}
      {toast && <ToastView toast={toast} onDismiss={dismiss} />}
      {confirmEntry && (
        <ConfirmDialog entry={confirmEntry} onDismiss={dismissConfirm} />
      )}
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

  // Confirm dialog
  confirmWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.base,
    alignItems: "center",
  },
  confirmCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  confirmIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -Spacing.xs,
  },
  confirmTitle: {
    fontSize: FontSize.md,
    textAlign: "center",
  },
  confirmMessage: {
    fontSize: FontSize.sm,
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: Spacing.xs,
  },
  confirmActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    width: "100%",
    marginTop: Spacing.xs,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnLabel: {
    fontSize: FontSize.sm,
  },
});

// ─── Confirm dialog ───────────────────────────────────────────────────────────
// A real two-button dialog (Cancel + Confirm).  Replaces the previous toast-
// with-one-action approach, which had no way to cancel — users could only
// wait for the toast to time out or tap the destructive action by accident.
function ConfirmDialog({
  entry,
  onDismiss,
}: {
  entry: ConfirmEntry;
  onDismiss: () => void;
}) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const opacity = useSharedValue(0);
  const cardY = useSharedValue(24);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 140 });
    cardY.value = withTiming(0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
    cardOpacity.value = withTiming(1, { duration: 180 });
  }, []);

  const handleClose = (run: boolean) => {
    opacity.value = withTiming(0, { duration: 140 }, (f) => {
      if (f) runOnJS(onDismiss)();
    });
    cardY.value = withTiming(12, { duration: 160, easing: Easing.in(Easing.cubic) });
    cardOpacity.value = withTiming(0, { duration: 140 });
    if (run) {
      // Defer the confirm action slightly so the animation can start
      setTimeout(() => entry.onConfirm(), 60);
    }
  };

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardY.value }],
  }));

  const accent = entry.danger ? colors.error : colors.primary;

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(0,0,0,0.45)" },
          backdropStyle,
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => handleClose(false)} />
      </Animated.View>

      <View
        style={[
          styles.confirmWrap,
          { paddingBottom: insets.bottom + Spacing.lg },
        ]}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.confirmCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
            cardStyle,
          ]}
        >
          <View
            style={[
              styles.confirmIconWrap,
              { backgroundColor: accent + "18" },
            ]}
          >
            <Ionicons
              name={entry.danger ? "warning" : "help"}
              size={22}
              color={accent}
            />
          </View>
          <Text
            style={[
              styles.confirmTitle,
              { color: colors.text, fontFamily: Fonts.monoBold },
            ]}
          >
            {entry.title}
          </Text>
          {entry.message ? (
            <Text
              style={[
                styles.confirmMessage,
                { color: colors.textMuted, fontFamily: Fonts.mono },
              ]}
            >
              {entry.message}
            </Text>
          ) : null}
          <View style={styles.confirmActions}>
            <Pressable
              onPress={() => handleClose(false)}
              style={({ pressed }) => [
                styles.confirmBtn,
                {
                  backgroundColor: pressed
                    ? colors.surfaceOffset
                    : colors.bg,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.confirmBtnLabel,
                  { color: colors.text, fontFamily: Fonts.monoMedium },
                ]}
              >
                {entry.cancelLabel}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleClose(true)}
              style={({ pressed }) => [
                styles.confirmBtn,
                {
                  backgroundColor: pressed
                    ? accent
                    : accent,
                  borderColor: accent,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.confirmBtnLabel,
                  {
                    color: isDark ? "#000" : "#fff",
                    fontFamily: Fonts.monoBold,
                  },
                ]}
              >
                {entry.confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
