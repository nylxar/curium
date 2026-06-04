import { useMemo, useEffect } from "react";
import { View } from "react-native";
import Svg, { Rect, Path } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { QRStyle } from "@/types/qr";

const QRLib = require("qrcode");

interface Props {
  value: string;
  qrStyle: QRStyle;
  size: number;
}

// ─── Matrix ───────────────────────────────────────────────────────────────────
function getMatrix(data: string, ecl: string): boolean[][] | null {
  try {
    const qr = QRLib.create(data, { errorCorrectionLevel: ecl });
    const n = qr.modules.size;
    const m: boolean[][] = Array.from({ length: n }, (_, r) =>
      Array.from({ length: n }, (__, c) => !!qr.modules.get(r, c)),
    );
    return m;
  } catch {
    return null;
  }
}

// ─── Eye region mask ──────────────────────────────────────────────────────────
function inEye(r: number, c: number, n: number): boolean {
  return (r <= 7 && c <= 7) || (r <= 7 && c >= n - 8) || (r >= n - 8 && c <= 7);
}

// ─── SVG path helpers ─────────────────────────────────────────────────────────
// Clockwise rounded rect (positive winding — filled)
function rrCW(x: number, y: number, w: number, h: number, r: number): string {
  "worklet";
  const cr = Math.min(r, w / 2, h / 2);
  if (cr < 0.5) return `M${x},${y}h${w}v${h}h-${w}Z`;
  return `M${x + cr},${y}H${x + w - cr}Q${x + w},${y} ${x + w},${y + cr}V${y + h - cr}Q${x + w},${y + h} ${x + w - cr},${y + h}H${x + cr}Q${x},${y + h} ${x},${y + h - cr}V${y + cr}Q${x},${y} ${x + cr},${y}Z`;
}
// Counter-clockwise rounded rect (negative winding — punch hole via evenodd)
function rrCCW(x: number, y: number, w: number, h: number, r: number): string {
  const cr = Math.min(r, w / 2, h / 2);
  if (cr < 0.5) return `M${x},${y}v${h}h${w}v-${h}Z`;
  return `M${x + cr},${y}Q${x},${y} ${x},${y + cr}V${y + h - cr}Q${x},${y + h} ${x + cr},${y + h}H${x + w - cr}Q${x + w},${y + h} ${x + w},${y + h - cr}V${y + cr}Q${x + w},${y} ${x + w - cr},${y}Z`;
}
// Circle
function circlePath(cx: number, cy: number, r: number): string {
  return `M${cx - r},${cy}a${r},${r} 0 1,0 ${r * 2},0a${r},${r} 0 1,0 -${r * 2},0`;
}
// Diamond (45° rotated square)
function diamondPath(cx: number, cy: number, hs: number): string {
  return `M${cx},${cy - hs}L${cx + hs},${cy}L${cx},${cy + hs}L${cx - hs},${cy}Z`;
}
// Cross / plus shape
function crossPath(cx: number, cy: number, s: number): string {
  const t = s * 0.32; // arm thickness
  return `M${cx - t},${cy - s}H${cx + t}V${cy - t}H${cx + s}V${cy + t}H${cx + t}V${cy + s}H${cx - t}V${cy + t}H${cx - s}V${cy - t}H${cx - t}Z`;
}

// ─── Pixel shape config ───────────────────────────────────────────────────────
// r: corner radius as fraction of piece draw size (0 = sharp, 0.5 = circle)
// inset: gap around each piece as fraction of pieceW (0 = no gap)
// type: drawing method
type ShapeType = "rect" | "circle" | "diamond" | "cross";
const PIXEL_CFG: Record<string, { r: number; inset: number; type: ShapeType }> =
  {
    sharp: { r: 0, inset: 0.02, type: "rect" },
    soft: { r: 0.2, inset: 0.04, type: "rect" },
    round: { r: 0.38, inset: 0.05, type: "rect" },
    dots: { r: 0.5, inset: 0.08, type: "circle" },
    liquid: { r: 0.35, inset: 0.01, type: "rect" },
    glued: { r: 0.28, inset: 0, type: "rect" },
    diamond: { r: 0, inset: 0.06, type: "diamond" },
    cross: { r: 0, inset: 0.08, type: "cross" },
    star: { r: 0.1, inset: 0.1, type: "rect" },
  };

