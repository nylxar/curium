import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  interpolate,
} from "react-native-reanimated";
import { QR_COLORS } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { Radius, FontSize, Spacing, Fonts } from "@/constants/theme";
import * as Haptics from "expo-haptics";

interface Props {
  selectedId: string;
  onSelect: (id: string, fg: string, bg: string) => void;
}

const COLUMNS = 6;
const SWATCH_GAP = 10;
const CONTAINER_PADDING = Spacing.base;
const SWATCH_SIZE = 38;

function ColorSwatch({
  item,
  selected,
  onPress,
}: {
  item: (typeof QR_COLORS)[number];
  selected: boolean;
  onPress: () => void;
}) {
  const press = useSharedValue(0);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(press.value, [0, 1], [1, 0.9]) }],
  }));

  return (
    <TouchableOpacity
      onPressIn={() => {
        press.value = withTiming(1, { duration: 80 });
      }}
      onPressOut={() => {
        press.value = withTiming(0, { duration: 140 });
      }}
      onPress={onPress}
      activeOpacity={1}
      style={styles.swatchCell}
    >
      <Animated.View style={pressStyle}>
        <View
          style={[
            styles.swatch,
            { backgroundColor: item.bg },
            selected && {
              borderColor: item.fg,
              borderWidth: 2,
            },
          ]}
        >
          {/* Small fg dot in the center to indicate the color combo */}
          <View
            style={[
              styles.fgDot,
              { backgroundColor: item.fg },
            ]}
          />
        </View>
      </Animated.View>

      {/* Selection indicator dot below swatch */}
      <View style={styles.indicatorSlot}>
        {selected ? (
          <View
            style={[
              styles.indicatorDot,
              { backgroundColor: item.fg },
            ]}
          />
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export function ColorPalette({ selectedId, onSelect }: Props) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();

  // Center the grid: calculate left offset to center the row
  const totalGaps = SWATCH_GAP * (COLUMNS - 1);
  const gridWidth = SWATCH_SIZE * COLUMNS + totalGaps;
  const leftOffset = Math.max(0, (width - CONTAINER_PADDING * 2 - gridWidth) / 2);

  return (
    <View>
      <View style={[styles.header, { paddingHorizontal: CONTAINER_PADDING }]}>
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.textFaint, fontFamily: Fonts.mono },
          ]}
        >
          PRESETS
        </Text>
        <Text
          style={[
            styles.count,
            { color: colors.textFaint, fontFamily: Fonts.mono },
          ]}
        >
          {QR_COLORS.length}
        </Text>
      </View>

      <View
        style={[
          styles.grid,
          { paddingLeft: CONTAINER_PADDING + leftOffset, paddingRight: CONTAINER_PADDING },
        ]}
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    letterSpacing: 1.5,
    fontWeight: "600",
  },
  count: {
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.15)",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SWATCH_GAP,
    rowGap: Spacing.md,
  },
  swatchCell: {
    width: SWATCH_SIZE,
    alignItems: "center",
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  fgDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  indicatorSlot: {
    height: 6,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  indicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
