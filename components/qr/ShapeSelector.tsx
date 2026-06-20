// components/qr/ShapeSelector.tsx
//
// Previews use the SAME path helpers as QRCanvas (via EyeShapePaths /
// PixelShapePath) so the picker is a faithful preview of the actual render.

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { EyeShape, PixelShape, PupilShape } from "@/types/qr";
import Svg, { Path } from "react-native-svg";
import { EyeShapePaths, PixelShapePath } from "./QRCanvas";

const PREVIEW_BOX = 32;
const PREVIEW_PAD = 4;

// ─── Mini QR eye previews via SVG ────────────────────────────────────────────

function EyePreview({ shape, color }: { shape: EyeShape; color: string }) {
  const outer = EyeShapePaths.outer(shape, PREVIEW_PAD, PREVIEW_PAD, 24);
  const inner = EyeShapePaths.innerCut(
    shape,
    PREVIEW_PAD,
    PREVIEW_PAD,
    24,
  );
  return (
    <Svg width={PREVIEW_BOX} height={PREVIEW_BOX} viewBox="0 0 32 32">
      <Path d={`${outer} ${inner}`} fill={color} fillRule="evenodd" />
    </Svg>
  );
}

// Pupil preview shows the pupil shape on its own.  32×32, centered, ~10px
// wide.
function PupilPreview({ shape, color }: { shape: PupilShape; color: string }) {
  if (shape === "none") {
    // Empty / hollow preview — show a thin dashed circle so the user
    // knows "this means no pupil".
    return (
      <Svg width={PREVIEW_BOX} height={PREVIEW_BOX} viewBox="0 0 32 32">
        <Path
          d="M16 4 a12 12 0 1 0 0.01 0"
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
      </Svg>
    );
  }
  const d = (() => {
    switch (shape) {
      case "dot":
        return `M16 6 a10 10 0 1 0 0.01 0`;
      case "square":
        return `M6 6h20v20h-20z`;
      case "ring":
        return `M16 6 a10 10 0 1 0 0.01 0 M16 11 a5 5 0 1 0 0.01 0`;
      case "cross":
        return PixelShapePath.cross(16, 16, 10);
      case "diamond":
        return PixelShapePath.diamond(16, 16, 9);
      case "star":
        return PixelShapePath.star(16, 16, 10);
      case "heart":
        return PixelShapePath.heart(16, 16, 10);
      case "hexagon":
        return PixelShapePath.hexagon(16, 16, 10);
      case "crescent":
        return "M16 6 A10 10 0 0 0 16 26 A9 9 0 0 1 16 6Z";
    }
  })();
  const fillRule =
    shape === "ring" ? "evenodd" : "nonzero";
  return (
    <Svg width={PREVIEW_BOX} height={PREVIEW_BOX} viewBox="0 0 32 32">
      <Path d={d} fill={color} fillRule={fillRule as any} />
    </Svg>
  );
}

