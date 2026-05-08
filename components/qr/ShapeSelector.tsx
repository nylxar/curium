// components/qr/ShapeSelector.tsx — full rewrite

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Spacing, Radius, FontSize } from "@/constants/theme";
import * as Haptics from "expo-haptics";
import { EyeShape, PixelShape } from "@/types/qr";
import Svg, { Rect, Circle, Path } from "react-native-svg";

// ─── Mini QR eye previews via SVG ────────────────────────────────────────────

function EyePreview({ shape, color }: { shape: EyeShape; color: string }) {
  const r: Record<EyeShape, number> = {
    sharp: 0,
    soft: 3,
    round: 12,
    pill: 10,
    leaf: 8,
    diamond: 4,
    shield: 8,
    dot: 12,
  };
  const radius = r[shape];
  return (
    <Svg width={32} height={32} viewBox="0 0 32 32">
      {/* Outer ring */}
      <Rect
        x={2}
        y={2}
        width={28}
        height={28}
        rx={radius}
        ry={radius}
        stroke={color}
        strokeWidth={3}
        fill="none"
      />
      {/* Inner fill */}
      <Rect
        x={9}
        y={9}
        width={14}
        height={14}
        rx={Math.max(0, radius - 3)}
        ry={Math.max(0, radius - 3)}
        fill={color}
      />
    </Svg>
  );
}

function PixelPreview({ shape, color }: { shape: PixelShape; color: string }) {
  const configs: Record<PixelShape, { r: number; s: number }> = {
    sharp: { r: 0, s: 8 },
    soft: { r: 2, s: 8 },
    round: { r: 4, s: 8 },
    dots: { r: 5, s: 7 },
    liquid: { r: 3, s: 7 },
    glued: { r: 1, s: 9 },
    diamond: { r: 2, s: 7 },
    cross: { r: 0, s: 6 },
    star: { r: 1, s: 6 },
  };
  const { r, s } = configs[shape];
  // 3x3 grid preview
  const positions = [0, 1, 2].flatMap((row) =>
    [0, 1, 2].map((col) => ({ x: col * 10 + 1, y: row * 10 + 1 })),
  );
  return (
    <Svg width={32} height={32} viewBox="0 0 32 32">
      {positions.map((pos, i) => (
        <Rect
          key={i}
          x={pos.x}
          y={pos.y}
          width={s}
          height={s}
          rx={r}
          ry={r}
          fill={color}
        />
      ))}
    </Svg>
  );
}

// ─── Selectors ────────────────────────────────────────────────────────────────

const EYE_OPTIONS: EyeShape[] = [
  "sharp",
  "soft",
  "round",
  "pill",
  "leaf",
  "diamond",
  "shield",
  "dot",
];
const PIXEL_OPTIONS: PixelShape[] = [
  "sharp",
  "soft",
  "round",
  "dots",
  "liquid",
  "glued",
  "diamond",
  "cross",
  "star",
];

const EYE_LABELS: Record<EyeShape, string> = {
  sharp: "Sharp",
  soft: "Soft",
  round: "Round",
  pill: "Pill",
  leaf: "Leaf",
  diamond: "Diamond",
  shield: "Shield",
  dot: "Dot",
};

const PIXEL_LABELS: Record<PixelShape, string> = {
  sharp: "Sharp",
  soft: "Soft",
  round: "Round",
  dots: "Dots",
  liquid: "Liquid",
  glued: "Glued",
  diamond: "Diamond",
  cross: "Cross",
  star: "Star",
};

interface EyeProps {
  selected: EyeShape;
  fgColor: string;
  onChange: (s: EyeShape) => void;
}
interface PixelProps {
  selected: PixelShape;
  fgColor: string;
  onChange: (s: PixelShape) => void;
}

function ShapeGrid<T extends string>({
  options,
  selected,
  fgColor,
  getLabel,
  renderPreview,
  onChange,
}: {
  options: T[];
  selected: T;
  fgColor: string;
  getLabel: (s: T) => string;
  renderPreview: (s: T) => React.ReactNode;
  onChange: (s: T) => void;
}) {
  return (
    <View style={styles.grid}>
      {options.map((shape) => {
        const active = shape === selected;
        return (
          <TouchableOpacity
            key={shape}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(shape);
            }}
            activeOpacity={0.7}
            style={[
              styles.cell,
              { borderColor: active ? fgColor : fgColor + "25" },
              active && { backgroundColor: fgColor + "18" },
            ]}
          >
            {renderPreview(shape)}
            <Text
              style={[
                styles.cellLabel,
                { color: active ? fgColor : fgColor + "90" },
              ]}
            >
              {getLabel(shape)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function EyeShapeSelector({ selected, fgColor, onChange }: EyeProps) {
  return (
    <ShapeGrid
      options={EYE_OPTIONS}
      selected={selected}
      fgColor={fgColor}
      getLabel={(s) => EYE_LABELS[s]}
      renderPreview={(s) => <EyePreview shape={s} color={fgColor} />}
      onChange={onChange}
    />
  );
}

export function PixelShapeSelector({
  selected,
  fgColor,
  onChange,
}: PixelProps) {
  return (
    <ShapeGrid
      options={PIXEL_OPTIONS}
      selected={selected}
      fgColor={fgColor}
      getLabel={(s) => PIXEL_LABELS[s]}
      renderPreview={(s) => <PixelPreview shape={s} color={fgColor} />}
      onChange={onChange}
    />
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  cell: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  cellLabel: {
    fontSize: FontSize.xs,
    fontWeight: "600",
  },
});
