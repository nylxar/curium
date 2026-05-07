import { useState, ReactNode } from "react";
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
import { FontSize, Spacing, Radius } from "@/constants/theme";

// Enable LayoutAnimation on Android
if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

interface Props {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  preview?: ReactNode;
  children: ReactNode;
  tintColor: string;
  defaultOpen?: boolean;
}

export function OptionRow({
  label,
  iconName,
  preview,
  children,
  tintColor,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  const toggle = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        220,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity,
      ),
    );
    setOpen((p) => !p);
  };

  return (
    <View style={[styles.row, { borderColor: tintColor + "30" }]}>
      <TouchableOpacity
        style={styles.header}
        onPress={toggle}
        activeOpacity={0.7}
      >
        <View style={[styles.iconWrap, { backgroundColor: tintColor + "20" }]}>
          <Ionicons name={iconName} size={16} color={tintColor} />
        </View>
        <Text style={[styles.label, { color: tintColor }]}>{label}</Text>
        <View style={styles.right}>
          {preview}
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={16}
            color={tintColor + "80"}
          />
        </View>
      </TouchableOpacity>

      {open && <View style={styles.body}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    backgroundColor: "rgba(255,255,255,0.04)",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: "600",
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  body: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
  },
});
