import { QRStyle, ECL, EyeShape, PupilShape, PixelShape } from "@/types/qr";

const QRLib = require("qrcode");

// ─── Matrix generation ─────────────────────────────────────────────────────
function getMatrix(data: string, ecl: string): boolean[][] | null {
  try {
    const qr = QRLib.create(data, { errorCorrectionLevel: ecl });
    const n = qr.modules.size;
    return Array.from({ length: n }, (_, r) =>
      Array.from({ length: n }, (__, c) => !!qr.modules.get(r, c)),
    );
  } catch {
    return null;
  }
}

// ─── Eye region mask ───────────────────────────────────────────────────────
function inEye(r: number, c: number, n: number): boolean {
  return (r <= 7 && c <= 7) || (r <= 7 && c >= n - 8) || (r >= n - 8 && c <= 7);
}

// ─── SVG path helpers ──────────────────────────────────────────────────────
function rrCW(x: number, y: number, w: number, h: number, r: number): string {
  const cr = Math.min(r, w / 2, h / 2);
  if (cr < 0.5) return `M${x},${y}h${w}v${h}h-${w}Z`;
  return `M${x + cr},${y}H${x + w - cr}Q${x + w},${y} ${x + w},${y + cr}V${y + h - cr}Q${x + w},${y + h} ${x + w - cr},${y + h}H${x + cr}Q${x},${y + h} ${x},${y + h - cr}V${y + cr}Q${x},${y} ${x + cr},${y}Z`;
}

function circlePath(cx: number, cy: number, r: number): string {
  return `M${cx - r},${cy}a${r},${r} 0 1,0 ${r * 2},0a${r},${r} 0 1,0 -${r * 2},0`;
}

function ringPath(cx: number, cy: number, outer: number, inner: number): string {
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
  return (
    `M${cx - t},${cy - s}H${cx + t}V${cy - t}H${cx + s}V${cy + t}` +
    `H${cx + t}V${cy + s}H${cx - t}V${cy + t}H${cx - s}V${cy - t}H${cx - t}Z`
  );
}

function polygonPath(cx: number, cy: number, R: number, sides: number, rot = -Math.PI / 2): string {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < sides; i++) {
    const a = rot + (i * 2 * Math.PI) / sides;
    pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]);
  }
  let d = `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) {
    d += `L${pts[i][0].toFixed(2)},${pts[i][1].toFixed(2)}`;
  }
  return d + "Z";
}

function nStarPath(cx: number, cy: number, R: number, points: number, innerRatio = 0.382): string {
  const r = R * innerRatio;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = -Math.PI / 2 + i * (Math.PI / points);
    const rad = i % 2 === 0 ? R : r;
    pts.push([cx + Math.cos(angle) * rad, cy + Math.sin(angle) * rad]);
  }
  let d = `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) {
    d += `L${pts[i][0].toFixed(2)},${pts[i][1].toFixed(2)}`;
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

// ─── Qewie-like anatomical refinement shapes ─────────────────────────────
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
  const maxR = Math.min(w / 2, h / 2);
  const clamp = (v: number) => Math.min(v, maxR);
  const a = clamp(tl ? baseR : 0);
  const b = clamp(tr ? baseR : 0);
  const c = clamp(br ? baseR : 0);
  const d = clamp(bl ? baseR : 0);
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

// ─── Pixel shape config ────────────────────────────────────────────────────
type PixelShapeKind = "rect" | "circle" | "diamond" | "cross" | "star" | "plus" | "triangle" | "hexagon" | "heart" | "sparkle" | "smooth" | "flow" | "blob" | "chevron" | "wave" | "pinched-square" | "circuit-board" | "hashtag" | "vertical-line" | "horizontal-line";
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
  "pinched-square": { r: 0, inset: 0.04, type: "pinched-square" },
  "circuit-board": { r: 0, inset: 0.02, type: "circuit-board" },
  hashtag: { r: 0, inset: 0.06, type: "hashtag" },
  "vertical-line": { r: 0, inset: 0.06, type: "vertical-line" },
  "horizontal-line": { r: 0, inset: 0.06, type: "horizontal-line" },
};

