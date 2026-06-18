import { useMemo, useLayoutEffect, useRef, useState, useCallback } from "react";
import { View, Text, StyleSheet, PanResponder, Image } from "react-native";
import Svg, {
  Rect,
  Path,
  Defs,
  LinearGradient,
  Stop,
  Image as SvgImage,
  Circle,
  ClipPath,
} from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import {
  QRStyle,
  ECL,
  EyeShape,
  PupilShape,
  PixelShape,
  FrameStyle,
  LogoStyleConfig,
} from "@/types/qr";

const QRLib = require("qrcode");

interface Props {
  value: string;
  qrStyle: QRStyle;
  size: number;
  /** When true the gen entrance animation is skipped (e.g. history detail). */
  skipAnimation?: boolean;
  /** Logo props — when provided, the logo is rendered INSIDE the SVG
   *  (as an <Image> element) so captureRef on Android captures it.
   *  The separate LogoOverlay component is NOT used alongside this. */
  logoUri?: string;
  logoSize?: number;
  logoStyle?: LogoStyleConfig;
  logoBgColor?: string;
  logoPosition?: { x: number; y: number };
  onLogoPositionChange?: (pos: { x: number; y: number }) => void;
}

// ─── Matrix ───────────────────────────────────────────────────────────────────
function getMatrix(
  data: string,
  ecl: string,
): { matrix: boolean[][] | null; error: string | null } {
  try {
    const qr = QRLib.create(data, { errorCorrectionLevel: ecl });
    const n = qr.modules.size;
    const m: boolean[][] = Array.from({ length: n }, (_, r) =>
      Array.from({ length: n }, (__, c) => !!qr.modules.get(r, c)),
    );
    return { matrix: m, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[QRCanvas] getMatrix failed:", e);
    return { matrix: null, error: msg };
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
  const hw = R * 0.92;
  const hh = R * 0.55;
  const dip = cy - R * 0.18;
  return (
    `M ${cx} ${cy + R}` +
    ` C ${cx - hw * 0.2} ${cy + R * 0.45} ${cx - hw} ${dip + hh * 0.1} ${cx - hw} ${dip - hh * 0.4}` +
    ` C ${cx - hw} ${dip - hh} ${cx} ${dip - hh} ${cx} ${dip}` +
    ` C ${cx} ${dip - hh} ${cx + hw} ${dip - hh} ${cx + hw} ${dip - hh * 0.4}` +
    ` C ${cx + hw} ${dip + hh * 0.1} ${cx + hw * 0.2} ${cy + R * 0.45} ${cx} ${cy + R} Z`
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

// ─── Pupil scaling per eye shape ──────────────────────────────────────────────
// Some eye shapes have an inner cut whose narrowest cross-section is
// smaller than its 5*pw bounding box:
//   • `plus`  — arms are 0.45*pw wide → circle pupil of radius 1.5*pw
//                spills well past the arms into the corners.
//   • `star`  — waist is 0.382*5*pw = 1.91*pw from center → circle pupil
//                of radius 1.5*pw pokes out of the waist.
//   • `heart` — narrows to a point at the bottom; wide in the lobes.
//   • `diamond`/`hexagon`/`octagon` — apothem is shorter than circumradius,
//                so a circle pupil fits but only just.
//   • `pill`  — the inner cut is a horizontally-stretched pill; a circle
//                pupil fits the height but extends past the rounded
//                ends.
// We scale the pupil down for these so it never bleeds onto the
// eye's `eyeFill`.  Geometric eyes (sharp/soft/round) and `dot`
// (no inner cut, pupil is just a smaller disc on top) keep a
// multiplier of 1.
const EYE_PUPIL_SCALE: Record<EyeShape, number> = {
  sharp: 1.0,
  soft: 1.0,
  round: 1.0,
  pill: 0.78,
  leaf: 0.9,
  diamond: 0.7,
  shield: 0.85,
  dot: 1.0,
  heart: 0.7,
  hexagon: 0.78,
  plus: 0.55,
  star: 0.7,
  octagon: 0.85,
};

// ─── Pupil path generator ─────────────────────────────────────────────────────
// The pupil is the 3×3 solid shape at the center of each finder eye.  It is
// styled independently of the eye shape, so a round eye can have a star
// pupil, a heart eye can have a cross pupil, etc.  When `pupilShape` is
// "none", the pupil path is empty and the eye renders without a center dot.
//
// `sizeMul` is a per-eye multiplier (see EYE_PUPIL_SCALE) that shrinks
// the pupil so it stays inside the eye's inner cut.  Pupil motifs with
// extra "reach" (star points, heart lobes) use a smaller intrinsic
// multiplier inside the switch as well, on top of `sizeMul`.
//
// The pupil is ALWAYS centered at the eye's inner-cut center
// (ox + 3.5·pw, oy + 3.5·pw) regardless of `sizeMul`.  Only the SIZE
// scales — the POSITION stays fixed so the pupil never drifts toward
// the top-left when `sizeMul` shrinks it.
function pupilPath(
  shape: PupilShape,
  ox: number,
  oy: number,
  pw: number,
  sizeMul: number,
): string {
  const D = 3 * pw * sizeMul;
  // Fixed center of the eye's inner cut (5·pw square starting at ox+pw).
  const cxP = ox + 3.5 * pw;
  const cyP = oy + 3.5 * pw;
  if (shape === "none") return "";
  switch (shape) {
    case "dot":
      return circlePath(cxP, cyP, D * 0.5);
    case "square":
      return rrCW(cxP - D / 2, cyP - D / 2, D, D, 0);
    case "ring":
      return ringPath(cxP, cyP, D * 0.5, D * 0.28);
    case "cross":
      return crossPath(cxP, cyP, D * 0.5);
    case "diamond":
      return diamondPath(cxP, cyP, D * 0.5);
    case "star":
      return star5Path(cxP, cyP, D * 0.5);
    case "heart":
      return heartPath(cxP, cyP, D * 0.45);
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
  // Scale the pupil by the per-eye multiplier so it stays inside the
  // inner cut.  See EYE_PUPIL_SCALE.
  const pupil = pupilPath(pupilShape, ox, oy, pw, EYE_PUPIL_SCALE[eyeShape]);
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
export function QRCanvas({
  value,
  qrStyle,
  size,
  skipAnimation,
  logoUri,
  logoSize = 60,
  logoStyle: logoCfg,
  logoBgColor = "#ffffff",
  logoPosition: savedPos,
  onLogoPositionChange,
}: Props) {
  const isEmpty = !value || !value.trim();

  // When a logo is overlaid, auto-bump ECL to H (30% recovery) if the
  // user's chosen level is lower.  This prevents unscannable QR codes
  // where the logo obscures data modules that only have M/Q redundancy.
  const ECL_ORDER: ECL[] = ["L", "M", "Q", "H"];
  const effectiveEcl = useMemo(() => {
    if (!logoUri) return qrStyle.ecl;
    const idx = ECL_ORDER.indexOf(qrStyle.ecl);
    return ECL_ORDER[Math.max(idx, 3)]; // 3 = "H"
  }, [logoUri, qrStyle.ecl]);

  const { matrix, error: matrixError } = useMemo(
    () =>
      isEmpty
        ? { matrix: null, error: null }
        : getMatrix(value, effectiveEcl),
    [value, effectiveEcl, isEmpty],
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
  // The old double-assignment pattern (value=0; value=withTiming(...))
  // caused a race condition on production Hermes where both assignments
  // hit the UI thread simultaneously, leaving genProgress stuck at 0
  // (55% opacity).  Fixed by removing the redundant reset — the shared
  // value is already 0 from initialization or the isEmpty branch.
  const genProgress = useSharedValue(skipAnimation ? 1 : 0);
  const localDidGenerate = useRef(false);
  const genStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + genProgress.value * 0.45,
    transform: [
      { scale: 0.97 + genProgress.value * 0.03 },
    ],
  }));

  useLayoutEffect(() => {
    if (skipAnimation) {
      genProgress.value = 1;
      return;
    }
    if (!isEmpty && matrix && !localDidGenerate.current) {
      localDidGenerate.current = true;
      genProgress.value = withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      });
    } else if (isEmpty) {
      localDidGenerate.current = false;
      genProgress.value = 0;
    }
  }, [isEmpty, matrix, skipAnimation]);

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

  // ── Logo position (inside SVG, draggable via overlay PanResponder) ──
  const hasLogo = !!logoUri && !isEmpty;
  const logoMerged = { background: "rounded" as const, padding: 10, border: true, shadow: true, ...logoCfg };
  const logoPad = (logoMerged.padding / 100) * logoSize;
  const logoPlateSz = logoSize + logoPad * 2;
  const logoPlateR = logoMerged.background === "circle" ? logoPlateSz * 0.5
    : logoMerged.background === "rounded" ? Math.min(logoPlateSz * 0.22, 16)
    : 0;
  const logoDefaultX = (innerSize - logoPlateSz) / 2;
  const logoDefaultY = (innerSize - logoPlateSz) / 2;
  const [logoPos, setLogoPos] = useState(
    savedPos ?? { x: logoDefaultX, y: logoDefaultY },
  );
  const logoPosRef = useRef(savedPos ?? { x: logoDefaultX, y: logoDefaultY });
  const logoPanOrigin = useRef({ x: 0, y: 0 });
  const logoMaxX = innerSize - logoPlateSz;
  const logoMaxY = innerSize - logoPlateSz;

  // Shared values for smooth drag (UI thread, no React re-renders).
  const logoDragX = useSharedValue(savedPos?.x ?? logoDefaultX);
  const logoDragY = useSharedValue(savedPos?.y ?? logoDefaultY);
  const [isDragging, setIsDragging] = useState(false);

  const logoDragStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: logoDragX.value },
      { translateY: logoDragY.value },
    ],
  }));

  const logoPan = useRef<ReturnType<typeof PanResponder.create> | null>(null);
  const logoHitSlop = 20;
  if (hasLogo && onLogoPositionChange && !logoPan.current) {
    logoPan.current = PanResponder.create({
      onStartShouldSetPanResponder: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        const lx = logoPosRef.current.x;
        const ly = logoPosRef.current.y;
        return (
          locationX >= lx - logoHitSlop &&
          locationX <= lx + logoPlateSz + logoHitSlop &&
          locationY >= ly - logoHitSlop &&
          locationY <= ly + logoPlateSz + logoHitSlop
        );
      },
      onMoveShouldSetPanResponder: (_, g) => {
        return Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4;
      },
      onPanResponderGrant: () => {
        logoPanOrigin.current = { ...logoPosRef.current };
        logoDragX.value = logoPosRef.current.x;
        logoDragY.value = logoPosRef.current.y;
        setIsDragging(true);
      },
      onPanResponderMove: (_, g) => {
        const nx = Math.max(0, Math.min(logoMaxX, logoPanOrigin.current.x + g.dx));
        const ny = Math.max(0, Math.min(logoMaxY, logoPanOrigin.current.y + g.dy));
        logoPosRef.current = { x: nx, y: ny };
        logoDragX.value = nx;
        logoDragY.value = ny;
      },
      onPanResponderRelease: () => {
        const pos = { ...logoPosRef.current };
        setIsDragging(false);
        setLogoPos(pos);
        onLogoPositionChange(pos);
      },
    });
  } else if ((!hasLogo || !onLogoPositionChange) && logoPan.current) {
    logoPan.current = null;
  }

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
              {/* Logo clipPath — clips the logo image to the plate shape
                  (circle/rounded/square).  Always rendered so host instance
                  is stable; the clipPath geometry updates with logoPos. */}
              {logoUri && !isEmpty && (() => {
                const px = logoPos.x;
                const py = logoPos.y;
                const clipId = `logoClip_${gradIdRef.current}`;
                if (logoMerged.background === "none") return null;
                return (
                  <ClipPath id={clipId}>
                    {logoMerged.background === "circle" ? (
                      <Circle cx={px + logoPlateSz / 2} cy={py + logoPlateSz / 2} r={logoPlateSz / 2} />
                    ) : (
                      <Rect x={px} y={py} width={logoPlateSz} height={logoPlateSz} rx={logoPlateR} ry={logoPlateR} />
                    )}
                  </ClipPath>
                );
              })()}
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

            {/* ── Logo (inside SVG for captureRef compatibility) ──
                renderToHardwareTextureAndroid and captureRef on Android
                cannot reliably capture absolutely-positioned React Views.
                By rendering the logo as an SVG <Image> inside the same SVG
                as the QR content, captureRef captures both as a single bitmap.
                A React Native overlay (below the SVG) shows the same logo
                visually — it's always rendered so there's no transition
                flash when drag starts.  The SVG logo stays for captureRef
                and is visually hidden behind the overlay. */}
            {logoUri && !isEmpty && !isDragging && (() => {
              const px = logoPos.x;
              const py = logoPos.y;
              const clipId = `logoClip_${gradIdRef.current}`;
              return (
                <>
                  {logoMerged.background !== "none" && (
                    <Rect
                      x={px}
                      y={py}
                      width={logoPlateSz}
                      height={logoPlateSz}
                      rx={logoPlateR}
                      ry={logoPlateR}
                      fill={logoBgColor}
                      stroke="#00000018"
                      strokeWidth={logoMerged.border ? 1.5 : 0}
                    />
                  )}
                  <SvgImage
                    x={px + logoPad}
                    y={py + logoPad}
                    width={logoSize}
                    height={logoSize}
                    href={logoUri}
                    preserveAspectRatio="xMidYMid meet"
                    clipPath={logoMerged.background !== "none" ? `url(#${clipId})` : undefined}
                  />
                </>
              );
            })()}
          </Svg>
          {/*
            Logo overlay — always rendered so there's no SVG→overlay
            transition flash on drag start.  During drag the shared
            values drive 60fps movement; at rest the overlay sits at
            the same position as the SVG logo beneath it (which is
            kept for captureRef compatibility).
            The Image lives INSIDE the plate View so overflow:"hidden"
            clips it to the plate's rounded rect — identical to the
            SVG clipPath approach.
          */}
          {hasLogo && !!onLogoPositionChange && (() => {
            return (
              <Animated.View
                pointerEvents="none"
                style={[
                  { position: "absolute", width: logoPlateSz, height: logoPlateSz },
                  logoDragStyle,
                ]}
              >
                {logoMerged.background !== "none" ? (
                  <View
                    style={{
                      width: logoPlateSz,
                      height: logoPlateSz,
                      borderRadius: logoPlateR,
                      backgroundColor: logoBgColor,
                      borderWidth: logoMerged.border ? 1.5 : 0,
                      borderColor: "#00000018",
                      overflow: "hidden",
                    }}
                  >
                    <Image
                      source={{ uri: logoUri }}
                      style={{
                        position: "absolute",
                        left: logoPad,
                        top: logoPad,
                        width: logoSize,
                        height: logoSize,
                      }}
                      resizeMode="contain"
                    />
                  </View>
                ) : (
                  <Image
                    source={{ uri: logoUri }}
                    style={{
                      position: "absolute",
                      left: logoPad,
                      top: logoPad,
                      width: logoSize,
                      height: logoSize,
                    }}
                    resizeMode="contain"
                  />
                )}
              </Animated.View>
            );
          })()}
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
          {/* Render error overlay when getMatrix fails */}
          {matrixError && !isEmpty && (
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: "#ff6b6b",
                  borderRadius: cornerR,
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 12,
                },
              ]}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: "600",
                  textAlign: "center",
                  fontFamily: "monospace",
                }}
                numberOfLines={6}
              >
                QR ERROR: {matrixError}
              </Text>
            </View>
          )}
          {/* Logo drag gesture capture — transparent overlay that captures
              touch gestures.  During drag the animated overlay above shows
              the logo; this View just captures pan gestures. */}
          {hasLogo && !!onLogoPositionChange && logoPan.current && (
            <View
              {...logoPan.current.panHandlers}
              style={StyleSheet.absoluteFill}
            />
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
  // Preview uses a generic 1.0 multiplier (no per-eye scaling) so the
  // pupil shape is fully visible in the picker.  The actual QR uses
  // EYE_PUPIL_SCALE[eyeShape] to fit the pupil into the inner cut.
  pupil: (shape: PupilShape, x: number, y: number, s: number): string => {
    const pw = s / 7;
    return pupilPath(shape, x, y, pw, 1.0);
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
