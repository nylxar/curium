import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { Fonts, Spacing, Radius, FontSize } from "@/constants/theme";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

interface OptionRowProps {
  label:     string;
  iconName:  string;
  tintColor: string;
  children:  React.ReactNode;
  preview?:  React.ReactNode;
  onOpen?:   () => void;
  onClose?:  () => void;
}

export function OptionRow({
  label,
  iconName,
  tintColor,
  children,
  preview,
  onOpen,
  onClose,
}: OptionRowProps) {
  const [open, setOpen] = useState(false);
  const { colors } = useTheme();

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(220, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity),
    );
    const next = !open;
    setOpen(next);
    if (next) onOpen?.();
    else       onClose?.();
  }, [open, onOpen, onClose]);

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {/* Header row */}
      <TouchableOpacity
        onPress={toggle}
        activeOpacity={0.72}
        style={styles.header}
      >
        <View style={[styles.iconWrap, { backgroundColor: tintColor + "18" }]}>
          <Ionicons name={iconName as any} size={16} color={tintColor} />
        </View>
        <Text style={[styles.label, { color: colors.text, fontFamily: Fonts.mono }]}>
          {label}
        </Text>
        <View style={styles.headerRight}>
          {preview && !open && (
            <View style={styles.previewWrap}>{preview}</View>
          )}
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={16}
            color={colors.textFaint}
          />
        </View>
      </TouchableOpacity>

      {/* Expandable content */}
      {open && (
        <View style={[styles.content, { borderTopColor: colors.border }]}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  label:       { flex: 1, fontSize: FontSize.sm },
  headerRight: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  previewWrap: { alignItems: "center", justifyContent: "center" },
  content: {
    padding: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
