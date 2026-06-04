import { ReactNode } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Radius, Spacing, FontSize, Fonts } from "@/constants/theme";
import { AnimatedSheet } from "@/components/ui/AnimatedSheet";

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  tintColor: string;
  bgColor: string;
  children: ReactNode;
}

export function OptionSheet({
  visible,
  onClose,
  title,
  tintColor,
  bgColor,
  children,
}: Props) {
  return (
    <AnimatedSheet
      visible={visible}
      onClose={onClose}
      bgColor={bgColor}
      borderColor={tintColor + "25"}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: tintColor }]}>{title}</Text>
        <TouchableOpacity onPress={onClose} hitSlop={12}>
          <Ionicons
            name="close-circle"
            size={24}
            color={tintColor + "70"}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.body}>{children}</View>
    </AnimatedSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  title: { fontSize: FontSize.lg, fontFamily: Fonts.monoBold, fontWeight: "700" },
  body: { gap: Spacing.md },
});
