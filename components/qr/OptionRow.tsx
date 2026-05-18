import { ReactNode, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";

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
  const insets = useSafeAreaInsets();
  // Support both controlled (external sheetOpen) and uncontrolled mode
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen ?? internalOpen;
  const doOpen = () => {
    setInternalOpen(true);
    onOpen?.();
  };
  const doClose = () => {
    setInternalOpen(false);
    onClose?.();
  };

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
        onPress={doOpen}
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
          <Ionicons name="chevron-forward" size={14} color={colors.textFaint} />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={doClose}
      >
        <Pressable style={styles.backdrop} onPress={doClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: insets.bottom + Spacing.lg,
              borderTopColor: colors.border,
            },
          ]}
        >
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <View
              style={[styles.iconBox, { backgroundColor: tintColor + "18" }]}
            >
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
            <TouchableOpacity onPress={doClose} hitSlop={12}>
              <Ionicons
                name="close-circle"
                size={24}
                color={colors.textFaint}
              />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>{children}</View>
        </View>
      </Modal>
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
  backdrop: { flex: 1, backgroundColor: "#00000060" },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
    gap: Spacing.md,
    maxHeight: "85%",
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center" },
  sheetHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  sheetTitle: { flex: 1, fontSize: FontSize.md },
  content: { gap: Spacing.sm },
});
