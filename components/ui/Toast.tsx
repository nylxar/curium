import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";

export type ToastType = "success" | "error" | "info";

const META: Record<
  ToastType,
  { icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  success: { icon: "checkmark-circle", color: "#22c55e" },
  error: { icon: "close-circle", color: "#ef4444" },
  info: { icon: "information-circle", color: "#60a5fa" },
};

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide: () => void;
}

export function Toast({
  visible,
  message,
  type = "info",
  duration = 2800,
  onHide,
}: ToastProps) {
  const insets = useSafeAreaInsets();
  const ty = useSharedValue(-80);
  const op = useSharedValue(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const dismiss = () => {
    ty.value = withTiming(-80, { duration: 250 });
    op.value = withTiming(0, { duration: 250 }, () => {
      scheduleOnRN(onHide);
    });
  };

  useEffect(() => {
    if (visible) {
      op.value = withTiming(1, { duration: 200 });
      ty.value = withSpring(0, { damping: 20, stiffness: 280, mass: 0.6 });
      clearTimeout(timer.current);
      timer.current = setTimeout(dismiss, duration);
    }
    return () => clearTimeout(timer.current);
  }, [visible, message]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateY: ty.value }],
  }));

  if (!visible) return null;
  const meta = META[type];

  return (
    <Animated.View
      style={[styles.wrap, { top: insets.top + Spacing.sm }, animStyle]}
    >
      <Ionicons name={meta.icon} size={18} color={meta.color} />
      <Text style={styles.msg} numberOfLines={2}>
        {message}
      </Text>
      <Pressable onPress={dismiss} hitSlop={14}>
        <Ionicons name="close" size={15} color="#666" />
      </Pressable>
    </Animated.View>
  );
}

export function useToast() {
  const [state, setState] = React.useState<{
    visible: boolean;
    message: string;
    type: ToastType;
  }>({ visible: false, message: "", type: "info" });

  const show = React.useCallback(
    (message: string, type: ToastType = "info") => {
      setState({ visible: true, message, type });
    },
    [],
  );

  const hide = React.useCallback(() => {
    setState((p) => ({ ...p, visible: false }));
  }, []);

  const node = (
    <Toast
      visible={state.visible}
      message={state.message}
      type={state.type}
      onHide={hide}
    />
  );

  return { show, node };
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.lg,
    backgroundColor: "#1c1b19",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#333",
    zIndex: 9999,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 14,
  },
  msg: { flex: 1, fontSize: FontSize.sm, fontFamily: Fonts.mono, color: "#ddd" },
});
