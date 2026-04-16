import { useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
  interpolateColor,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { QR_COLORS } from "@/constants/theme";
import { Colors, Radius, FontSize, Spacing } from "@/constants/theme";
import * as Haptics from "expo-haptics";

interface Props {
  selectedId: string;
  onSelect: (id: string, fg: string, bg: string) => void;
}

function ColorSwatch({
  item,
  selected,
  onPress,
}: {
  item: (typeof QR_COLORS)[number];
  selected: boolean;
  onPress: () => void;
}) {
  const progress = useSharedValue(selected ? 1 : 0);
  const borderScale = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(selected ? 1 : 0, {
      damping: 14,
      stiffness: 220,
    });
    borderScale.value = withSpring(selected ? 1 : 0, {
      damping: 12,
      stiffness: 200,
    });
  }, [selected]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: borderScale.value,
    transform: [{ scale: 0.85 + borderScale.value * 0.15 }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: progress.value }],
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={styles.swatchWrap}
    >
      {/* Outer glow ring */}
      <Animated.View
        style={[styles.ring, { borderColor: item.fg }, ringStyle]}
      />
      {/* Swatch */}
      <View style={[styles.swatch, { backgroundColor: item.bg }]}>
        <View style={[styles.swatchInner, { backgroundColor: item.fg }]} />
        {/* Check */}
        <Animated.View style={[styles.check, checkStyle]}>
          <Ionicons name="checkmark" size={11} color={item.bg} />
        </Animated.View>
      </View>
      <Text style={styles.swatchLabel} numberOfLines={1}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );
}

export function ColorPalette({ selectedId, onSelect }: Props) {
  return (
    <View>
      <Text style={styles.sectionTitle}>Color Presets</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {QR_COLORS.map((item) => (
          <ColorSwatch
            key={item.id}
            item={item}
            selected={selectedId === item.id}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(item.id, item.fg, item.bg);
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.textFaint,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginLeft: Spacing.base,
    marginBottom: Spacing.sm,
  },
  row: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  swatchWrap: { alignItems: "center", gap: 5, width: 56 },
  ring: {
    position: "absolute",
    top: -3,
    left: -3,
    width: 56,
    height: 56,
    borderRadius: Radius.lg + 4,
    borderWidth: 2,
  },
  swatch: {
    width: 50,
    height: 50,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  swatchInner: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  check: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  swatchLabel: {
    fontSize: 9,
    color: Colors.textFaint,
    textAlign: "center",
    width: 50,
  },
});