// ─── Eye config ───────────────────────────────────────────────────────────────
// outerR: outer square radius as fraction of eye size (7×pieceW)
// innerR: inner dot radius as fraction of inner dot size (3×pieceW)
const EYE_CFG: Record<string, { outerR: number; innerR: number }> = {
  sharp: { outerR: 0, innerR: 0 },
  soft: { outerR: 0.1, innerR: 0.12 },
  round: { outerR: 0.22, innerR: 0.5 },
  pill: { outerR: 0.48, innerR: 0.5 },
  leaf: { outerR: 0.22, innerR: 0.5 },
  diamond: { outerR: 0.12, innerR: 0.12 },
  shield: { outerR: 0.2, innerR: 0.1 },
  dot: { outerR: 0.5, innerR: 0.5 },
};

// ─── Draw one finder eye as SVG path string ───────────────────────────────────
function drawEye(
  eyeRow: number,
  eyeCol: number,
  pw: number,
  pad: number,
  shape: string,
): string {
  const cfg = EYE_CFG[shape] ?? EYE_CFG.round;
  const ox = pad + eyeCol * pw;
  const oy = pad + eyeRow * pw;
  const outerSz = 7 * pw;
  const innerSz = 3 * pw;
  const outerR = cfg.outerR * outerSz;
  const innerR = cfg.innerR * innerSz;

  // Outer ring = CW outer - CCW hole (evenodd cuts ring)
  const outer =
    rrCW(ox, oy, outerSz, outerSz, outerR) +
    " " +
    rrCCW(ox + pw, oy + pw, 5 * pw, 5 * pw, Math.max(0, outerR - pw * 0.7));
  // Inner dot
  const inner = rrCW(ox + 2 * pw, oy + 2 * pw, innerSz, innerSz, innerR);
  return outer + " " + inner;
}

// ─── QRCanvas ─────────────────────────────────────────────────────────────────
export function QRCanvas({ value, qrStyle, size }: Props) {
  const isEmpty = !value || !value.trim();

  const matrix = useMemo(
    () => (isEmpty ? null : getMatrix(value, qrStyle.ecl)),
    [value, qrStyle.ecl, isEmpty],
  );

  // Circular reveal — View mask with animated size
  const maskSize = useSharedValue(0);
  const containerOpacity = useSharedValue(0);

  const maskStyle = useAnimatedStyle(() => ({
    width: maskSize.value,
    height: maskSize.value,
  }));

  const containerAnimStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  useEffect(() => {
    if (!isEmpty && matrix) {
      containerOpacity.value = withTiming(1, { duration: 200 });
      maskSize.value = withTiming(size, {
        duration: 450,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      containerOpacity.value = 0;
      maskSize.value = 0;
    }
  }, [!isEmpty]);

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
  const PAD = Math.round(size * 0.045);
  const pw = (size - PAD * 2) / n;

  const cfg = PIXEL_CFG[qrStyle.pixelShape] ?? PIXEL_CFG.sharp;
  const inset = cfg.inset * pw;
  const drawSz = pw - inset * 2;
  const drawR = cfg.r * drawSz;

  const pieces: string[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!matrix[r][c] || inEye(r, c, n)) continue;
      const cx = PAD + c * pw + pw / 2;
      const cy = PAD + r * pw + pw / 2;
      const x = cx - drawSz / 2;
      const y = cy - drawSz / 2;
      switch (cfg.type) {
        case "circle":
          pieces.push(circlePath(cx, cy, drawSz / 2));
          break;
        case "diamond":
          pieces.push(diamondPath(cx, cy, drawSz / 2));
          break;
        case "cross":
          pieces.push(crossPath(cx, cy, drawSz / 2));
          break;
        default:
          pieces.push(rrCW(x, y, drawSz, drawSz, drawR));
          break;
      }
    }
  }

  const eyePos = [
    { r: 0, c: 0 },
    { r: 0, c: n - 7 },
    { r: n - 7, c: 0 },
  ];
  const eyePath = eyePos
    .map((e) => drawEye(e.r, e.c, pw, PAD, qrStyle.eyeShape))
    .join(" ");

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          backgroundColor: qrStyle.bgColor,
          borderRadius: 20,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
        },
        containerAnimStyle,
      ]}
    >
      {/* Circular mask — centered, reveals QR via size animation */}
      <Animated.View
        style={[
          {
            borderRadius: size,
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "center",
          },
          maskStyle,
        ]}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Rect width={size} height={size} fill={qrStyle.bgColor} />
          <Path d={pieces.join(" ")} fill={qrStyle.fgColor} />
          <Path d={eyePath} fill={qrStyle.eyeColor} fillRule="evenodd" />
          <Path d={eyePath} fill={qrStyle.fgColor} fillRule="evenodd" />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}
