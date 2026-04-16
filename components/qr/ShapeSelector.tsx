import { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from "react-native-reanimated";
import Svg, { Rect, Circle, Path } from "react-native-svg";
import { EyeShape, PixelShape } from "@/types/qr";
import { EYE_SHAPES, PIXEL_SHAPES } from "@/constants/qrPresets";
import { Colors, Radius, FontSize, Spacing } from "@/constants/theme";
import * as Haptics from "expo-haptics";

// ─── Mini SVG previews for each shape ────────────────────────────────────────
function EyePreview({ shape, color }: { shape: EyeShape; color: string }) {
  const s = 28;
  switch (shape) {
    case "square":
      return (
        <Svg width={s} height={s} viewBox="0 0 28 28">
          <Rect
            x={1}
            y={1}
            width={26}
            height={26}
            fill="none"
            stroke={color}
            strokeWidth={3}
          />
          <Rect x={7} y={7} width={14} height={14} fill={color} />
        </Svg>
      );
    case "circle":
      return (
        <Svg width={s} height={s} viewBox="0 0 28 28">
          <Circle
            cx={14}
            cy={14}
            r={12}
            fill="none"
            stroke={color}
            strokeWidth={3}
          />
          <Circle cx={14} cy={14} r={6} fill={color} />
        </Svg>
      );
    case "rounded":
      return (
        <Svg width={s} height={s} viewBox="0 0 28 28">
          <Rect
            x={1}
            y={1}
            width={26}
            height={26}
            rx={6}
            fill="none"
            stroke={color}
            strokeWidth={3}
          />
          <Rect x={7} y={7} width={14} height={14} rx={3} fill={color} />
        </Svg>
      );
    case "extra-rounded":
      return (
        <Svg width={s} height={s} viewBox="0 0 28 28">
          <Rect
            x={1}
            y={1}
            width={26}
            height={26}
            rx={10}
            fill="none"
            stroke={color}
            strokeWidth={3}
          />
          <Rect x={7} y={7} width={14} height={14} rx={7} fill={color} />
        </Svg>
      );
    case "leaf":
      return (
        <Svg width={s} height={s} viewBox="0 0 28 28">
          <Path
            d="M2 14 Q2 2 14 2 Q26 2 26 14 Q26 26 14 26 Q2 26 2 14Z"
            fill="none"
            stroke={color}
            strokeWidth={3}
          />
          <Circle cx={14} cy={14} r={6} fill={color} />
        </Svg>
      );
    case "diamond":
      return (
        <Svg width={s} height={s} viewBox="0 0 28 28">
          <Path
            d="M14 2 L26 14 L14 26 L2 14Z"
            fill="none"
            stroke={color}
            strokeWidth={3}
          />
          <Path d="M14 9 L19 14 L14 19 L9 14Z" fill={color} />
        </Svg>
      );
  }
}

function PixelPreview({ shape, color }: { shape: PixelShape; color: string }) {
  const s = 28;
  switch (shape) {
    case "square":
      return (
        <Svg width={s} height={s} viewBox="0 0 28 28">
          <Rect x={2} y={2} width={10} height={10} fill={color} />
          <Rect x={16} y={2} width={10} height={10} fill={color} />
          <Rect x={2} y={16} width={10} height={10} fill={color} />
          <Rect x={16} y={16} width={10} height={10} fill={color} />
        </Svg>
      );
    case "circle":
    case "dots":
      return (
        <Svg width={s} height={s} viewBox="0 0 28 28">
          <Circle cx={7} cy={7} r={5} fill={color} />
          <Circle cx={21} cy={7} r={5} fill={color} />
          <Circle cx={7} cy={21} r={5} fill={color} />
          <Circle cx={21} cy={21} r={5} fill={color} />
        </Svg>
      );
    case "rounded":
      return (
        <Svg width={s} height={s} viewBox="0 0 28 28">
          <Rect x={2} y={2} width={10} height={10} rx={3} fill={color} />
          <Rect x={16} y={2} width={10} height={10} rx={3} fill={color} />
          <Rect x={2} y={16} width={10} height={10} rx={3} fill={color} />
          <Rect x={16} y={16} width={10} height={10} rx={3} fill={color} />
        </Svg>
      );
    case "classy":
      return (
        <Svg width={s} height={s} viewBox="0 0 28 28">
          <Path d="M2 7 L7 2 L12 2 L12 12 L2 12Z" fill={color} />
          <Path d="M16 2 L26 2 L26 7 L26 12 L16 12Z" fill={color} />
          <Rect x={2} y={16} width={10} height={10} fill={color} />
          <Path d="M16 16 L26 16 L26 26 L21 26 L16 21Z" fill={color} />
        </Svg>
      );
    case "classy-rounded":
      return (
        <Svg width={s} height={s} viewBox="0 0 28 28">
          <Rect x={2} y={2} width={10} height={10} rx={4} fill={color} />
          <Rect x={16} y={2} width={10} height={10} rx={4} fill={color} />
          <Rect x={2} y={16} width={10} height={10} rx={4} fill={color} />
          <Rect x={16} y={16} width={10} height={10} rx={4} fill={color} />
        </Svg>
      );
  }
}

// ─── Generic shape chip ───────────────────────────────────────────────────────
function ShapeChip<T extends string>({
  id,
  label,
  selected,
  onPress,
  children,
}: {
  id: T;
  label: string;
  selected: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(selected ? 1 : 0, {
      damping: 14,
      stiffness: 220,
    });
  }, [selected]);

  const animStyle = useAnimatedStyle(() => ({
    borderColor: progress.value === 1 ? Colors.primary : Colors.border,
    backgroundColor:
      progress.value > 0.5 ? Colors.primaryBg : Colors.surfaceOffset,
    transform: [{ scale: 0.95 + progress.value * 0.05 }],
  }));

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Animated.View style={[styles.chip, animStyle]}>
        {children}
        <Text style={[styles.chipLabel, selected && { color: Colors.primary }]}>
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Exports ──────────────────────────────────────────────────────────────────
export function EyeShapeSelector({
  selected,
  onChange,
  fgColor,
}: {
  selected: EyeShape;
  onChange: (s: EyeShape) => void;
  fgColor: string;
}) {
  return (
    <View>
      <Text style={styles.sectionTitle}>Eye Style</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {EYE_SHAPES.map((item) => (
          <ShapeChip
            key={item.id}
            id={item.id}
            label={item.label}
            selected={selected === item.id}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(item.id);
            }}
          >
            <EyePreview
              shape={item.id}
              color={selected === item.id ? fgColor : Colors.textMuted}
            />
          </ShapeChip>
        ))}
      </ScrollView>
    </View>
  );
}

export function PixelShapeSelector({
  selected,
  onChange,
  fgColor,
}: {
  selected: PixelShape;
  onChange: (s: PixelShape) => void;
  fgColor: string;
}) {
  return (
    <View>
      <Text style={styles.sectionTitle}>Pixel Style</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {PIXEL_SHAPES.map((item) => (
          <ShapeChip
            key={item.id}
            id={item.id}
            label={item.label}
            selected={selected === item.id}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(item.id);
            }}
          >
            <PixelPreview
              shape={item.id}
              color={selected === item.id ? fgColor : Colors.textMuted}
            />
          </ShapeChip>
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
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  chip: {
    alignItems: "center",
    gap: Spacing.xs,
    padding: Spacing.sm + 2,
    borderRadius: Radius.lg,
    borderWidth: 1,
    minWidth: 64,
  },
  chipLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: "600",
    textAlign: "center",
  },
});