// ─── Eye shape paths ───────────────────────────────────────────────────────
// Inner cutout always matches the outer shape's contour (just smaller).
function eyeShapePaths(shape: EyeShape, ox: number, oy: number, pw: number): { outer: string; innerCut: string } {
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
    case "inpoint": {
      const cr2 = Math.min(O * 0.12, 6);
      const nr = O * 0.22;
      const outer = (
        `M${ox + cr2},${oy}` +
        `H${ox + O - cr2}` +
        `Q${ox + O},${oy} ${ox + O},${oy + cr2}` +
        `V${oy + O * 0.55}` +
        `Q${ox + O},${oy + O * 0.75} ${ox + O * 0.75},${oy + O * 0.85}` +
        `Q${ox + O * 0.5},${oy + O + nr * 0.3} ${ox + O * 0.35},${oy + O * 0.85}` +
        `Q${ox + O * 0.15},${oy + O * 0.75} ${ox + O * 0.15},${oy + O * 0.55}` +
        `V${oy + cr2}` +
        `Q${ox},${oy} ${ox + cr2},${oy}Z`
      );
      const icr = Math.max(0, cr2 - pw);
      const innerCut = rrCW(ox + pw, oy + pw, I, I, icr);
      return { outer, innerCut };
    }
    case "outpoint": {
      const cr2 = Math.min(O * 0.12, 6);
      const br = O * 0.25;
      const outer = (
        `M${ox + cr2},${oy}` +
        `H${ox + O - cr2}` +
        `Q${ox + O},${oy} ${ox + O},${oy + cr2}` +
        `V${oy + O * 0.5}` +
        `Q${ox + O},${oy + O * 0.7} ${ox + O * 0.7},${oy + O * 0.7}` +
        `Q${ox + O * 0.5},${oy + O + br} ${ox + O * 0.3},${oy + O * 0.7}` +
        `Q${ox + O * 0.1},${oy + O * 0.7} ${ox + O * 0.1},${oy + O * 0.5}` +
        `V${oy + cr2}` +
        `Q${ox},${oy} ${ox + cr2},${oy}Z`
      );
      const icr = Math.max(0, cr2 - pw);
      const innerCut = rrCW(ox + pw, oy + pw, I, I, icr);
      return { outer, innerCut };
    }
    case "leaf": {
      const cr2 = Math.min(O * 0.12, 6);
      const lr = O * 0.35;
      const outer = (
        `M${ox + cr2},${oy}` +
        `H${ox + O - cr2}` +
        `Q${ox + O},${oy} ${ox + O},${oy + cr2}` +
        `V${oy + O * 0.45}` +
        `Q${ox + O},${oy + O * 0.65} ${ox + O * 0.75},${oy + O * 0.75}` +
        `Q${ox + O * 0.6},${oy + O + lr * 0.3} ${ox + O * 0.5},${oy + O + lr * 0.15}` +
        `Q${ox + O * 0.35},${oy + O + lr * 0.3} ${ox + O * 0.25},${oy + O * 0.75}` +
        `Q${ox + O * 0.1},${oy + O * 0.65} ${ox + O * 0.1},${oy + O * 0.45}` +
        `V${oy + cr2}` +
        `Q${ox},${oy} ${ox + cr2},${oy}Z`
      );
      const icr = Math.max(0, cr2 - pw);
      const innerCut = rrCW(ox + pw, oy + pw, I, I, icr);
      return { outer, innerCut };
    }
  }
  return { outer: "", innerCut: "" };
}

// ─── Single-path pupil generator ──────────────────────────────────────────
function pupilPath(shape: PupilShape, ox: number, oy: number, pw: number): string {
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
      const rx = R * 0.95;
      const ry = R * 0.82;
      return (
        `M${cx - rx},${cy}a${rx},${ry} 0 1,0 ${rx * 2},0a${rx},${ry} 0 1,0 -${rx * 2},0`
      );
    }
    case "pentagon": return polygonPath(cx, cy, R, 5);
    case "scallop": {
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
      const cR = R * 0.72;
      const offset = R * 0.35;
      return (
        circlePath(cx - offset, cy + R * 0.12, cR) +
        circlePath(cx, cy - R * 0.18, cR * 1.05) +
        circlePath(cx + offset, cy + R * 0.12, cR)
      );
    }
    case "droplet": {
      return (
        `M${cx},${cy - R}` +
        `C${cx + R * 0.15},${cy - R * 0.7} ${cx + R * 0.85},${cy - R * 0.1} ${cx + R * 0.85},${cy + R * 0.2}` +
        `A${R * 0.85},${R * 0.85} 0 1,1 ${cx - R * 0.85},${cy + R * 0.2}` +
        `C${cx - R * 0.85},${cy - R * 0.1} ${cx - R * 0.15},${cy - R * 0.7} ${cx},${cy - R}Z`
      );
    }
    case "microchip": {
      const chipW = D * 0.6;
      const chipH = D * 0.45;
      const legW = D * 0.08;
      const legH = D * 0.1;
      const legs = 4;
      const legSpan = chipW * 0.8;
      let d = rrCW(cx - chipW / 2, cy - chipH / 2, chipW, chipH, D * 0.06);
      for (let i = 0; i < legs; i++) {
        const lx = cx - legSpan / 2 + (i / (legs - 1)) * legSpan;
        d += rrCW(lx - legW / 2, cy - chipH / 2 - legH, legW, legH, 1);
      }
      for (let i = 0; i < legs; i++) {
        const lx = cx - legSpan / 2 + (i / (legs - 1)) * legSpan;
        d += rrCW(lx - legW / 2, cy + chipH / 2, legW, legH, 1);
      }
      return d;
    }
    case "hashtag": {
      const barW = D * 0.78;
      const barH = D * 0.2;
      const gap = D * 0.14;
      return (
        rrCW(cx - barW / 2, cy - gap - barH / 2, barW, barH, D * 0.04) +
        rrCW(cx - barW / 2, cy + gap - barH / 2, barW, barH, D * 0.04) +
        rrCW(cx - gap - barH / 2, cy - barW / 2, barH, barW, D * 0.04) +
        rrCW(cx + gap - barH / 2, cy - barW / 2, barH, barW, D * 0.04)
      );
    }
  }
  return "";
}

