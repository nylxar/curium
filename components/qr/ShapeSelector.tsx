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

// Pupil preview — single-path pupils show the actual shape, grid shows a 3×3.
function PupilPreview({ shape, color }: { shape: PupilShape; color: string }) {
  if (shape === "none") {
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
  if (shape === "pixel") {
    // Show a 3×3 grid of small squares to indicate per-module rendering.
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
    return (
      <Svg width={PREVIEW_BOX} height={PREVIEW_BOX} viewBox="0 0 32 32">
        {positions.map((pos, i) => (
          <Path key={i} d={`M${pos.x},${pos.y}h${cell}v${cell}h-${cell}Z`} fill={color} />
        ))}
      </Svg>
    );
  }
  // Single-path pupil: render the actual shape scaled to preview box.
  const d = EyeShapePaths.pupil(shape, PREVIEW_PAD, PREVIEW_PAD, 24);
  return (
    <Svg width={PREVIEW_BOX} height={PREVIEW_BOX} viewBox="0 0 32 32">
      <Path d={d} fill={color} />
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
      case "smooth":
        return PixelShapePath.smooth(x + 0.5, y + 0.5, cell - 1, 2);
      case "flow":
        return PixelShapePath.flow(cx, cy, cell * 0.48);
      case "blob":
        return PixelShapePath.blob(cx, cy, cell * 0.45);
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
      case "pinched-square":
        return PixelShapePath["pinched-square"](x, y, cell);
      case "circuit-board":
        return PixelShapePath["circuit-board"](x, y, cell);
      case "hashtag":
        return PixelShapePath.hashtag(cx, cy, cell * 0.5);
      case "vertical-line":
        return PixelShapePath["vertical-line"](x, y, cell);
      case "horizontal-line":
        return PixelShapePath["horizontal-line"](x, y, cell);
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
  "dot",
  "shield",
  "hexagon",
  "octagon",
];
const PUPIL_OPTIONS: PupilShape[] = [
  "dot",
  "square",
  "diamond",
  "cross",
  "hexagon",
  "octagon",
  "shield",
  "star",
  "heart",
  "blob",
  "dome",
  "oval",
  "pentagon",
  "scallop",
  "cloud",
  "droplet",
  "pixel",
  "none",
];
const PIXEL_OPTIONS: PixelShape[] = [
  "sharp",
  "soft",
  "round",
  "dots",
  "liquid",
  "glued",
  "smooth",
  "flow",
  "blob",
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
  "pinched-square",
  "circuit-board",
  "hashtag",
  "vertical-line",
  "horizontal-line",
];

const EYE_LABELS: Record<EyeShape, string> = {
  sharp: "Sharp",
  soft: "Soft",
  round: "Round",
  pill: "Pill",
  dot: "Dot",
  shield: "Shield",
  hexagon: "Hex",
  octagon: "Oct",
  inpoint: "Inpoint",
  outpoint: "Outpoint",
  leaf: "Leaf",
};

const PUPIL_LABELS: Record<PupilShape, string> = {
  dot: "Dot",
  square: "Square",
  diamond: "Diam",
  cross: "Cross",
  hexagon: "Hex",
  octagon: "Oct",
  shield: "Shield",
  star: "Star",
  heart: "Heart",
  blob: "Blob",
  dome: "Dome",
  oval: "Oval",
  pentagon: "Penta",
  scallop: "Scallop",
  cloud: "Cloud",
  droplet: "Drop",
  microchip: "Chip",
  hashtag: "Hash",
  pixel: "Grid",
  none: "None",
};

const PIXEL_LABELS: Record<PixelShape, string> = {
  sharp: "Sharp",
  soft: "Soft",
  round: "Round",
  dots: "Dots",
  liquid: "Liquid",
  glued: "Glued",
  smooth: "Smooth",
  flow: "Flow",
  blob: "Blob",
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
  "pinched-square": "Pinch",
  "circuit-board": "Circuit",
  hashtag: "Hash",
  "vertical-line": "V-Line",
  "horizontal-line": "H-Line",
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
