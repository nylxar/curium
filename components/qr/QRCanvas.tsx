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
  const t = s * 0.48;
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
  const r = R * 0.35;
  return (
    `M${cx},${cy - R}` +
    `C${cx + r},${cy - r} ${cx + r},${cy - r} ${cx + R},${cy}` +
    `C${cx + r},${cy + r} ${cx + r},${cy + r} ${cx},${cy + R}` +
    `C${cx - r},${cy + r} ${cx - r},${cy + r} ${cx - R},${cy}` +
    `C${cx - r},${cy - r} ${cx - r},${cy - r} ${cx},${cy - R}Z`
  );
}

// ─── Qewie-like anatomical refinement shapes ───────────────────────────────
// These modify the base square module's curvature and flow rather than
// replacing it with an explicit geometric icon.  High fill ratio ensures
// timing/alignment patterns remain scannable.

function petalPath(cx: number, cy: number, R: number): string {
  const pr = R * 0.42;
  const d = R * 0.58;
  return (
    `M${cx - pr},${cy - d}` +
    `A${pr},${pr} 0 1 1 ${cx + pr},${cy - d}` +
    `L${cx + d},${cy - pr}` +
    `A${pr},${pr} 0 1 1 ${cx + d},${cy + pr}` +
    `L${cx + pr},${cy + d}` +
    `A${pr},${pr} 0 1 1 ${cx - pr},${cy + d}` +
    `L${cx - d},${cy + pr}` +
    `A${pr},${pr} 0 1 1 ${cx - d},${cy - pr}Z`
  );
}

function burstPath(cx: number, cy: number, R: number): string {
  const n = 8;
  const innerR = R * 0.55;
  let d = "";
  for (let i = 0; i < n; i++) {
    const a1 = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const aMid = -Math.PI / 2 + ((i + 0.5) * 2 * Math.PI) / n;
    const a2 = -Math.PI / 2 + ((i + 1) * 2 * Math.PI) / n;
    const tipX = cx + Math.cos(a1) * R;
    const tipY = cy + Math.sin(a1) * R;
    const ctrlX = cx + Math.cos(aMid) * innerR;
    const ctrlY = cy + Math.sin(aMid) * innerR;
    const nextTipX = cx + Math.cos(a2) * R;
    const nextTipY = cy + Math.sin(a2) * R;
    if (i === 0) d += `M${tipX.toFixed(2)},${tipY.toFixed(2)}`;
    d += `Q${ctrlX.toFixed(2)},${ctrlY.toFixed(2)} ${nextTipX.toFixed(2)},${nextTipY.toFixed(2)}`;
  }
  return d + "Z";
}

function smoothPath(x: number, y: number, w: number, h: number, r: number): string {
  return rrCW(x, y, w, h, r);
}

function flowPath(cx: number, cy: number, hs: number): string {
  const w = hs * 0.92;
  const h = hs * 0.82;
  const r = hs * 0.35;
  const x = cx - w;
  const y = cy - h;
  const ww = w * 2;
  const hh = h * 2;
  const cr = Math.min(r, ww / 2, hh / 2);
  return (
    `M${x + cr},${y}` +
    `C${x + ww - cr},${y} ${x + ww},${y + cr} ${x + ww},${y + cr}` +
    `V${y + hh - cr}` +
    `C${x + ww},${y + hh} ${x + ww - cr},${y + hh} ${x + ww - cr},${y + hh}` +
    `H${x + cr}` +
    `C${x},${y + hh} ${x},${y + hh - cr} ${x},${y + hh - cr}` +
    `V${y + cr}` +
    `C${x},${y} ${x + cr},${y} ${x + cr},${y}Z`
  );
}

function blobPath(cx: number, cy: number, hs: number): string {
  // Irregular organic shape — asymmetric pebble/water-droplet feel.
  // Varying radii and control points create a non-uniform outline
  // that reads as distinctly different from the perfect circle of `dots`.
  const r = hs * 0.82;
  return (
    `M${cx},${cy - r * 0.92}` +
    `C${cx + r * 0.62},${cy - r * 0.88} ${cx + r * 0.95},${cy - r * 0.38} ${cx + r * 0.88},${cy + r * 0.12}` +
    `C${cx + r * 0.82},${cy + r * 0.58} ${cx + r * 0.38},${cy + r * 0.95} ${cx - r * 0.08},${cy + r * 0.92}` +
    `C${cx - r * 0.52},${cy + r * 0.88} ${cx - r * 0.92},${cy + r * 0.48} ${cx - r * 0.88},${cy - r * 0.05}` +
    `C${cx - r * 0.85},${cy - r * 0.52} ${cx - r * 0.45},${cy - r * 0.92} ${cx},${cy - r * 0.92}Z`
  );
}

