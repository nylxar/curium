import { useMemo, useState, useLayoutEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import Svg, {
  Rect,
  Path,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  Easing,
  interpolateColor,
} from "react-native-reanimated";
import {
  QRStyle,
  EyeShape,
  PupilShape,
  PixelShape,
  FrameStyle,
} from "@/types/qr";

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
function ringPath(cx: number, cy: number, outer: number, inner: number): string {
  // Hollow ring (donut).  Uses even-odd fill rule — outer circle + inner
  // circle reversed, joined into a single path string.
  return `${circlePath(cx, cy, outer)} ${circlePath(cx, cy, inner)}`;
}
function diamondPath(cx: number, cy: number, hs: number): string {
  return `M${cx},${cy - hs}L${cx + hs},${cy}L${cx},${cy + hs}L${cx - hs},${cy}Z`;
}
function crossPath(cx: number, cy: number, s: number): string {
  const t = s * 0.32;
  return `M${cx - t},${cy - s}H${cx + t}V${cy - t}H${cx + s}V${cy + t}H${cx + t}V${cy + s}H${cx - t}V${cy + t}H${cx - s}V${cy - t}H${cx - t}Z`;
}
function plusPath(cx: number, cy: number, s: number, t: number): string {
  // Filled plus: vertical bar + horizontal bar
  return (
    `M${cx - t},${cy - s}H${cx + t}V${cy - t}H${cx + s}V${cy + t}` +
    `H${cx + t}V${cy + s}H${cx - t}V${cy + t}H${cx - s}V${cy - t}H${cx - t}Z`
  );
}
// Regular polygon with `sides` edges, centered at (cx,cy), with circumradius R.
// `rot` rotates the first vertex (default 0 = first vertex at top).
function polygonPath(
  cx: number,
  cy: number,
  R: number,
  sides: number,
  rot = -Math.PI / 2,
): string {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < sides; i++) {
    const a = rot + (i * 2 * Math.PI) / sides;
    pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]);
  }
  let d = `M${pts[0][0].toFixed(3)},${pts[0][1].toFixed(3)}`;
  for (let i = 1; i < pts.length; i++) {
    d += `L${pts[i][0].toFixed(3)},${pts[i][1].toFixed(3)}`;
  }
  return d + "Z";
}
// Generic N-point star path.
function nStarPath(
  cx: number,
  cy: number,
  R: number,
  points: number,
  innerRatio = 0.382,
): string {
  const r = R * innerRatio;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = -Math.PI / 2 + i * (Math.PI / points);
    const rad = i % 2 === 0 ? R : r;
    pts.push([cx + Math.cos(angle) * rad, cy + Math.sin(angle) * rad]);
  }
  let d = `M${pts[0][0].toFixed(3)},${pts[0][1].toFixed(3)}`;
  for (let i = 1; i < pts.length; i++) {
    d += `L${pts[i][0].toFixed(3)},${pts[i][1].toFixed(3)}`;
  }
  return d + "Z";
}
function star5Path(cx: number, cy: number, R: number): string {
  return nStarPath(cx, cy, R, 5);
}
function heartPath(cx: number, cy: number, R: number): string {
  // Classic heart, fits inside a circle of radius R centered at (cx,cy).
  // Built from two semicircles on top and two angled lines to a point.
  const r = R * 0.55; // top lobes radius
  const w = R * 0.95; // half-width at top
  const top = cy - R * 0.15;
  return (
    `M${cx},${cy + R * 0.85}` +
    // right side up to top-right lobe
    `C${cx + w},${cy + R * 0.1} ${cx + w},${top - r * 0.4} ${cx + w * 0.5},${top - r * 0.4}` +
    `A${r},${r} 0 0 0 ${cx - w * 0.5},${top - r * 0.4}` +
    // left side down to point
    `C${cx - w},${top - r * 0.4} ${cx - w},${cy + R * 0.1} ${cx},${cy + R * 0.85}Z`
  );
}
function trianglePath(cx: number, cy: number, R: number): string {
  return polygonPath(cx, cy, R, 3);
}
function hexagonPath(cx: number, cy: number, R: number): string {
  return polygonPath(cx, cy, R, 6);
}
function octagonPath(cx: number, cy: number, R: number): string {
  return polygonPath(cx, cy, R, 8);
}
// 4-point star / sparkle — like ✦, with concave points between four sharp
// vertices.  Used as `sparkle` pixel shape.
function sparklePath(cx: number, cy: number, R: number): string {
  const r = R * 0.18; // very concave waist
  return (
    `M${cx},${cy - R}` +
    `C${cx + r},${cy - r} ${cx + r},${cy - r} ${cx + R},${cy}` +
    `C${cx + r},${cy + r} ${cx + r},${cy + r} ${cx},${cy + R}` +
    `C${cx - r},${cy + r} ${cx - r},${cy + r} ${cx - R},${cy}` +
    `C${cx - r},${cy - r} ${cx - r},${cy - r} ${cx},${cy - R}Z`
  );
}

