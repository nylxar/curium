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
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { QR_COLORS } from "@/constants/theme";
import { Colors, Radius, FontSize, Spacing, Fonts } from "@/constants/theme";
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
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(selected ? 1.08 : 1, {
      damping: 14,
      stiffness: 240,
    });
  }, [selected]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      style={styles.swatchWrap}
    >
      <Animated.View style={animStyle}>
        <View
          style={[
            styles.swatch,
            { backgroundColor: item.bg },
            selected && { borderColor: item.fg, borderWidth: 2.5 },
          ]}
        >
          <View style={[styles.swatchInner, { backgroundColor: item.fg }]} />
          {selected && (
            <View style={styles.check}>
              <Ionicons name="checkmark" size={10} color={item.bg} />
            </View>
          )}
        </View>
      </Animated.View>
      <Text
        style={[styles.swatchLabel, selected && { color: item.fg }]}
        numberOfLines={1}
      >
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
    fontFamily: Fonts.monoMedium,
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
  swatchWrap: { alignItems: "center", gap: 5, width: 58 },
  swatch: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  swatchInner: { width: 22, height: 22, borderRadius: 11 },
  check: {
    position: "absolute",
    bottom: 3,
    right: 3,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  swatchLabel: {
    fontSize: 9,
    fontFamily: Fonts.mono,
    color: Colors.textFaint,
    textAlign: "center",
    width: 58,
  },
});
