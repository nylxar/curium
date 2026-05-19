import { useMemo } from "react";
import { View } from "react-native";
import Svg, { Rect, Path, G, Circle } from "react-native-svg";
import { QRStyle } from "@/types/qr";

// Use the qrcode package that ships with react-native-qrcode-styled
const QRCodeLib = require("qrcode");

interface Props {
  value: string;
  qrStyle: QRStyle;
  size: number;
}

// ─── Get raw boolean matrix from qrcode lib ───────────────────────────────────
function getMatrix(data: string, ecl: string): boolean[][] | null {
  try {
    const qr = QRCodeLib.create(data, { errorCorrectionLevel: ecl });
    const n = qr.modules.size;
    const matrix: boolean[][] = [];
    for (let r = 0; r < n; r++) {
      matrix.push([]);
      for (let c = 0; c < n; c++) {
        matrix[r].push(!!qr.modules.get(r, c));
      }
    }
    return matrix;
  } catch {
    return null;
  }
}

// ─── Check if cell belongs to any of the 3 finder eyes ───────────────────────
function inFinderEye(r: number, c: number, n: number): boolean {
  // top-left: rows 0-8, cols 0-8 (7×7 pattern + 1 separator)
  if (r <= 7 && c <= 7) return true;
  // top-right: rows 0-8, cols n-8 to n-1
  if (r <= 7 && c >= n - 8) return true;
  // bottom-left: rows n-8 to n-1, cols 0-8
  if (r >= n - 8 && c <= 7) return true;
  return false;
}

// ─── Build SVG path for a rounded rectangle ───────────────────────────────────
// Winds CLOCKWISE (positive area) — use for filled shapes
function rrCW(x: number, y: number, w: number, h: number, r: number): string {
  const cr = Math.min(r, w / 2, h / 2);
  if (cr <= 0) return `M${x},${y}h${w}v${h}h${-w}Z`;
  return (
    `M${x + cr},${y}` +
    `H${x + w - cr}Q${x + w},${y} ${x + w},${y + cr}` +
    `V${y + h - cr}Q${x + w},${y + h} ${x + w - cr},${y + h}` +
    `H${x + cr}Q${x},${y + h} ${x},${y + h - cr}` +
    `V${y + cr}Q${x},${y} ${x + cr},${y}Z`
  );
}

// Winds COUNTER-CLOCKWISE (negative area) — use for holes with fillRule="evenodd"
function rrCCW(x: number, y: number, w: number, h: number, r: number): string {
  const cr = Math.min(r, w / 2, h / 2);
  if (cr <= 0) return `M${x},${y}v${h}h${w}v${-h}Z`;
  return (
    `M${x + cr},${y}` +
    `Q${x},${y} ${x},${y + cr}` +
    `V${y + h - cr}Q${x},${y + h} ${x + cr},${y + h}` +
    `H${x + w - cr}Q${x + w},${y + h} ${x + w},${y + h - cr}` +
    `V${y + cr}Q${x + w},${y} ${x + w - cr},${y}Z`
  );
}

// ─── Pixel shape radius as fraction of pieceW ─────────────────────────────────
// These are FRACTIONS (0–0.5), multiplied by pieceW at render time
const PIXEL_RADIUS_FRAC: Record<string, number> = {
  sharp: 0,
  soft: 0.18,
  round: 0.35,
  dots: 0.5, // full circle
  liquid: 0.3,
  glued: 0.25,
  diamond: 0.15,
  cross: 0,
  star: 0.08,
};

// Eye outer border radius as fraction of total eye size (7 × pieceW)
const EYE_OUTER_RADIUS_FRAC: Record<string, number> = {
  sharp: 0,
  soft: 0.08,
  round: 0.22,
  pill: 0.5,
  leaf: 0.22,
  diamond: 0.12,
  shield: 0.18,
  dot: 0.5,
};

