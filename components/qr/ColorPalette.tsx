import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { QR_COLORS } from "@/constants/theme";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";

interface ColorPaletteProps {
  selectedId: string;
  onSelect: (id: string, fg: string, bg: string) => void;
}

export function ColorPalette({ selectedId, onSelect }: ColorPaletteProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {QR_COLORS.map((c) => {
        const isSelected = selectedId === c.id;
        return (
          <TouchableOpacity
            key={c.id}
            onPress={() => onSelect(c.id, c.fg, c.bg)}
            activeOpacity={0.75}
            style={[
              styles.swatch,
              { backgroundColor: c.bg },
              isSelected && { borderColor: colors.text, borderWidth: 2.5 },
              !isSelected && { borderColor: "transparent", borderWidth: 2.5 },
            ]}
          >
            {/* Foreground preview dot */}
            <View style={[styles.fgDot, { backgroundColor: c.fg }]} />
            {/* Selected checkmark */}
            {isSelected && (
              <View style={styles.checkWrap}>
                <Ionicons name="checkmark" size={10} color={c.bg} />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: 2,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  fgDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  checkWrap: {
    position: "absolute",
    bottom: 3,
    right: 3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
});
