import { ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FontSize, Spacing, Radius } from "@/constants/theme";
import * as Haptics from "expo-haptics";
import { OptionSheet } from "./OptionSheet";

interface Props {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  preview?: ReactNode;
  children: ReactNode; // content shown INSIDE the sheet
  tintColor: string;
  bgColor: string; // ← add this
  sheetOpen: boolean; // ← controlled from parent
  onOpen: () => void;
  onClose: () => void;
}

export function OptionRow({
  label,
  iconName,
  preview,
  children,
  tintColor,
  bgColor,
  sheetOpen,
  onOpen,
  onClose,
}: Props) {
  return (
    <>
      <TouchableOpacity
        style={[styles.row, { borderColor: tintColor + "30" }]}
        onPress={() => {
          Haptics.selectionAsync();
          onOpen();
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.iconWrap, { backgroundColor: tintColor + "20" }]}>
          <Ionicons name={iconName} size={16} color={tintColor} />
        </View>
        <Text style={[styles.label, { color: tintColor }]}>{label}</Text>
        <View style={styles.right}>
          {preview}
          <Ionicons name="chevron-forward" size={16} color={tintColor + "50"} />
        </View>
      </TouchableOpacity>

      <OptionSheet
        visible={sheetOpen}
        onClose={onClose}
        title={label}
        tintColor={tintColor}
        bgColor={bgColor}
      >
        {children}
      </OptionSheet>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.lg,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { flex: 1, fontSize: FontSize.base, fontWeight: "600" },
  right: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
});
