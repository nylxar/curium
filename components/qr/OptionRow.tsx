import { ReactNode } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";
import { AnimatedSheet } from "@/components/ui/AnimatedSheet";

interface OptionRowProps {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  preview?: ReactNode;
  tintColor: string;
  bgColor?: string;
  onOpen?: () => void;
  onClose?: () => void;
  sheetOpen?: boolean;
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
  sheetOpen: externalOpen,
  children,
}: OptionRowProps) {
  const { colors } = useTheme();

  return (
    <>
      <TouchableOpacity
        style={[
          styles.row,
          {
            backgroundColor: bgColor ?? colors.surface,
            borderColor: colors.border,
          },
        ]}
        onPress={onOpen}
        activeOpacity={0.6}
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
          <Ionicons name="chevron-forward" size={14} color={colors.textFaint} />
        </View>
      </TouchableOpacity>

      <AnimatedSheet
        visible={!!externalOpen}
        onClose={onClose ?? (() => {})}
        bgColor={colors.surface}
        borderColor={colors.border}
      >
        <View style={styles.sheetHeader}>
          <View style={[styles.iconBox, { backgroundColor: tintColor + "18" }]}>
            <Ionicons name={iconName} size={18} color={tintColor} />
          </View>
          <Text
            style={[
              styles.sheetTitle,
              { color: colors.text, fontFamily: Fonts.monoBold },
            ]}
          >
            {label}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Ionicons
              name="close-circle"
              size={24}
              color={colors.textFaint}
            />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </AnimatedSheet>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
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
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  sheetTitle: { flex: 1, fontSize: FontSize.md },
  scroll: { maxHeight: 500 },
  content: { gap: Spacing.sm, paddingBottom: Spacing.sm },
});