// ─── Pixel shape config ───────────────────────────────────────────────────────
type PixelShapeKind =
  | "rect"
  | "circle"
  | "diamond"
  | "cross"
  | "star"
  | "plus"
  | "triangle"
  | "hexagon"
  | "heart"
  | "sparkle";
const PIXEL_CFG: Record<PixelShape, { r: number; inset: number; type: PixelShapeKind }> = {
  sharp: { r: 0, inset: 0.04, type: "rect" },
  soft: { r: 0.2, inset: 0.06, type: "rect" },
  round: { r: 0.38, inset: 0.08, type: "rect" },
  dots: { r: 0.5, inset: 0.1, type: "circle" },
  liquid: { r: 0.35, inset: 0.02, type: "rect" },
  glued: { r: 0.28, inset: 0, type: "rect" },
  diamond: { r: 0, inset: 0.08, type: "diamond" },
  cross: { r: 0, inset: 0.08, type: "cross" },
  star: { r: 0.1, inset: 0.1, type: "star" },
  plus: { r: 0, inset: 0.05, type: "plus" },
  triangle: { r: 0, inset: 0.08, type: "triangle" },
  hexagon: { r: 0, inset: 0.06, type: "hexagon" },
  heart: { r: 0, inset: 0.08, type: "heart" },
  sparkle: { r: 0, inset: 0.06, type: "sparkle" },
};

// ─── Eye shape config ─────────────────────────────────────────────────────────
// Each eye has an OUTER ring shape, an INNER cutout shape, and a PUPIL
// (the 3×3 dot at the very center).  The pupil is now independent of the
// eye shape — a heart eye can have a cross pupil, etc.
function eyeShapePaths(
  shape: EyeShape,
  ox: number,
  oy: number,
  pw: number,
): { outer: string; innerCut: string } {
  const O = 7 * pw;
  const I = 5 * pw;
  const oxI = ox + pw;
  const oyI = oy + pw;

  switch (shape) {
    case "sharp":
      return {
        outer: `M${ox},${oy}h${O}v${O}h-${O}Z`,
        innerCut: `M${oxI},${oyI}h${I}v${I}h-${I}Z`,
      };
    case "soft":
      return {
        outer: rrCW(ox, oy, O, O, pw * 0.6),
        innerCut: rrCCW(oxI, oyI, I, I, pw * 0.5),
      };
    case "round":
      return {
        outer: rrCW(ox, oy, O, O, pw * 1.2),
        innerCut: rrCCW(oxI, oyI, I, I, pw * 1.0),
      };
    case "pill":
      return {
        outer: rrCW(ox, oy, O, O, O * 0.5),
        innerCut: rrCCW(oxI, oyI, I, I, I * 0.5),
      };
    case "leaf": {
      const leafPath = (size: number, oox: number, ooy: number): string => {
        const S = size;
        return (
          `M${oox + S},${ooy}` +
          `C${oox + S},${ooy + S * 0.55} ${oox + S * 0.55},${ooy + S} ${oox},${ooy + S}` +
          `C${oox + S * 0.45},${ooy + S} ${oox},${ooy + S * 0.45} ${oox + S},${ooy}` +
          `Z`
        );
      };
      return {
        outer: leafPath(O, ox, oy),
        innerCut: leafPath(I, oxI, oyI),
      };
    }
    case "diamond": {
      const cxO = ox + O / 2;
      const cyO = oy + O / 2;
      const cxI = oxI + I / 2;
      const cyI = oyI + I / 2;
      return {
        outer: diamondPath(cxO, cyO, O / 2),
        innerCut: diamondPath(cxI, cyI, I / 2),
      };
    }
    case "shield": {
      const r = O * 0.28;
      const ri = I * 0.28;
      const build = (size: number, r0: number, ri0: number, oox: number, ooy: number) =>
        `M${oox + r0},${ooy}H${oox + size - r0}` +
        `Q${oox + size},${ooy} ${oox + size},${ooy + r0}` +
        `V${ooy + size * 0.55}` +
        `Q${oox + size},${ooy + size * 0.78} ${oox + size * 0.5},${ooy + size}` +
        `Q${oox},${ooy + size * 0.78} ${oox},${ooy + size * 0.55}` +
        `V${ooy + r0}` +
        `Q${oox},${ooy} ${oox + r0},${ooy}Z`;
      return {
        outer: build(O, r, r * 0.5, ox, oy),
        innerCut: build(I, ri, ri * 0.5, oxI, oyI),
      };
    }
    case "dot":
      return {
        outer: circlePath(ox + O / 2, oy + O / 2, O * 0.5),
        innerCut: circlePath(oxI + I / 2, oyI + I / 2, I * 0.5),
      };
    case "heart":
      return {
        outer: heartPath(ox + O / 2, oy + O / 2, O * 0.5),
        innerCut: heartPath(oxI + I / 2, oyI + I / 2, I * 0.45),
      };
    case "hexagon":
      return {
        outer: hexagonPath(ox + O / 2, oy + O / 2, O * 0.5),
        innerCut: hexagonPath(oxI + I / 2, oyI + I / 2, I * 0.5),
      };
    case "plus":
      return {
        outer: plusPath(ox + O / 2, oy + O / 2, O * 0.5, O * 0.18),
        innerCut: plusPath(oxI + I / 2, oyI + I / 2, I * 0.5, I * 0.18),
      };
    case "star":
      return {
        outer: star5Path(ox + O / 2, oy + O / 2, O * 0.5),
        innerCut: star5Path(oxI + I / 2, oyI + I / 2, I * 0.5),
      };
    case "octagon":
      return {
        outer: octagonPath(ox + O / 2, oy + O / 2, O * 0.5),
        innerCut: octagonPath(oxI + I / 2, oyI + I / 2, I * 0.5),
      };
  }
}

