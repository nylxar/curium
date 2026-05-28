import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";
import type { QRStyle } from "@/types/qr";

// ── Animated Chip ──────────────────────────────────────────────────────────────
function AnimatedChip({
  label,
  active,
  tintColor,
  colors,
  onPress,
}: {
  label: string;
  active: boolean;
  tintColor: string;
  colors: ReturnType<typeof useTheme>["colors"];
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value, { damping: 12, stiffness: 250 }) }],
  }));

  return (
    <TouchableOpacity
      onPressIn={() => { scale.value = 0.92; }}
      onPressOut={() => { scale.value = 1; }}
      onPress={onPress}
      activeOpacity={0.72}
    >
      <Animated.View
        style={[
          styles.chip,
          { borderColor: active ? tintColor : colors.border },
          active && { backgroundColor: tintColor + "18" },
          animStyle,
        ]}
      >
        <Text
          style={[
            styles.chipLabel,
            {
              color: active ? tintColor : colors.textMuted,
              fontFamily: Fonts.mono,
              fontWeight: active ? "700" : "400",
            },
          ]}
        >
          {label}
        </Text>
        {active && (
          <Ionicons name="checkmark" size={12} color={tintColor} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── Eye Shape Selector ────────────────────────────────────────────────────────
const EYE_SHAPES: QRStyle["eyeShape"][] = [
  "sharp", "soft", "round", "pill", "leaf", "diamond",
];

interface EyeShapeSelectorProps {
  selected:  QRStyle["eyeShape"];
  tintColor: string;
  onSelect:  (shape: QRStyle["eyeShape"]) => void;
}

export function EyeShapeSelector({ selected, tintColor, onSelect }: EyeShapeSelectorProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.grid}>
      {EYE_SHAPES.map((shape) => (
        <AnimatedChip
          key={shape}
          label={shape}
          active={selected === shape}
          tintColor={tintColor}
          colors={colors}
          onPress={() => onSelect(shape)}
        />
      ))}
    </View>
  );
}

// ── Pixel Shape Selector ──────────────────────────────────────────────────────
const PIXEL_SHAPES: QRStyle["pixelShape"][] = [
  "sharp", "soft", "round", "dots", "liquid", "glued",
];

interface PixelShapeSelectorProps {
  selected:  QRStyle["pixelShape"];
  tintColor: string;
  onSelect:  (shape: QRStyle["pixelShape"]) => void;
}

export function PixelShapeSelector({ selected, tintColor, onSelect }: PixelShapeSelectorProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.grid}>
      {PIXEL_SHAPES.map((shape) => (
        <AnimatedChip
          key={shape}
          label={shape}
          active={selected === shape}
          tintColor={tintColor}
          colors={colors}
          onPress={() => onSelect(shape)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipLabel: {
    fontSize: FontSize.xs,
    textTransform: "capitalize",
  },
});