function chevronPath(cx: number, cy: number, hs: number): string {
  const w = hs * 0.85;
  const h = hs * 0.65;
  const t = hs * 0.3;
  return (
    `M${cx - w},${cy + h * 0.25}` +
    `L${cx},${cy - h}` +
    `L${cx + w},${cy + h * 0.25}` +
    `L${cx + w - t},${cy + h * 0.25}` +
    `L${cx},${cy - h + t * 1.7}` +
    `L${cx - w + t},${cy + h * 0.25}Z`
  );
}

function wavePath(cx: number, cy: number, s: number): string {
  const hw = s * 0.48;
  const hh = s * 0.32;
  const amp = s * 0.16;
  return (
    `M${cx - hw},${cy - amp}` +
    `Q${cx - hw * 0.5},${cy - amp * 2} ${cx},${cy - amp}` +
    `Q${cx + hw * 0.5},${cy} ${cx + hw},${cy - amp}` +
    `L${cx + hw},${cy + amp}` +
    `Q${cx + hw * 0.5},${cy + amp * 2} ${cx},${cy + amp}` +
    `Q${cx - hw * 0.5},${cy} ${cx - hw},${cy + amp}Z`
  );
}

// ─── Neighbor detection ───────────────────────────────────────────────────────
// Ported from kozakdenys/qr-code-styling + yadav-saurabh/qrGrid.
// 4-directional (cardinal) neighbor check — the proven pattern used by every
// scannable QR styling library.
function getNeighbor(
  matrix: boolean[][],
  r: number,
  c: number,
  n: number,
  dr: number,
  dc: number,
): boolean {
  const rr = r + dr;
  const cc = c + dc;
  return rr >= 0 && rr < n && cc >= 0 && cc < n && !!matrix[rr][cc];
}
function countNeighbors(
  matrix: boolean[][],
  r: number,
  c: number,
  n: number,
): number {
  return (
    +getNeighbor(matrix, r, c, n, -1, 0) +
    +getNeighbor(matrix, r, c, n, 1, 0) +
    +getNeighbor(matrix, r, c, n, 0, -1) +
    +getNeighbor(matrix, r, c, n, 0, 1)
  );
}
// Per-corner rounding for fused rectangular styles.
// Each corner is rounded only when there is NO neighbor on BOTH adjacent sides.
// This creates the qr-code-styling "rounded" behavior: isolated modules become
// circles, modules in chains become squares, corner modules get one rounded corner.
function rrAdaptive(
  x: number,
  y: number,
  w: number,
  h: number,
  baseR: number,
  tl: boolean,
  tr: boolean,
  br: boolean,
  bl: boolean,
): string {
  const tlR = tl ? baseR : 0;
  const trR = tr ? baseR : 0;
  const brR = br ? baseR : 0;
  const blR = bl ? baseR : 0;
  const maxR = Math.min(w / 2, h / 2);
  const clamp = (v: number) => Math.min(v, maxR);
  const a = clamp(tlR);
  const b = clamp(trR);
  const c = clamp(brR);
  const d = clamp(blR);
  return (
    `M${x + a},${y}` +
    `H${x + w - b}` +
    `Q${x + w},${y} ${x + w},${y + b}` +
    `V${y + h - c}` +
    `Q${x + w},${y + h} ${x + w - c},${y + h}` +
    `H${x + d}` +
    `Q${x},${y + h} ${x},${y + h - d}` +
    `V${y + a}` +
    `Q${x},${y} ${x + a},${y}Z`
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
  | "sparkle"
  | "smooth"
  | "flow"
  | "blob"
  | "chevron"
  | "wave";
const PIXEL_CFG: Record<PixelShape, { r: number; inset: number; type: PixelShapeKind }> = {
  // ── Fused styles ──
  sharp: { r: 0, inset: 0.04, type: "rect" },
  soft: { r: 0.2, inset: 0.06, type: "rect" },
  round: { r: 0.38, inset: 0.08, type: "rect" },
  glued: { r: 0.28, inset: 0, type: "rect" },
  liquid: { r: 0.5, inset: -0.02, type: "rect" },
  smooth: { r: 0.18, inset: -0.01, type: "smooth" },
  flow: { r: 0.25, inset: -0.01, type: "flow" },
  // ── Individual shapes ──
  dots: { r: 0.5, inset: 0.1, type: "circle" },
  blob: { r: 0.35, inset: 0.04, type: "blob" },
  diamond: { r: 0, inset: 0.08, type: "diamond" },
  cross: { r: 0, inset: 0.08, type: "cross" },
  star: { r: 0.1, inset: 0.1, type: "star" },
  plus: { r: 0, inset: 0.05, type: "plus" },
  triangle: { r: 0, inset: 0.08, type: "triangle" },
  hexagon: { r: 0, inset: 0.06, type: "hexagon" },
  heart: { r: 0, inset: 0.08, type: "heart" },
  sparkle: { r: 0, inset: 0.06, type: "sparkle" },
  chevron: { r: 0, inset: 0.03, type: "chevron" },
  wave: { r: 0, inset: 0.04, type: "wave" },
};

// ─── Eye shape config ─────────────────────────────────────────────────────────
// Each eye has an OUTER ring shape, an INNER cutout, and a PUPIL.
// The inner cutout always matches the outer shape's contour (just smaller),
// creating a clean ring with uniform visual weight.  The pupil sits in the
// 5×5 hole and is always centered at (ox+3.5pw, oy+3.5pw).
function eyeShapePaths(
  shape: EyeShape,
  ox: number,
  oy: number,
  pw: number,
): { outer: string; innerCut: string } {
  const O = 7 * pw;
  const I = 5 * pw;
  const cx = ox + O / 2;
  const cy = oy + O / 2;

  switch (shape) {
    case "sharp":
      return {
        outer: `M${ox},${oy}h${O}v${O}h-${O}Z`,
        innerCut: `M${ox + pw},${oy + pw}h${I}v${I}h-${I}Z`,
      };
    case "soft":
      return {
        outer: rrCW(ox, oy, O, O, pw * 0.6),
        innerCut: rrCW(ox + pw, oy + pw, I, I, pw * 0.5),
      };
    case "round":
      return {
        outer: rrCW(ox, oy, O, O, pw * 1.2),
        innerCut: rrCW(ox + pw, oy + pw, I, I, pw * 1.0),
      };
    case "pill":
      return {
        outer: rrCW(ox, oy, O, O, O * 0.5),
        innerCut: rrCW(ox + pw, oy + pw, I, I, I * 0.5),
      };
    case "dot":
      return {
        outer: circlePath(cx, cy, O * 0.5),
        innerCut: circlePath(cx, cy, I * 0.5),
      };
    case "shield": {
      const build = (size: number, oox: number, ooy: number): string => {
        const r = size * 0.28;
        return (
          `M${oox + r},${ooy}H${oox + size - r}` +
          `Q${oox + size},${ooy} ${oox + size},${ooy + r}` +
          `V${ooy + size * 0.55}` +
          `Q${oox + size},${ooy + size * 0.78} ${oox + size * 0.5},${ooy + size}` +
          `Q${oox},${ooy + size * 0.78} ${oox},${ooy + size * 0.55}` +
          `V${ooy + r}` +
          `Q${oox},${ooy} ${oox + r},${ooy}Z`
        );
      };
      return {
        outer: build(O, ox, oy),
        innerCut: build(I, ox + pw, oy + pw),
      };
    }
    case "hexagon":
      return {
        outer: hexagonPath(cx, cy, O * 0.5),
        innerCut: hexagonPath(cx, cy, I * 0.5),
      };
    case "octagon":
      return {
        outer: octagonPath(cx, cy, O * 0.5),
        innerCut: octagonPath(cx, cy, I * 0.5),
      };
  }
  return { outer: "", innerCut: "" };
}

// ─── Single-path pupil generator ─────────────────────────────────────────────
// Each shape renders ONE SVG path filling the 3×3 center area (9×pw × 9×pw).
// dagronf/QRCode approach: clean, iconic, scannable.
function pupilPath(
  shape: PupilShape,
  ox: number,
  oy: number,
  pw: number,
): string {
  if (shape === "none" || shape === "pixel") return "";
  const D = 3 * pw;
  const cx = ox + 3.5 * pw;
  const cy = oy + 3.5 * pw;
  const R = D / 2;
  switch (shape) {
    case "dot":    return circlePath(cx, cy, R);
    case "square": return rrCW(cx - R, cy - R, D, D, pw * 0.15);
    case "diamond": return diamondPath(cx, cy, R);
    case "cross":  return crossPath(cx, cy, R);
    case "hexagon": return hexagonPath(cx, cy, R);
    case "octagon": return octagonPath(cx, cy, R);
    case "shield": {
      const r = D * 0.28;
      return (
        `M${cx - R + r},${cy - R}H${cx + R - r}` +
        `Q${cx + R},${cy - R} ${cx + R},${cy - R + r}` +
        `V${cy + R * 0.1}` +
        `Q${cx + R},${cy + R * 0.56} ${cx},${cy + R}` +
        `Q${cx - R},${cy + R * 0.56} ${cx - R},${cy + R * 0.1}` +
        `V${cy - R + r}` +
        `Q${cx - R},${cy - R} ${cx - R + r},${cy - R}Z`
      );
    }
    case "star":  return nStarPath(cx, cy, R, 5, 0.55);
    case "heart": return heartPath(cx, cy, R * 1.3);
    case "blob":  return blobPath(cx, cy, R * 1.1);
    // ─── MD3 expressive shapes ──
    case "dome": {
      // Tall dome: extends from R above center to R below center, filling the full 3×3 area.
      // Top is a semicircle, bottom is a flat base near cy+R.
      const baseY = cy + R * 0.92;
      const topY = cy - R;
      return (
        `M${cx - R * 0.92},${baseY}` +
        `L${cx - R * 0.92},${cy - R * 0.1}` +
        `Q${cx - R * 0.92},${topY} ${cx},${topY}` +
        `Q${cx + R * 0.92},${topY} ${cx + R * 0.92},${cy - R * 0.1}` +
        `L${cx + R * 0.92},${baseY}Z`
      );
    }
    case "oval": {
      // Fat horizontal ellipse — fills most of the 3×3 area.
      const rx = R * 0.95;
      const ry = R * 0.82;
      return (
        `M${cx - rx},${cy}a${rx},${ry} 0 1,0 ${rx * 2},0a${rx},${ry} 0 1,0 -${rx * 2},0`
      );
    }
    case "pentagon": return polygonPath(cx, cy, R, 5);
    case "scallop": {
      // Wavy/scalloped circle — 8 bumps around a circle.
      const bumps = 8;
      const innerR = R * 0.82;
      let d = "";
      for (let i = 0; i < bumps; i++) {
        const a1 = -Math.PI / 2 + (i * 2 * Math.PI) / bumps;
        const aMid = -Math.PI / 2 + ((i + 0.5) * 2 * Math.PI) / bumps;
        const a2 = -Math.PI / 2 + ((i + 1) * 2 * Math.PI) / bumps;
        const tipX = cx + Math.cos(a1) * R;
        const tipY = cy + Math.sin(a1) * R;
        const ctrlX = cx + Math.cos(aMid) * innerR;
        const ctrlY = cy + Math.sin(aMid) * innerR;
        const nextTipX = cx + Math.cos(a2) * R;
        const nextTipY = cy + Math.sin(a2) * R;
        if (i === 0) d += `M${tipX.toFixed(2)},${tipY.toFixed(2)}`;
        d += `Q${ctrlX.toFixed(2)},${ctrlY.toFixed(2)} ${nextTipX.toFixed(2)},${nextTipY.toFixed(2)}`;
      }
      return d + "Z";
    }
    case "cloud": {
      // Organic cloud — 3 large overlapping circles filling the 3×3 area.
      const cR = R * 0.72;
      const offset = R * 0.35;
      return (
        circlePath(cx - offset, cy + R * 0.12, cR) +
        circlePath(cx, cy - R * 0.18, cR * 1.05) +
        circlePath(cx + offset, cy + R * 0.12, cR)
      );
    }
    case "droplet": {
      // Teardrop — pointed top, round bottom.
      return (
        `M${cx},${cy - R}` +
        `C${cx + R * 0.15},${cy - R * 0.7} ${cx + R * 0.85},${cy - R * 0.1} ${cx + R * 0.85},${cy + R * 0.2}` +
        `A${R * 0.85},${R * 0.85} 0 1,1 ${cx - R * 0.85},${cy + R * 0.2}` +
        `C${cx - R * 0.85},${cy - R * 0.1} ${cx - R * 0.15},${cy - R * 0.7} ${cx},${cy - R}Z`
      );
    }
  }
  return "";
}

// ─── Draw one finder eye — returns ring path ───────────────────────────────────
function drawEye(
  eyeRow: number,
  eyeCol: number,
  pw: number,
  pad: number,
  eyeShape: EyeShape,
): string {
  const ox = pad + eyeCol * pw;
  const oy = pad + eyeRow * pw;
  const { outer, innerCut } = eyeShapePaths(eyeShape, ox, oy, pw);
  return `${outer} ${innerCut}`;
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
  // Rect types: neighbor-aware per-corner radius (qr-code-styling approach).
  // Other shapes: static inset, no neighbor logic.
  const cfg = PIXEL_CFG[qrStyle.pixelShape] ?? PIXEL_CFG.sharp;
  const isRect = cfg.type === "rect";
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

      if (isRect) {
        const nc = countNeighbors(effectiveMatrix, r, c, n);
        const hasL = getNeighbor(effectiveMatrix, r, c, n, 0, -1);
        const hasR = getNeighbor(effectiveMatrix, r, c, n, 0, 1);
        const hasT = getNeighbor(effectiveMatrix, r, c, n, -1, 0);
        const hasB = getNeighbor(effectiveMatrix, r, c, n, 1, 0);
        const baseR = cfg.r * drawSz;
        const rScale = nc === 0 ? 1.3 : nc === 1 ? 0.9 : nc === 2 ? 0.5 : 0.2;
        pieces.push(rrAdaptive(x, y, drawSz, drawSz, baseR * rScale, !hasT && !hasL, !hasT && !hasR, !hasB && !hasR, !hasB && !hasL));
      } else {
        switch (cfg.type) {
          case "circle": pieces.push(circlePath(cx, cy, drawSz / 2)); break;
          case "diamond": pieces.push(diamondPath(cx, cy, drawSz / 2)); break;
          case "cross": pieces.push(crossPath(cx, cy, drawSz / 2)); break;
          case "star": pieces.push(star5Path(cx, cy, drawSz * 0.55)); break;
          case "plus": pieces.push(plusPath(cx, cy, drawSz * 0.5, drawSz * 0.16)); break;
          case "triangle": pieces.push(trianglePath(cx, cy, drawSz * 0.55)); break;
          case "hexagon": pieces.push(hexagonPath(cx, cy, drawSz * 0.55)); break;
          case "heart": pieces.push(heartPath(cx, cy, drawSz * 0.55)); break;
          case "sparkle": pieces.push(sparklePath(cx, cy, drawSz * 0.5)); break;
          case "smooth": pieces.push(smoothPath(x, y, drawSz, drawSz, drawR)); break;
          case "flow": pieces.push(flowPath(cx, cy, drawSz / 2)); break;
          case "blob": pieces.push(blobPath(cx, cy, drawSz / 2)); break;
          case "chevron": pieces.push(chevronPath(cx, cy, drawSz * 0.55)); break;
          case "wave": pieces.push(wavePath(cx, cy, drawSz)); break;
          default: pieces.push(rrCW(x, y, drawSz, drawSz, drawR)); break;
        }
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
  const eyeRingPath = isEmpty
    ? ""
    : eyePos.map((e) => drawEye(e.r, e.c, pw, PAD, qrStyle.eyeShape)).join(" ");

  // ── Pupil rendering ──
  // Two modes: single-path (default) fills 3×3 with one SVG shape.
  // "pixel" mode renders 9 per-module shapes using the current pixelShape.
  const hasPupil = !isEmpty && qrStyle.pupilShape !== "none";
  const isGridPupil = qrStyle.pupilShape === "pixel";
  const pupilPieces: string[] = [];
  const eyeDotPath = isEmpty
    ? ""
    : hasPupil && !isGridPupil
      ? eyePos.map((e) => {
          const ox = PAD + e.c * pw;
          const oy = PAD + e.r * pw;
          return pupilPath(qrStyle.pupilShape, ox, oy, pw);
        }).join(" ")
      : "";

  // Per-module grid pupil (pixel mode)
  if (hasPupil && isGridPupil) {
    const pCfg = PIXEL_CFG[qrStyle.pixelShape] ?? PIXEL_CFG.sharp;
    const isPupilRect = pCfg.type === "rect";
    const pupilInset = Math.max(0, pCfg.inset * pw);
    const pupilDrawSz = pw - pupilInset * 2;
    const pupilDrawR = pCfg.r * pupilDrawSz;

    for (const pos of eyePos) {
      for (let pr = 0; pr < 3; pr++) {
        for (let pc = 0; pc < 3; pc++) {
          const r = pos.r + 2 + pr;
          const c = pos.c + 2 + pc;
          if (!effectiveMatrix[r][c]) continue;
          const cx = PAD + c * pw + pw / 2;
          const cy = PAD + r * pw + pw / 2;
          const x = cx - pupilDrawSz / 2;
          const y = cy - pupilDrawSz / 2;

          if (isPupilRect) {
            // Simple rounded rect — no adaptive corners for pupil.
            // The pupil is a tiny 3×3 block; plain rects preserve the dark
            // mass scanners need without neighbor-aware complexity.
            pupilPieces.push(rrCW(x, y, pupilDrawSz, pupilDrawSz, pupilDrawR));
          } else {
            switch (pCfg.type) {
              case "circle": pupilPieces.push(circlePath(cx, cy, pupilDrawSz / 2)); break;
              case "diamond": pupilPieces.push(diamondPath(cx, cy, pupilDrawSz / 2)); break;
              case "cross": pupilPieces.push(crossPath(cx, cy, pupilDrawSz / 2)); break;
              case "star": pupilPieces.push(star5Path(cx, cy, pupilDrawSz * 0.55)); break;
              case "plus": pupilPieces.push(plusPath(cx, cy, pupilDrawSz * 0.5, pupilDrawSz * 0.16)); break;
              case "triangle": pupilPieces.push(trianglePath(cx, cy, pupilDrawSz * 0.55)); break;
              case "hexagon": pupilPieces.push(hexagonPath(cx, cy, pupilDrawSz * 0.55)); break;
              case "heart": pupilPieces.push(heartPath(cx, cy, pupilDrawSz * 0.55)); break;
              case "sparkle": pupilPieces.push(sparklePath(cx, cy, pupilDrawSz * 0.5)); break;
              case "smooth": pupilPieces.push(smoothPath(x, y, pupilDrawSz, pupilDrawSz, pupilDrawR)); break;
              case "flow": pupilPieces.push(flowPath(cx, cy, pupilDrawSz / 2)); break;
              case "blob": pupilPieces.push(blobPath(cx, cy, pupilDrawSz / 2)); break;
              case "chevron": pupilPieces.push(chevronPath(cx, cy, pupilDrawSz * 0.55)); break;
              case "wave": pupilPieces.push(wavePath(cx, cy, pupilDrawSz)); break;
              default: pupilPieces.push(rrCW(x, y, pupilDrawSz, pupilDrawSz, pupilDrawR)); break;
            }
          }
        }
      }
    }
  }

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
            {hasPupil && eyeDotPath.length > 0 && (
              <Path d={eyeDotPath} fill={fgFill} />
            )}
            {hasPupil && pupilPieces.length > 0 && (
              <Path d={pupilPieces.join(" ")} fill={fgFill} />
            )}

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
  smooth: (x: number, y: number, s: number, r: number): string =>
    smoothPath(x, y, s, s, r),
  flow: (cx: number, cy: number, hs: number): string =>
    flowPath(cx, cy, hs),
  blob: (cx: number, cy: number, hs: number): string =>
    blobPath(cx, cy, hs),
  chevron: (cx: number, cy: number, hs: number): string =>
    chevronPath(cx, cy, hs),
  wave: (cx: number, cy: number, s: number): string =>
    wavePath(cx, cy, s),
};