// ─── Pupil path generator ─────────────────────────────────────────────────────
// The pupil is the 3×3 solid shape at the center of each finder eye.  It is
// styled independently of the eye shape, so a round eye can have a star
// pupil, a heart eye can have a cross pupil, etc.  When `pupilShape` is
// "none", the pupil path is empty and the eye renders without a center dot.
function pupilPath(shape: PupilShape, ox: number, oy: number, pw: number): string {
  const D = 3 * pw;
  const cxD = ox + 2 * pw + D / 2;
  const cyD = oy + 2 * pw + D / 2;
  if (shape === "none") return "";
  switch (shape) {
    case "dot":
      return circlePath(cxD, cyD, D * 0.5);
    case "square":
      return rrCW(ox + 2 * pw, oy + 2 * pw, D, D, 0);
    case "ring":
      return ringPath(cxD, cyD, D * 0.5, D * 0.28);
    case "cross":
      return crossPath(cxD, cyD, D * 0.5);
    case "diamond":
      return diamondPath(cxD, cyD, D * 0.5);
    case "star":
      return star5Path(cxD, cyD, D * 0.5);
    case "heart":
      return heartPath(cxD, cyD, D * 0.45);
  }
}

// ─── Draw one finder eye — returns ring path and pupil path separately ────────
function drawEye(
  eyeRow: number,
  eyeCol: number,
  pw: number,
  pad: number,
  eyeShape: EyeShape,
  pupilShape: PupilShape,
): { ring: string; pupil: string } {
  const ox = pad + eyeCol * pw;
  const oy = pad + eyeRow * pw;
  const { outer, innerCut } = eyeShapePaths(eyeShape, ox, oy, pw);
  const ring = `${outer} ${innerCut}`;
  const pupil = pupilPath(pupilShape, ox, oy, pw);
  return { ring, pupil };
}

// ─── Animated SVG primitives ─────────────────────────────────────────────────
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedStop = Animated.createAnimatedComponent(Stop);

