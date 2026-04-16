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

// ─── Eye SVG previews ─────────────────────────────────────────────────────────
function EyePreview({ shape, color }: { shape: EyeShape; color: string }) {
  const s = 30;
  switch (shape) {
    case "sharp":
      return (
        <Svg width={s} height={s} viewBox="0 0 30 30">
          <Rect
            x={1}
            y={1}
            width={28}
            height={28}
            fill="none"
            stroke={color}
            strokeWidth={3}
          />
          <Rect x={8} y={8} width={14} height={14} fill={color} />
        </Svg>
      );
    case "soft":
      return (
        <Svg width={s} height={s} viewBox="0 0 30 30">
          <Rect
            x={1}
            y={1}
            width={28}
            height={28}
            rx={5}
            fill="none"
            stroke={color}
            strokeWidth={3}
          />
          <Rect x={8} y={8} width={14} height={14} rx={3} fill={color} />
        </Svg>
      );
    case "round":
      return (
        <Svg width={s} height={s} viewBox="0 0 30 30">
          <Rect
            x={1}
            y={1}
            width={28}
            height={28}
            rx={10}
            fill="none"
            stroke={color}
            strokeWidth={3}
          />
          <Rect x={8} y={8} width={14} height={14} rx={6} fill={color} />
        </Svg>
      );
    case "pill":
      return (
        <Svg width={s} height={s} viewBox="0 0 30 30">
          <Circle
            cx={15}
            cy={15}
            r={13}
            fill="none"
            stroke={color}
            strokeWidth={3}
          />
          <Circle cx={15} cy={15} r={6} fill={color} />
        </Svg>
      );
    case "leaf":
      return (
        <Svg width={s} height={s} viewBox="0 0 30 30">
          <Path
            d="M2 15 Q2 2 15 2 Q28 15 15 28 Q2 28 2 15Z"
            fill="none"
            stroke={color}
            strokeWidth={3}
          />
          <Circle cx={15} cy={15} r={5} fill={color} />
        </Svg>
      );
    case "diamond":
      return (
        <Svg width={s} height={s} viewBox="0 0 30 30">
          <Path
            d="M15 2 L28 15 L15 28 L2 15Z"
            fill="none"
            stroke={color}
            strokeWidth={3}
          />
          <Path d="M15 10 L20 15 L15 20 L10 15Z" fill={color} />
        </Svg>
      );
  }
}

function PixelPreview({ shape, color }: { shape: PixelShape; color: string }) {
  const s = 30;
  switch (shape) {
    case "sharp":
      return (
        <Svg width={s} height={s} viewBox="0 0 30 30">
          <Rect x={1} y={1} width={11} height={11} fill={color} />
          <Rect x={18} y={1} width={11} height={11} fill={color} />
          <Rect x={1} y={18} width={11} height={11} fill={color} />
          <Rect x={18} y={18} width={11} height={11} fill={color} />
        </Svg>
      );
    case "soft":
      return (
        <Svg width={s} height={s} viewBox="0 0 30 30">
          <Rect x={1} y={1} width={11} height={11} rx={3} fill={color} />
          <Rect x={18} y={1} width={11} height={11} rx={3} fill={color} />
          <Rect x={1} y={18} width={11} height={11} rx={3} fill={color} />
          <Rect x={18} y={18} width={11} height={11} rx={3} fill={color} />
        </Svg>
      );
    case "round":
      return (
        <Svg width={s} height={s} viewBox="0 0 30 30">
          <Rect x={1} y={1} width={11} height={11} rx={5} fill={color} />
          <Rect x={18} y={1} width={11} height={11} rx={5} fill={color} />
          <Rect x={1} y={18} width={11} height={11} rx={5} fill={color} />
          <Rect x={18} y={18} width={11} height={11} rx={5} fill={color} />
        </Svg>
      );
    case "dots":
      return (
        <Svg width={s} height={s} viewBox="0 0 30 30">
          <Circle cx={6.5} cy={6.5} r={5.5} fill={color} />
          <Circle cx={23.5} cy={6.5} r={5.5} fill={color} />
          <Circle cx={6.5} cy={23.5} r={5.5} fill={color} />
          <Circle cx={23.5} cy={23.5} r={5.5} fill={color} />
        </Svg>
      );
    case "liquid":
      return (
        <Svg width={s} height={s} viewBox="0 0 30 30">
          <Rect x={1} y={1} width={11} height={11} rx={7} fill={color} />
          <Rect x={18} y={1} width={11} height={11} rx={7} fill={color} />
          <Rect x={1} y={18} width={11} height={11} rx={7} fill={color} />
          <Rect x={18} y={18} width={11} height={11} rx={7} fill={color} />
        </Svg>
      );
    case "glued":
      return (
        <Svg width={s} height={s} viewBox="0 0 30 30">
          <Path
            d="M1 6 Q1 1 6 1 L24 1 Q29 1 29 6 L29 24 Q29 29 24 29 L6 29 Q1 29 1 24Z"
            fill={color}
            opacity={0.25}
          />
          <Rect x={4} y={4} width={10} height={10} rx={4} fill={color} />
          <Rect x={16} y={4} width={10} height={10} rx={4} fill={color} />
          <Rect x={4} y={16} width={10} height={10} rx={4} fill={color} />
          <Rect x={16} y={16} width={10} height={10} rx={4} fill={color} />
        </Svg>
      );
  }
}

// ─── Shape chip — scale only, no color interpolation in worklet ───────────────
function ShapeChip({
  label,
  selected,
  onPress,
  color,
  children,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  color: string;
  children: React.ReactNode;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(selected ? 1.06 : 1, {
      damping: 14,
      stiffness: 220,
    });
  }, [selected]);

  // Border/bg color applied via JS style (not Reanimated worklet) — safe from warning
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Animated.View
        style={[
          styles.chip,
          animStyle,
          selected
            ? { borderColor: color, backgroundColor: color + "18" }
            : {
                borderColor: Colors.border,
                backgroundColor: Colors.surfaceOffset,
              },
        ]}
      >
        {children}
        <Text
          style={[
            styles.chipLabel,
            { color: selected ? color : Colors.textMuted },
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

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
            label={item.label}
            selected={selected === item.id}
            color={fgColor}
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
            label={item.label}
            selected={selected === item.id}
            color={fgColor}
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
    minWidth: 66,
  },
  chipLabel: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
});
