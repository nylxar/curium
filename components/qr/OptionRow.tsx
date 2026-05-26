import { ReactNode, useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
} from "react-native";
import Animated, { FadeInUp, LinearTransition } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";
import { PressableScale } from "@/components/ui/PressableScale";

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
      <PressableScale
        style={[
          styles.row,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={doOpen}
      >
        <View style={[styles.iconBox, { backgroundColor: tintColor + "18" }]}>
          <Ionicons name={iconName} size={18} color={tintColor} />
        </View>
        <Text
          style={[
            styles.label,
            { color: colors.text, fontFamily: Fonts.system },
          ]}
        >
          {label}
        </Text>
        <View style={styles.right}>
          {preview && <View>{preview}</View>}
          <Ionicons name="chevron-forward" size={14} color={colors.textFaint} />
        </View>
      </PressableScale>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={doClose}
      >
        <Pressable style={styles.backdrop} onPress={doClose} />
        <Animated.View
          entering={FadeInUp.duration(180)}
          layout={LinearTransition.duration(140)}
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
                { color: colors.text, fontFamily: Fonts.system },
              ]}
            >
              {label}
            </Text>
            <Pressable onPress={doClose} hitSlop={12}>
              <Ionicons
                name="close-circle"
                size={24}
                color={colors.textFaint}
              />
            </Pressable>
          </View>

          {/* Content */}
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 60,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { flex: 1, fontSize: FontSize.base, fontWeight: "600" },
  right: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.18)" },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
    gap: Spacing.md,
    maxHeight: "85%",
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center" },
  sheetHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  sheetTitle: { flex: 1, fontSize: FontSize.lg, fontWeight: "700" },
  content: { gap: Spacing.sm },
});