// Module-level "has any QR ever been generated" flag.  The entrance animation
// plays ONCE per app session on the very first QRCanvas mount, regardless of
// which screen it lives on.  Subsequent mounts (e.g., navigating to
// qr-detail.tsx, which also renders QRCanvas) skip the animation entirely
// so the QR pops in instantly instead of fading/scaling at the same time
// the screen transition is playing — that double-motion was feeling rough.
let hasGeneratedAnyQR = false;

// ─── Frame styling ────────────────────────────────────────────────────────────
// Returns the View-style props that wrap the QR in a decorative border.
function frameStyle(frame: FrameStyle, fg: string): {
  borderWidth: number;
  borderColor: string;
  borderRadius: number;
  borderStyle?: "solid" | "dashed" | "dotted";
  padding: number;
  // For "double" we approximate with two stacked borders via outline.
} {
  switch (frame) {
    case "none":
      return { borderWidth: 0, borderColor: "transparent", borderRadius: 0, padding: 0 };
    case "thin":
      return {
        borderWidth: 1,
        borderColor: fg + "30",
        borderRadius: 8,
        padding: 10,
      };
    case "rounded":
      return {
        borderWidth: 1.5,
        borderColor: fg + "40",
        borderRadius: 18,
        padding: 12,
      };
    case "thick":
      return {
        borderWidth: 4,
        borderColor: fg + "55",
        borderRadius: 14,
        padding: 14,
      };
    case "dashed":
      return {
        borderWidth: 2,
        borderColor: fg + "50",
        borderRadius: 10,
        borderStyle: "dashed",
        padding: 12,
      };
    case "dotted":
      return {
        borderWidth: 1.5,
        borderColor: fg + "55",
        borderRadius: 10,
        borderStyle: "dotted",
        padding: 12,
      };
    case "double":
      // Native borders can't do "double" — fall back to a thick rounded
      // border.  The user gets a visual frame either way; double is just
      // a soft indicator that the user wants a chunky frame.
      return {
        borderWidth: 3,
        borderColor: fg + "60",
        borderRadius: 12,
        padding: 14,
      };
  }
}

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

  // Gradient colors, captured the same way for stop-color animation.
  const [oldGrad, setOldGrad] = useState({
    start: qrStyle.gradient.startColor,
    end: qrStyle.gradient.endColor,
  });
  const [newGrad, setNewGrad] = useState({
    start: qrStyle.gradient.startColor,
    end: qrStyle.gradient.endColor,
  });

  const crossProgress = useSharedValue(1);

  useLayoutEffect(() => {
    const colorChanged =
      qrStyle.fgColor !== newColors.fg ||
      qrStyle.bgColor !== newColors.bg ||
      qrStyle.eyeColor !== newColors.eye;
    const gradChanged =
      qrStyle.gradient.startColor !== newGrad.start ||
      qrStyle.gradient.endColor !== newGrad.end;

    if (colorChanged) {
      setOldColors(newColors);
      setNewColors({
        fg: qrStyle.fgColor,
        bg: qrStyle.bgColor,
        eye: qrStyle.eyeColor,
      });
    }
    if (gradChanged) {
      setOldGrad(newGrad);
      setNewGrad({
        start: qrStyle.gradient.startColor,
        end: qrStyle.gradient.endColor,
      });
    }
    if (colorChanged || gradChanged) {
      crossProgress.value = 0;
      crossProgress.value = withTiming(1, {
        duration: 420,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [
    qrStyle.fgColor,
    qrStyle.bgColor,
    qrStyle.eyeColor,
    qrStyle.gradient.startColor,
    qrStyle.gradient.endColor,
  ]);

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
  // Animated stop colors for the foreground gradient.
  const gradStartProps = useAnimatedProps(() => ({
    stopColor: interpolateColor(
      crossProgress.value,
      [0, 1],
      [oldGrad.start, newGrad.start],
    ),
  }));
  const gradEndProps = useAnimatedProps(() => ({
    stopColor: interpolateColor(
      crossProgress.value,
      [0, 1],
      [oldGrad.end, newGrad.end],
    ),
  }));

  // Compute gradient endpoints from angle (degrees, 0 = up).
  // Returns {x1,y1,x2,y2} in [0,1] for use with LinearGradient.
  const gradCoords = useMemo(() => {
    const rad = ((qrStyle.gradient.angle - 90) * Math.PI) / 180;
    const dx = Math.cos(rad);
    const dy = Math.sin(rad);
    return {
      x1: 0.5 - dx * 0.5,
      y1: 0.5 - dy * 0.5,
      x2: 0.5 + dx * 0.5,
      y2: 0.5 + dy * 0.5,
    };
  }, [qrStyle.gradient.angle]);

  // Unique gradient id per QR (so two QRs in the same view tree don't
  // share stops).  Random at mount; never changes.
  const gradIdRef = useRef(`qrgrad_${Math.random().toString(36).slice(2, 9)}`);

  // ── Generation animation: subtle scale-up + opacity entrance ──
  const genProgress = useSharedValue(0);
  const localDidGenerate = useRef(false);
  const genStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + genProgress.value * 0.75,
    transform: [
      { scale: 0.965 + genProgress.value * 0.035 },
    ],
  }));

  useLayoutEffect(() => {
    if (!isEmpty && matrix && !localDidGenerate.current) {
      localDidGenerate.current = true;
      if (!hasGeneratedAnyQR) {
        hasGeneratedAnyQR = true;
        genProgress.value = 0;
        genProgress.value = withTiming(1, {
          duration: 240,
          easing: Easing.out(Easing.cubic),
        });
      } else {
        genProgress.value = 1;
      }
    } else if (isEmpty) {
      localDidGenerate.current = false;
      genProgress.value = 0;
    }
  }, [isEmpty, matrix]);

  // ── Empty / placeholder state ──
  if (isEmpty || !matrix) {
    const cornerR0 = qrStyle.qrCorners ?? 20;
    return (
      <View
        style={{
          width: size,
          height: size,
          backgroundColor: qrStyle.bgColor,
          borderRadius: cornerR0,
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

  // ── Build data module (pixel) paths ──
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
        case "star":
          pieces.push(star5Path(cx, cy, drawSz * 0.55));
          break;
        case "plus":
          pieces.push(plusPath(cx, cy, drawSz * 0.5, drawSz * 0.16));
          break;
        case "triangle":
          pieces.push(trianglePath(cx, cy, drawSz * 0.55));
          break;
        case "hexagon":
          pieces.push(hexagonPath(cx, cy, drawSz * 0.55));
          break;
        case "heart":
          pieces.push(heartPath(cx, cy, drawSz * 0.55));
          break;
        case "sparkle":
          pieces.push(sparklePath(cx, cy, drawSz * 0.5));
          break;
        default:
          pieces.push(rrCW(x, y, drawSz, drawSz, drawR));
          break;
      }
    }
  }

  // ── Build finder eye + pupil paths ──
  const eyePos = [
    { r: 0, c: 0 },
    { r: 0, c: n - 7 },
    { r: n - 7, c: 0 },
  ];
  const eyes = eyePos.map((e) =>
    drawEye(e.r, e.c, pw, PAD, qrStyle.eyeShape, qrStyle.pupilShape),
  );
  const eyeRingPath = eyes.map((e) => e.ring).join(" ");
  const eyeDotPath = eyes
    .map((e) => e.pupil)
    .filter((p) => p.length > 0)
    .join(" ");
  const hasPupil = eyeDotPath.length > 0;

  // The pieces fill — gradient URL or solid color.
  const useGradient = qrStyle.gradient.enabled;
  const piecesFill = useGradient ? `url(#${gradIdRef.current})` : newColors.fg;

  // Frame styling
  const fStyle = frameStyle(qrStyle.frame, newColors.fg);
  // The frame's border (when enabled) sits on the OUTER view so it doesn't
  // get clipped by the inner overflow:hidden wrapper.  The inner QR is
  // shrunk to (size - 2*framePadding) and centered, so the total visual
  // size is still `size` — the frame sits in the gutter, not beyond it.
  const framePad = qrStyle.frame === "none" ? 0 : fStyle.padding;
  const innerSize = size - framePad * 2;
  const hasFrame = qrStyle.frame !== "none";
  // QR corner radius — driven by qrStyle.qrCorners, falling back to a
  // sensible default.  0 = sharp, large = very rounded.
  const cornerR = qrStyle.qrCorners ?? 20;

  return (
    <View
      style={{
        width: size,
        height: size,
        // Outer radius is the larger of the frame radius and the inner
        // QR radius + padding.  This way the outer shape is always at
        // least as rounded as the QR it contains, so nothing pokes out.
        borderRadius: hasFrame
          ? Math.max(fStyle.borderRadius, cornerR + framePad)
          : cornerR,
        backgroundColor: hasFrame ? newColors.bg : "transparent",
        borderWidth: hasFrame ? fStyle.borderWidth : 0,
        borderColor: hasFrame ? fStyle.borderColor : "transparent",
        borderStyle: hasFrame ? fStyle.borderStyle : "solid",
        alignItems: "center",
        justifyContent: "center",
        // "double" frame: shadow effect on the outer container.
        ...(qrStyle.frame === "double" && styles.doubleOuter),
      }}
    >
      <View
        style={{
          width: innerSize,
          height: innerSize,
          borderRadius: cornerR,
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
        <Animated.View
          style={[{ width: innerSize, height: innerSize }, genStyle]}
        >
          <Svg
            width={innerSize}
            height={innerSize}
            viewBox={`0 0 ${innerSize} ${innerSize}`}
          >
            <Defs>
              {useGradient && (
                <LinearGradient
                  id={gradIdRef.current}
                  x1={gradCoords.x1}
                  y1={gradCoords.y1}
                  x2={gradCoords.x2}
                  y2={gradCoords.y2}
                >
                  <AnimatedStop offset="0" animatedProps={gradStartProps} />
                  <AnimatedStop offset="1" animatedProps={gradEndProps} />
                </LinearGradient>
              )}
            </Defs>
            <AnimatedRect
              width={innerSize}
              height={innerSize}
              animatedProps={bgRectProps}
            />
            {useGradient ? (
              <Path
                d={pieces.join(" ")}
                fill={piecesFill}
              />
            ) : (
              <AnimatedPath
                d={pieces.join(" ")}
                animatedProps={piecesProps}
              />
            )}
            <AnimatedPath
              d={eyeRingPath}
              fillRule="evenodd"
              animatedProps={eyeRingProps}
            />
            {hasPupil && (
              <AnimatedPath d={eyeDotPath} animatedProps={eyeDotProps} />
            )}
          </Svg>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  doubleOuter: {
    // Outer border (the QR-side already has its own border).  The double
    // effect comes from a slightly inset inner border drawn by the inner
    // View's `borderColor: 'transparent'` baseline plus a 1px shadow-like
    // outline.  We approximate by making the outer View have a thicker
    // border; the inner View has none, so the result reads as one thick
    // frame with a hint of an inner line.
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 0,
  },
});

// ─── Re-exports for ShapeSelector previews ────────────────────────────────────
export const EyeShapePaths = {
  outer: (
    shape: EyeShape,
    x: number,
    y: number,
    s: number,
  ): string => {
    const pw = s / 7;
    const { outer } = eyeShapePaths(shape, x, y, pw);
    return outer;
  },
  innerCut: (
    shape: EyeShape,
    x: number,
    y: number,
    s: number,
  ): string => {
    const pw = s / 7;
    const { innerCut } = eyeShapePaths(shape, x, y, pw);
    return innerCut;
  },
  pupil: (shape: PupilShape, x: number, y: number, s: number): string => {
    const pw = s / 7;
    return pupilPath(shape, x, y, pw);
  },
};

export const PixelShapePath = {
  rect: (x: number, y: number, s: number, r: number): string =>
    rrCW(x, y, s, s, r),
  circle: (cx: number, cy: number, r: number): string =>
    circlePath(cx, cy, r),
  diamond: (cx: number, cy: number, hs: number): string =>
    diamondPath(cx, cy, hs),
  cross: (cx: number, cy: number, s: number): string =>
    crossPath(cx, cy, s),
  star: (cx: number, cy: number, R: number): string => star5Path(cx, cy, R),
  plus: (cx: number, cy: number, s: number, t: number): string =>
    plusPath(cx, cy, s, t),
  triangle: (cx: number, cy: number, R: number): string =>
    trianglePath(cx, cy, R),
  hexagon: (cx: number, cy: number, R: number): string =>
    hexagonPath(cx, cy, R),
  octagon: (cx: number, cy: number, R: number): string =>
    octagonPath(cx, cy, R),
  heart: (cx: number, cy: number, R: number): string => heartPath(cx, cy, R),
  sparkle: (cx: number, cy: number, R: number): string =>
    sparklePath(cx, cy, R),
};