function PixelPreview({ shape, color }: { shape: PixelShape; color: string }) {
  // 3x3 sample grid of the cell shape, with a small gap between cells.
  const cell = 8;
  const gap = 2;
  const step = cell + gap;
  const start = (PREVIEW_BOX - cell * 3 - gap * 2) / 2;
  const positions: Array<{ x: number; y: number }> = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      positions.push({ x: start + col * step, y: start + row * step });
    }
  }

  // Per-shape rendering — each shape draws a Path at the cell origin.
  const renderCell = (x: number, y: number): string => {
    const cx = x + cell / 2;
    const cy = y + cell / 2;
    switch (shape) {
      case "dots":
        return PixelShapePath.circle(cx, cy, cell * 0.42);
      case "diamond":
        return PixelShapePath.diamond(cx, cy, cell * 0.42);
      case "cross":
        return PixelShapePath.cross(cx, cy, cell * 0.5);
      case "star":
        return PixelShapePath.star(cx, cy, cell * 0.55);
      case "plus":
        return PixelShapePath.plus(cx, cy, cell * 0.5, cell * 0.16);
      case "triangle":
        return PixelShapePath.triangle(cx, cy, cell * 0.55);
      case "hexagon":
        return PixelShapePath.hexagon(cx, cy, cell * 0.5);
      case "heart":
        return PixelShapePath.heart(cx, cy, cell * 0.5);
      case "sparkle":
        return PixelShapePath.sparkle(cx, cy, cell * 0.5);
      case "chevron":
        return PixelShapePath.chevron(cx, cy, cell * 0.5);
      case "wave":
        return PixelShapePath.wave(cx, cy, cell * 0.85);
      case "sharp":
        return PixelShapePath.rect(x, y, cell, 0);
      case "soft":
        return PixelShapePath.rect(x + 0.5, y + 0.5, cell - 1, 1.5);
      case "round":
        return PixelShapePath.rect(x + 0.5, y + 0.5, cell - 1, 2.5);
      case "liquid":
        return PixelShapePath.rect(x + 0.5, y + 0.5, cell - 1, 2);
      case "glued":
        return PixelShapePath.rect(x, y, cell, 1.5);
    }
  };

  return (
    <Svg width={PREVIEW_BOX} height={PREVIEW_BOX} viewBox="0 0 32 32">
      {positions.map((pos, i) => (
        <Path key={i} d={renderCell(pos.x, pos.y)} fill={color} />
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
  "heart",
  "hexagon",
  "plus",
  "star",
  "octagon",
  "petal",
  "burst",
];
const PUPIL_OPTIONS: PupilShape[] = [
  "dot",
  "square",
  "ring",
  "cross",
  "diamond",
  "star",
  "heart",
  "hexagon",
  "crescent",
  "none",
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
  "triangle",
  "hexagon",
  "plus",
  "heart",
  "sparkle",
  "chevron",
  "wave",
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
  heart: "Heart",
  hexagon: "Hex",
  plus: "Plus",
  star: "Star",
  octagon: "Oct",
  petal: "Petal",
  burst: "Burst",
};

const PUPIL_LABELS: Record<PupilShape, string> = {
  dot: "Dot",
  square: "Square",
  ring: "Ring",
  cross: "Cross",
  diamond: "Diam",
  star: "Star",
  heart: "Heart",
  hexagon: "Hex",
  crescent: "Moon",
  none: "None",
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
  triangle: "Tri",
  hexagon: "Hex",
  plus: "Plus",
  heart: "Heart",
  sparkle: "Spark",
  chevron: "Chev",
  wave: "Wave",
};

interface EyeProps {
  selected: EyeShape;
  fgColor: string;
  onChange: (s: EyeShape) => void;
}
interface PupilProps {
  selected: PupilShape;
  fgColor: string;
  onChange: (s: PupilShape) => void;
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
  const { colors } = useTheme();
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
            activeOpacity={0.6}
            style={[
              styles.cell,
              {
                backgroundColor: active ? colors.primaryBg : colors.surface,
                borderColor: active ? fgColor : colors.border,
              },
            ]}
          >
            {renderPreview(shape)}
            <Text
              style={[
                styles.cellLabel,
                { color: active ? colors.text : colors.textMuted },
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
  const { colors } = useTheme();
  return (
    <ShapeGrid
      options={EYE_OPTIONS}
      selected={selected}
      fgColor={fgColor}
      getLabel={(s) => EYE_LABELS[s]}
      renderPreview={(s) => <EyePreview shape={s} color={colors.text} />}
      onChange={onChange}
    />
  );
}

export function PupilShapeSelector({ selected, fgColor, onChange }: PupilProps) {
  const { colors } = useTheme();
  return (
    <ShapeGrid
      options={PUPIL_OPTIONS}
      selected={selected}
      fgColor={fgColor}
      getLabel={(s) => PUPIL_LABELS[s]}
      renderPreview={(s) => <PupilPreview shape={s} color={colors.text} />}
      onChange={onChange}
    />
  );
}

export function PixelShapeSelector({
  selected,
  fgColor,
  onChange,
}: PixelProps) {
  const { colors } = useTheme();
  return (
    <ShapeGrid
      options={PIXEL_OPTIONS}
      selected={selected}
      fgColor={fgColor}
      getLabel={(s) => PIXEL_LABELS[s]}
      renderPreview={(s) => <PixelPreview shape={s} color={colors.text} />}
      onChange={onChange}
    />
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    // Centering the grid (not flex-start) keeps the row visually balanced
    // when the count doesn't divide evenly into the sheet width.  With
    // flex-start, a row of 5 cells leaves a gap on the right that reads
    // as the grid "leaning" to the left.
    justifyContent: "center",
  },
  cell: {
    // Fixed cell width keeps the grid cells the same size across all
    // option modals (Shape, Frame, Corners).  With flexGrow:1 the cells
    // would stretch to fill the row, making the 4-col FrameSelector
    // cells visibly bigger than the 7-col ColorPalette swatches and
    // 5-col CornerSelector cells — that asymmetry looks broken.
    width: 64,
    aspectRatio: 1,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: Spacing.xs,
  },
  cellLabel: {
    fontSize: 9,
    fontFamily: Fonts.monoMedium,
    fontWeight: "600",
  },
});