// Eye inner dot radius as fraction of inner dot size (3 × pieceW)
const EYE_INNER_RADIUS_FRAC: Record<string, number> = {
  sharp: 0,
  soft: 0.1,
  round: 0.5, // full circle dot
  pill: 0.5,
  leaf: 0.5,
  diamond: 0.12,
  shield: 0.12,
  dot: 0.5,
};

// ─── Render one finder eye ────────────────────────────────────────────────────
function renderEye(
  eyeRow: number,
  eyeCol: number,
  pieceW: number,
  pad: number,
  fg: string,
  eyeShape: string,
): string {
  const ox = pad + eyeCol * pieceW;
  const oy = pad + eyeRow * pieceW;
  const outerSize = 7 * pieceW;
  const innerSize = 3 * pieceW;
  const innerOff = 2 * pieceW;

  // Radii as actual pixels
  const outerR = EYE_OUTER_RADIUS_FRAC[eyeShape] * outerSize;
  const innerR = EYE_INNER_RADIUS_FRAC[eyeShape] * innerSize;

  // Outer ring = CW outer square MINUS CCW inner square → evenodd cuts hole
  const outerPath =
    rrCW(ox, oy, outerSize, outerSize, outerR) +
    " " +
    rrCCW(
      ox + pieceW,
      oy + pieceW,
      5 * pieceW,
      5 * pieceW,
      Math.max(0, outerR - pieceW),
    );

  // Inner dot
  const innerPath = rrCW(
    ox + innerOff,
    oy + innerOff,
    innerSize,
    innerSize,
    innerR,
  );

  return outerPath + " " + innerPath;
}

// ─── QRCanvas ─────────────────────────────────────────────────────────────────
export function QRCanvas({ value, qrStyle, size }: Props) {
  const isEmpty = !value || value.trim().length === 0;

  const matrix = useMemo(
    () => (isEmpty ? null : getMatrix(value, qrStyle.ecl)),
    [value, qrStyle.ecl, isEmpty],
  );

  // Empty / error state
  if (isEmpty || !matrix) {
    return (
      <View
        style={{
          width: size,
          height: size,
          backgroundColor: qrStyle.bgColor,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: size * 0.28,
            height: size * 0.28,
            borderRadius: size * 0.14,
            borderWidth: 2,
            borderStyle: "dashed",
            borderColor: qrStyle.fgColor + "55",
          }}
        />
      </View>
    );
  }

  const n = matrix.length;
  const PAD = Math.round(size * 0.04);
  const pieceW = (size - PAD * 2) / n; // exact — fills container every time

  const pixelFrac = PIXEL_RADIUS_FRAC[qrStyle.pixelShape] ?? 0;
  const pbr = pixelFrac * pieceW;

  // Build data module path (skip finder eye regions)
  const dataPieces: string[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!matrix[r][c]) continue;
      if (inFinderEye(r, c, n)) continue;
      const x = PAD + c * pieceW;
      const y = PAD + r * pieceW;
      dataPieces.push(rrCW(x, y, pieceW, pieceW, pbr));
    }
  }

  // Three finder eye positions
  const eyePositions = [
    { row: 0, col: 0 }, // top-left
    { row: 0, col: n - 7 }, // top-right
    { row: n - 7, col: 0 }, // bottom-left
  ];

  // Single combined path for all eyes (data + eyes share same fill color)
  const eyePath = eyePositions
    .map((e) =>
      renderEye(e.row, e.col, pieceW, PAD, qrStyle.fgColor, qrStyle.eyeShape),
    )
    .join(" ");

  return (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: qrStyle.bgColor,
        borderRadius: 20,
        overflow: "hidden",
      }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background */}
        <Rect width={size} height={size} fill={qrStyle.bgColor} />

        {/* All data modules — single <Path> = best perf */}
        <Path d={dataPieces.join(" ")} fill={qrStyle.fgColor} />

        {/* Finder eyes — evenodd cuts the ring holes correctly */}
        <Path d={eyePath} fill={qrStyle.fgColor} fillRule="evenodd" />
      </Svg>
    </View>
  );
}