// ─── Draw one finder eye ───────────────────────────────────────────────────
function drawEye(eyeRow: number, eyeCol: number, pw: number, pad: number, eyeShape: EyeShape): string {
  const ox = pad + eyeCol * pw;
  const oy = pad + eyeRow * pw;
  const { outer, innerCut } = eyeShapePaths(eyeShape, ox, oy, pw);
  return `${outer} ${innerCut}`;
}

// ─── Main SVG generator ────────────────────────────────────────────────────
export function generateSVG(
  data: string,
  qrStyle: QRStyle,
  size: number = 512,
): string | null {
  const ECL_ORDER: ECL[] = ["L", "M", "Q", "H"];
  const eclIdx = ECL_ORDER.indexOf(qrStyle.ecl);
  const effectiveEcl = qrStyle.logoUri
    ? ECL_ORDER[Math.max(eclIdx, 3)]
    : qrStyle.ecl;

  const matrix = getMatrix(data, effectiveEcl);
  if (!matrix) return null;

  const n = matrix.length;
  const PAD = Math.round(size * 0.045);
  const pw = (size - PAD * 2) / n;

  // Build data module paths — rect types get adaptive corners
  const cfg = PIXEL_CFG[qrStyle.pixelShape] ?? PIXEL_CFG.sharp;
  const isRect = cfg.type === "rect";
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

      if (isRect) {
        const nc = countNeighbors(matrix, r, c, n);
        const hasL = getNeighbor(matrix, r, c, n, 0, -1);
        const hasR = getNeighbor(matrix, r, c, n, 0, 1);
        const hasT = getNeighbor(matrix, r, c, n, -1, 0);
        const hasB = getNeighbor(matrix, r, c, n, 1, 0);
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
          case "pinched-square": {
            const s = drawSz;
            const ctrl = s * 0.25;
            pieces.push(
              `M${x},${y}` +
              `Q${x + s / 2},${y + ctrl} ${x + s},${y}` +
              `Q${x + s},${y + s / 2} ${x + s},${y + s}` +
              `Q${x + s / 2},${y + s - ctrl} ${x},${y + s}` +
              `Q${x},${y + s / 2} ${x},${y}Z`
            );
            break;
          }
          case "circuit-board": {
            const padR = drawSz * 0.14;
            let d = circlePath(cx, cy, padR);
            const viaR = drawSz * 0.06;
            d += circlePath(x + viaR * 1.5, y + viaR * 1.5, viaR);
            d += circlePath(x + drawSz - viaR * 1.5, y + viaR * 1.5, viaR);
            d += circlePath(x + viaR * 1.5, y + drawSz - viaR * 1.5, viaR);
            d += circlePath(x + drawSz - viaR * 1.5, y + drawSz - viaR * 1.5, viaR);
            pieces.push(d);
            break;
          }
          case "hashtag": {
            const bw = drawSz * 0.85;
            const bh = drawSz * 0.18;
            const vr = drawSz * 0.02;
            pieces.push(
              rrCW(cx - bw / 2, cy - bh * 0.7 - bh / 2, bw, bh, vr) +
              rrCW(cx - bw / 2, cy + bh * 0.7 - bh / 2, bw, bh, vr) +
              rrCW(cx - bh * 0.7 - bh / 2, cy - bw / 2, bh, bw, vr) +
              rrCW(cx + bh * 0.7 - bh / 2, cy - bw / 2, bh, bw, vr)
            );
            break;
          }
          case "vertical-line": {
            const hasT = getNeighbor(matrix, r, c, n, -1, 0);
            const hasB = getNeighbor(matrix, r, c, n, 1, 0);
            if (hasT || hasB) {
              const barW = drawSz * 0.35;
              const barH = hasT && hasB ? pw : hasT ? pw * 0.65 : pw * 0.65;
              pieces.push(rrCW(cx - barW / 2, cy - barH / 2, barW, barH, barW * 0.3));
            } else {
              pieces.push(circlePath(cx, cy, drawSz * 0.25));
            }
            break;
          }
          case "horizontal-line": {
            const hasL = getNeighbor(matrix, r, c, n, 0, -1);
            const hasR = getNeighbor(matrix, r, c, n, 0, 1);
            if (hasL || hasR) {
              const barH = drawSz * 0.35;
              const barW = hasL && hasR ? pw : hasL ? pw * 0.65 : pw * 0.65;
              pieces.push(rrCW(cx - barW / 2, cy - barH / 2, barW, barH, barH * 0.3));
            } else {
              pieces.push(circlePath(cx, cy, drawSz * 0.25));
            }
            break;
          }
          default: pieces.push(rrCW(x, y, drawSz, drawSz, drawR)); break;
        }
      }
    }
  }

  // Build finder eye ring paths
  const eyePos = [
    { r: 0, c: 0 },
    { r: 0, c: n - 7 },
    { r: n - 7, c: 0 },
  ];
  const eyeRingPath = eyePos.map((e) => drawEye(e.r, e.c, pw, PAD, qrStyle.eyeShape)).join(" ");

  // ── Pupil rendering ──
  const hasPupil = qrStyle.pupilShape !== "none";
  const isGridPupil = qrStyle.pupilShape === "pixel";
  const pupilPieces: string[] = [];
  const eyeDotPath = hasPupil && !isGridPupil
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
    const pupilInset = pCfg.inset > 0 ? pw * 0.02 : 0;
    const pupilDrawSz = pw - pupilInset * 2;
    const pupilDrawR = pCfg.r * pupilDrawSz;

    for (const pos of eyePos) {
      for (let pr = 0; pr < 3; pr++) {
        for (let pc = 0; pc < 3; pc++) {
          const r = pos.r + 2 + pr;
          const c = pos.c + 2 + pc;
          if (!matrix[r][c]) continue;
          const cx = PAD + c * pw + pw / 2;
          const cy = PAD + r * pw + pw / 2;
          const x = cx - pupilDrawSz / 2;
          const y = cy - pupilDrawSz / 2;

          if (isPupilRect) {
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

  // Gradient
  const useGradient = qrStyle.gradient.enabled;
  const gradId = "svggrad";
  let defs = "";
  if (useGradient) {
    const rad = ((qrStyle.gradient.angle - 90) * Math.PI) / 180;
    const dx = Math.cos(rad);
    const dy = Math.sin(rad);
    const x1 = (0.5 - dx * 0.5).toFixed(3);
    const y1 = (0.5 - dy * 0.5).toFixed(3);
    const x2 = (0.5 + dx * 0.5).toFixed(3);
    const y2 = (0.5 + dy * 0.5).toFixed(3);
    defs = `<defs><linearGradient id="${gradId}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${qrStyle.gradient.startColor}"/><stop offset="1" stop-color="${qrStyle.gradient.endColor}"/></linearGradient></defs>`;
  }

  const fgFill = useGradient ? `url(#${gradId})` : qrStyle.fgColor;
  const cornerR = qrStyle.qrCorners ?? 20;

  // Build SVG
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    defs,
    `<rect width="${size}" height="${size}" fill="${qrStyle.bgColor}" rx="${cornerR}"/>`,
    `<path d="${pieces.join(" ")}" fill="${fgFill}"/>`,
    `<path d="${eyeRingPath}" fill-rule="evenodd" fill="${qrStyle.eyeColor}"/>`,
    eyeDotPath ? `<path d="${eyeDotPath}" fill="${qrStyle.fgColor}"/>` : "",
    pupilPieces.length > 0 ? `<path d="${pupilPieces.join(" ")}" fill="${qrStyle.fgColor}"/>` : "",
    `</svg>`,
  ]
    .filter(Boolean)
    .join("\n");

  return svg;
}
