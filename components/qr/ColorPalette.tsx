import React from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";
import { QR_COLORS } from "@/constants/theme";
import { Spacing, Radius } from "@/constants/theme";

interface ColorPaletteProps {
  selectedId: string;
  onSelect: (id: string, fg: string, bg: string) => void;
}

function ColorSwatch({
  color,
  isSelected,
  onSelect,
}: {
  color: typeof QR_COLORS[number];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value, { damping: 12, stiffness: 250 }) }],
  }));

  return (
    <TouchableOpacity
      onPressIn={() => { scale.value = 1.15; }}
      onPressOut={() => { scale.value = 1; }}
      onPress={onSelect}
      activeOpacity={0.75}
    >
      <Animated.View
        style={[
          styles.swatch,
          { backgroundColor: color.bg },
          isSelected && { borderColor: "#fff", borderWidth: 2.5 },
          !isSelected && { borderColor: "transparent", borderWidth: 2.5 },
          animStyle,
        ]}
      >
        {/* Foreground preview dot */}
        <View style={[styles.fgDot, { backgroundColor: color.fg }]} />
        {/* Selected checkmark */}
        {isSelected && (
          <View style={[styles.checkWrap, { backgroundColor: color.fg + "cc" }]}>
            <Ionicons name="checkmark" size={10} color={color.bg} />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

export function ColorPalette({ selectedId, onSelect }: ColorPaletteProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {QR_COLORS.map((c) => (
        <ColorSwatch
          key={c.id}
          color={c}
          isSelected={selectedId === c.id}
          onSelect={() => onSelect(c.id, c.fg, c.bg)}
        />
      ))}
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
    alignItems: "center",
    justifyContent: "center",
  },
});
