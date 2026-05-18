import { ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";

interface OptionRowProps {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap; // matches existing index.tsx usage
  preview?: ReactNode;
  tintColor: string;
  bgColor?: string;
  onOpen: () => void;
  onClose: () => void;
  sheetOpen: boolean;
  children?: ReactNode;
}

export function OptionRow({
  label,
  iconName,
  preview,
  tintColor,
  bgColor,
  onOpen,
  onClose,
  sheetOpen,
  children,
}: OptionRowProps) {
  const { colors } = useTheme();
  const bg = bgColor ?? colors.surface;

  return (
    <View
      style={[
        styles.wrapper,
        { backgroundColor: bg, borderColor: colors.border },
      ]}
    >
      <TouchableOpacity
        style={styles.row}
        onPress={sheetOpen ? onClose : onOpen}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBox, { backgroundColor: tintColor + "18" }]}>
          <Ionicons name={iconName} size={18} color={tintColor} />
        </View>
        <Text
          style={[
            styles.label,
            { color: colors.text, fontFamily: Fonts.monoMedium },
          ]}
        >
          {label}
        </Text>
        <View style={styles.right}>
          {preview && <View>{preview}</View>}
          <Ionicons
            name={sheetOpen ? "chevron-up" : "chevron-down"}
            size={14}
            color={colors.textFaint}
          />
        </View>
      </TouchableOpacity>

      {sheetOpen && children && (
        <View style={[styles.expanded, { borderTopColor: colors.border }]}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { flex: 1, fontSize: FontSize.base },
  right: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  expanded: { padding: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
});
