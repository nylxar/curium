import { useMemo, useState, useLayoutEffect } from "react";
import { View } from "react-native";
import Svg, { Rect, Path } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  Easing,
  interpolateColor,
} from "react-native-reanimated";
import { QRStyle } from "@/types/qr";

const QRLib = require("qrcode");

interface Props {
  value: string;
  qrStyle: QRStyle;
  size: number;
}

interface ColorSet {
  fg: string;
  bg: string;
  eye: string;
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
function rrCW(x: number, y: number, w: number, h: number, r: number): string {
  const cr = Math.min(r, w / 2, h / 2);
  if (cr < 0.5) return `M${x},${y}h${w}v${h}h-${w}Z`;
  return `M${x + cr},${y}H${x + w - cr}Q${x + w},${y} ${x + w},${y + cr}V${y + h - cr}Q${x + w},${y + h} ${x + w - cr},${y + h}H${x + cr}Q${x},${y + h} ${x},${y + h - cr}V${y + cr}Q${x},${y} ${x + cr},${y}Z`;
}
function rrCCW(x: number, y: number, w: number, h: number, r: number): string {
  const cr = Math.min(r, w / 2, h / 2);
  if (cr < 0.5) return `M${x},${y}v${h}h${w}v-${h}Z`;
  return `M${x + cr},${y}Q${x},${y} ${x},${y + cr}V${y + h - cr}Q${x},${y + h} ${x + cr},${y + h}H${x + w - cr}Q${x + w},${y + h} ${x + w},${y + h - cr}V${y + cr}Q${x + w},${y} ${x + w - cr},${y}Z`;
}
function circlePath(cx: number, cy: number, r: number): string {
  return `M${cx - r},${cy}a${r},${r} 0 1,0 ${r * 2},0a${r},${r} 0 1,0 -${r * 2},0`;
}
function diamondPath(cx: number, cy: number, hs: number): string {
  return `M${cx},${cy - hs}L${cx + hs},${cy}L${cx},${cy + hs}L${cx - hs},${cy}Z`;
}
function crossPath(cx: number, cy: number, s: number): string {
  const t = s * 0.32;
  return `M${cx - t},${cy - s}H${cx + t}V${cy - t}H${cx + s}V${cy + t}H${cx + t}V${cy + s}H${cx - t}V${cy + t}H${cx - s}V${cy - t}H${cx - t}Z`;
}

// ─── Pixel shape config ───────────────────────────────────────────────────────
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

// ─── Draw one finder eye — returns ring path and dot path separately ──────────
function drawEye(
  eyeRow: number,
  eyeCol: number,
  pw: number,
  pad: number,
  shape: string,
): { ring: string; dot: string } {
  const cfg = EYE_CFG[shape] ?? EYE_CFG.round;
  const ox = pad + eyeCol * pw;
  const oy = pad + eyeRow * pw;
  const outerSz = 7 * pw;
  const innerSz = 3 * pw;
  const outerR = cfg.outerR * outerSz;
  const innerR = cfg.innerR * innerSz;

  const ring =
    rrCW(ox, oy, outerSz, outerSz, outerR) +
    " " +
    rrCCW(ox + pw, oy + pw, 5 * pw, 5 * pw, Math.max(0, outerR - pw * 0.7));
  const dot = rrCW(ox + 2 * pw, oy + 2 * pw, innerSz, innerSz, innerR);
  return { ring, dot };
}

// ─── Animated SVG primitives ─────────────────────────────────────────────────
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedPath = Animated.createAnimatedComponent(Path);

// ─── QRCanvas ─────────────────────────────────────────────────────────────────
export function QRCanvas({ value, qrStyle, size }: Props) {
  const isEmpty = !value || !value.trim();

  const matrix = useMemo(
    () => (isEmpty ? null : getMatrix(value, qrStyle.ecl)),
    [value, qrStyle.ecl, isEmpty],
  );

  // ── Color transition: direct color morph (NOT opacity blend) ──
  // We use useState so the worklet closure captures the latest old/new
  // color strings on every render.  useAnimatedProps + interpolateColor
  // runs entirely on the UI thread — each SVG fill is directly morphed
  // from old → new, pixel by pixel.  No double-exposure, no blur.
  const [oldColors, setOldColors] = useState<ColorSet>({
    fg: qrStyle.fgColor,
    bg: qrStyle.bgColor,
    eye: qrStyle.eyeColor,
  });
  const [newColors, setNewColors] = useState<ColorSet>({
    fg: qrStyle.fgColor,
    bg: qrStyle.bgColor,
    eye: qrStyle.eyeColor,
  });

  const crossProgress = useSharedValue(1); // 1 = fully new colors

  useLayoutEffect(() => {
    if (
      qrStyle.fgColor !== newColors.fg ||
      qrStyle.bgColor !== newColors.bg ||
      qrStyle.eyeColor !== newColors.eye
    ) {
      setOldColors(newColors);
      setNewColors({
        fg: qrStyle.fgColor,
        bg: qrStyle.bgColor,
        eye: qrStyle.eyeColor,
      });
      crossProgress.value = 0;
      crossProgress.value = withTiming(1, {
        duration: 420,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [qrStyle.fgColor, qrStyle.bgColor, qrStyle.eyeColor]);

  // Direct color morph on each SVG fill (UI thread via Reanimated)
  const bgRectProps = useAnimatedProps(() => ({
    fill: interpolateColor(
      crossProgress.value,
      [0, 1],
      [oldColors.bg, newColors.bg],
    ),
  }));
  const piecesProps = useAnimatedProps(() => ({
    fill: interpolateColor(
      crossProgress.value,
      [0, 1],
      [oldColors.fg, newColors.fg],
    ),
  }));
  const eyeRingProps = useAnimatedProps(() => ({
    fill: interpolateColor(
      crossProgress.value,
      [0, 1],
      [oldColors.eye, newColors.eye],
    ),
  }));
  const eyeDotProps = useAnimatedProps(() => ({
    fill: interpolateColor(
      crossProgress.value,
      [0, 1],
      [oldColors.fg, newColors.fg],
    ),
  }));

  // ── Generation animation: subtle scale-up + opacity entrance ──
  // Triggers on every matrix change, but kept very short (200ms) and gentle
  // so it doesn't feel heavy when the user is typing.  The QR "settles in"
  // rather than getting wiped.  No mask, no layout changes — just a tiny
  // scale + fade on the inner Svg.
  const genProgress = useSharedValue(0);
  const genStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + genProgress.value * 0.75,
    transform: [
      { scale: 0.965 + genProgress.value * 0.035 },
    ],
  }));

  useLayoutEffect(() => {
    if (!isEmpty && matrix) {
      genProgress.value = 0;
      genProgress.value = withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      genProgress.value = 0;
    }
  }, [isEmpty, matrix]);

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
          borderWidth: 1,
          borderColor: qrStyle.fgColor + "15",
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
  const eyes = eyePos.map((e) => drawEye(e.r, e.c, pw, PAD, qrStyle.eyeShape));
  const eyeRingPath = eyes.map((e) => e.ring).join(" ");
  const eyeDotPath = eyes.map((e) => e.dot).join(" ");

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 20,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.06)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <Animated.View style={[{ width: size, height: size }, genStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <AnimatedRect
            width={size}
            height={size}
            animatedProps={bgRectProps}
          />
          <AnimatedPath d={pieces.join(" ")} animatedProps={piecesProps} />
          <AnimatedPath
            d={eyeRingPath}
            fillRule="evenodd"
            animatedProps={eyeRingProps}
          />
          <AnimatedPath d={eyeDotPath} animatedProps={eyeDotProps} />
        </Svg>
      </Animated.View>
    </View>
  );
}
