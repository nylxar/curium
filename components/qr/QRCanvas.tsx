import { useMemo, useLayoutEffect, useRef } from "react";
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
  withTiming,
  Easing,
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
  // "liquid" = organic, fully-pillowed cell that almost touches its
  // neighbors.  Radius = half the cell makes it a full pill, and the
  // tiny inset (-0.02) intentionally lets the cell bleed slightly
  // into the gap so adjacent cells visually merge into a flowing
  // shape — the "liquid" feel.  `round` (r: 0.38) is a much more
  // tame rounded rect, so the two read as distinct shapes.
  liquid: { r: 0.5, inset: -0.02, type: "rect" },
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
// We deliberately do NOT wrap Rect/Path/Stop in Animated.createAnimatedComponent.
// Reanimated 4 + react-native-svg 15 has known issues with animated SVG
// components: the worklet subscription goes out of sync with the host
// during fast re-renders (e.g. while typing), throwing
// "Cannot find host instance for this component. Maybe it renders nothing?".
// Best practice: keep SVG components plain and use static fill props.
// Animation is applied to the outer Animated.View wrapper only (a core
// React Native component, not an SVG component).
//

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

  // ── Colors snap on commit (no cross-fade on the QR itself) ──
  // The QR fills are static React props on plain SVG components, so
  // there's nothing to animate.  The visual color transition is handled
  // at the row level (OptionRow/TypeSelector/FabBar cross-fade their
  // own backgrounds), so the QR snapping is visually consistent: the
  // QR is the "anchor" and the rows are the "tint".  See the
  // Animated SVG primitives comment above for why we don't animate
  // SVG props in Reanimated 4 + react-native-svg 15.
  const fgFill = qrStyle.fgColor;
  const bgFill = qrStyle.bgColor;
  const eyeFill = qrStyle.eyeColor;
  const gradStartFill = qrStyle.gradient.startColor;
  const gradEndFill = qrStyle.gradient.endColor;

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

  // ── Empty state: always render the same Svg tree, just feed it an
  // all-zero matrix.  Returning a different View for the empty state
  // would unmount the entire Svg subtree, and re-mounting it on the
  // next keystroke causes host-instance churn.  With the same Svg tree
  // always mounted, the hosts are stable across value changes.  The
  // placeholder overlay (rendered as a sibling of the Svg inside the
  // same Animated.View) covers the 3 finder eyes so the user sees a
  // proper "enter data" affordance instead of a broken QR with just
  // the eyes visible.
  const effectiveMatrix =
    isEmpty || !matrix
      ? // 21x21 is the smallest standard QR size.  All zeros means no
        // modules are drawn — the eyes are always drawn from the eye
        // positions array, so the placeholder overlay covers them.
        Array.from({ length: 21 }, () => new Array(21).fill(0))
      : matrix;
  const n = effectiveMatrix.length;

  // ── Frame sizing ──
  // The frame's border sits on the outer View; the inner QR is shrunk
  // to (size - 2*framePadding) and centered.  PAD/pw must be computed
  // against innerSize (not the outer size) so the matrix fills the
  // inner view exactly — otherwise the matrix overflows and gets
  // clipped by overflow:hidden.  This is why frames were visually
  // "cropping" the QR: the matrix filled `size` but the view was only
  // `size - 2*framePad` wide.
  //
  // We force `hasFrame = false` when the QR is empty so the placeholder
  // shows a clean canvas (no border, no padding) instead of a "framed
  // empty" — which looks like the frame is leaking styles onto a
  // not-yet-existing QR.
  const userHasFrame = qrStyle.frame !== "none";
  const fStyle = frameStyle(qrStyle.frame, fgFill);
  const framePad = userHasFrame && !isEmpty ? fStyle.padding : 0;
  const innerSize = size - framePad * 2;
  const hasFrame = userHasFrame && !isEmpty;
  const cornerR = qrStyle.qrCorners ?? 20;
  const PAD = Math.round(innerSize * 0.045);
  const pw = (innerSize - PAD * 2) / n;

  // ── Build data module (pixel) paths ──
  const cfg = PIXEL_CFG[qrStyle.pixelShape] ?? PIXEL_CFG.sharp;
  const inset = cfg.inset * pw;
  const drawSz = pw - inset * 2;
  const drawR = cfg.r * drawSz;

  const pieces: string[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!effectiveMatrix[r][c] || inEye(r, c, n)) continue;
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
  // When isEmpty we emit empty path strings for the eyes so the Svg
  // renders NO finder pattern — just the bg rect and a transparent
  // grid (all-zero matrix).  The placeholder overlay then sits on top
  // showing a proper "enter data" affordance.  This way the user
  // never sees grayscale eyes leaking through the placeholder.
  // We also keep the same Path elements in the tree (just with empty
  // `d` attributes) so host-instance stability is preserved.
  const eyePos = [
    { r: 0, c: 0 },
    { r: 0, c: n - 7 },
    { r: n - 7, c: 0 },
  ];
  const eyes = isEmpty
    ? eyePos.map(() => ({ ring: "", pupil: "" }))
    : eyePos.map((e) =>
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
  const piecesFill = useGradient ? `url(#${gradIdRef.current})` : fgFill;

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
        backgroundColor: hasFrame ? bgFill : "transparent",
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
          // When empty, the inner "card" border + shadow disappear so
          // the placeholder reads as a clean canvas.  The dashed border
          // inside the placeholder overlay already provides the "input
          // area" affordance, so we don't need the additional card border.
          borderWidth: isEmpty ? 0 : 1,
          borderColor: isEmpty ? "transparent" : "rgba(0,0,0,0.06)",
          shadowColor: isEmpty ? "transparent" : "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isEmpty ? 0 : 0.08,
          shadowRadius: 8,
          elevation: isEmpty ? 0 : 3,
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
              {/*
                The gradient <Defs> are ALWAYS rendered (not conditional on
                useGradient) so the LinearGradient and Stop host instances
                live for the full lifetime of the QRCanvas.  Conditionally
                rendering them when the user toggled the gradient on/off
                caused a "Cannot find host instance" error: the freshly
                mounted Stop hosts tried to subscribe to a worklet that was
                already bound to the old (now-unmounted) hosts.  The
                LinearGradient is harmless when not referenced (piecesFill
                just doesn't point at it), so leaving it mounted is safe.
                The stop colors are static React props (no animation).
              */}
              <LinearGradient
                id={gradIdRef.current}
                x1={gradCoords.x1}
                y1={gradCoords.y1}
                x2={gradCoords.x2}
                y2={gradCoords.y2}
              >
                <Stop offset="0" stopColor={gradStartFill} />
                <Stop offset="1" stopColor={gradEndFill} />
              </LinearGradient>
            </Defs>
            <Rect
              width={innerSize}
              height={innerSize}
              fill={bgFill}
            />
            {useGradient ? (
              <Path
                d={pieces.join(" ")}
                fill={piecesFill}
              />
            ) : (
              <Path
                d={pieces.join(" ")}
                fill={fgFill}
              />
            )}
            <Path
              d={eyeRingPath}
              fillRule="evenodd"
              fill={eyeFill}
            />
            {hasPupil && <Path d={eyeDotPath} fill={fgFill} />}
          </Svg>
          {/*
            Placeholder overlay — shown when the QR value is empty.  The
            Svg above keeps its host instances mounted (so Reanimated
            doesn't throw "Cannot find host instance" on the next
            keystroke), but the placeholder sits on top so the user
            sees a proper "enter data" affordance instead of a broken
            QR with just the 3 finder eyes.  pointerEvents="none" so
            the overlay never blocks touches on the form below.
          */}
          {isEmpty && (
            <View
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
            >
              {/* Faint grid dots to hint at QR structure.  Drawn over
                  the bg rect only — eyes are now fully suppressed
                  above so there's no risk of grayscale eyes bleeding
                  through.  These dots use the QR fg color at low alpha
                  so they read as a subtle "pattern" without competing
                  with the dashed border below. */}
              {Array.from({ length: n }, (_, r) =>
                Array.from({ length: n }, (_, c) => (
                  <View
                    key={`dot-${r}-${c}`}
                    style={{
                      position: "absolute",
                      left: PAD + c * pw + pw * 0.18,
                      top: PAD + r * pw + pw * 0.18,
                      width: pw * 0.64,
                      height: pw * 0.64,
                      borderRadius: pw * 0.18,
                      backgroundColor: fgFill + "10",
                    }}
                  />
                )),
              )}
              {/* Dashed border + label */}
              <View
                style={{
                  position: "absolute",
                  top: innerSize * 0.22,
                  left: innerSize * 0.22,
                  right: innerSize * 0.22,
                  bottom: innerSize * 0.22,
                  borderRadius: innerSize * 0.04,
                  borderWidth: 1.5,
                  borderStyle: "dashed",
                  borderColor: fgFill + "50",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <View
                  style={{
                    width: innerSize * 0.07,
                    height: innerSize * 0.07,
                    borderRadius: innerSize * 0.018,
                    backgroundColor: fgFill + "55",
                  }}
                />
                <View
                  style={{
                    width: innerSize * 0.04,
                    height: innerSize * 0.04,
                    borderRadius: innerSize * 0.02,
                    backgroundColor: fgFill + "40",
                  }}
                />
              </View>
            </View>
          )}
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
