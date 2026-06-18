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
  const t = s * 0.32;
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
  const r = R * 0.18;
  return (
    `M${cx},${cy - R}` +
    `C${cx + r},${cy - r} ${cx + r},${cy - r} ${cx + R},${cy}` +
    `C${cx + r},${cy + r} ${cx + r},${cy + r} ${cx},${cy + R}` +
    `C${cx - r},${cy + r} ${cx - r},${cy + r} ${cx - R},${cy}` +
    `C${cx - r},${cy - r} ${cx - r},${cy - r} ${cx},${cy - R}Z`
  );
}

// ─── Pixel shape config ────────────────────────────────────────────────────
type PixelShapeKind = "rect" | "circle" | "diamond" | "cross" | "star" | "plus" | "triangle" | "hexagon" | "heart" | "sparkle";
const PIXEL_CFG: Record<PixelShape, { r: number; inset: number; type: PixelShapeKind }> = {
  sharp: { r: 0, inset: 0.04, type: "rect" },
  soft: { r: 0.2, inset: 0.06, type: "rect" },
  round: { r: 0.38, inset: 0.08, type: "rect" },
  dots: { r: 0.5, inset: 0.1, type: "circle" },
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

// ─── Eye shape paths ───────────────────────────────────────────────────────
function eyeShapePaths(shape: EyeShape, ox: number, oy: number, pw: number): { outer: string; innerCut: string } {
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
        innerCut: rrCW(oxI, oyI, I, I, pw * 0.5),
      };
    case "round":
      return {
        outer: rrCW(ox, oy, O, O, pw * 1.2),
        innerCut: rrCW(oxI, oyI, I, I, pw * 1.0),
      };
    case "pill":
      return {
        outer: rrCW(ox, oy, O, O, O * 0.5),
        innerCut: rrCW(oxI, oyI, I, I, I * 0.5),
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

// ─── Pupil scale per eye shape ─────────────────────────────────────────────
const EYE_PUPIL_SCALE: Record<EyeShape, number> = {
  sharp: 1.0, soft: 1.0, round: 1.0, pill: 0.78, leaf: 0.9,
  diamond: 0.7, shield: 0.85, dot: 1.0, heart: 0.7, hexagon: 0.78,
  plus: 0.55, star: 0.7, octagon: 0.85,
};

// ─── Pupil path generator ──────────────────────────────────────────────────
function pupilPath(shape: PupilShape, ox: number, oy: number, pw: number, sizeMul: number): string {
  const D = 3 * pw * sizeMul;
  const cxP = ox + 3.5 * pw;
  const cyP = oy + 3.5 * pw;
  if (shape === "none") return "";
  switch (shape) {
    case "dot": return circlePath(cxP, cyP, D * 0.5);
    case "square": return rrCW(cxP - D / 2, cyP - D / 2, D, D, 0);
    case "ring": return ringPath(cxP, cyP, D * 0.5, D * 0.28);
    case "cross": return crossPath(cxP, cyP, D * 0.5);
    case "diamond": return diamondPath(cxP, cyP, D * 0.5);
    case "star": return star5Path(cxP, cyP, D * 0.5);
    case "heart": return heartPath(cxP, cyP, D * 0.45);
  }
}

// ─── Draw one finder eye ───────────────────────────────────────────────────
function drawEye(eyeRow: number, eyeCol: number, pw: number, pad: number, eyeShape: EyeShape, pupilShape: PupilShape): { ring: string; pupil: string } {
  const ox = pad + eyeCol * pw;
  const oy = pad + eyeRow * pw;
  const { outer, innerCut } = eyeShapePaths(eyeShape, ox, oy, pw);
  const ring = `${outer} ${innerCut}`;
  const pupil = pupilPath(pupilShape, ox, oy, pw, EYE_PUPIL_SCALE[eyeShape]);
  return { ring, pupil };
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

  // Build data module paths
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
        case "circle": pieces.push(circlePath(cx, cy, drawSz / 2)); break;
        case "diamond": pieces.push(diamondPath(cx, cy, drawSz / 2)); break;
        case "cross": pieces.push(crossPath(cx, cy, drawSz / 2)); break;
        case "star": pieces.push(star5Path(cx, cy, drawSz * 0.55)); break;
        case "plus": pieces.push(plusPath(cx, cy, drawSz * 0.5, drawSz * 0.16)); break;
        case "triangle": pieces.push(trianglePath(cx, cy, drawSz * 0.55)); break;
        case "hexagon": pieces.push(hexagonPath(cx, cy, drawSz * 0.55)); break;
        case "heart": pieces.push(heartPath(cx, cy, drawSz * 0.55)); break;
        case "sparkle": pieces.push(sparklePath(cx, cy, drawSz * 0.5)); break;
        default: pieces.push(rrCW(x, y, drawSz, drawSz, drawR)); break;
      }
    }
  }

  // Build finder eye + pupil paths
  const eyePos = [
    { r: 0, c: 0 },
    { r: 0, c: n - 7 },
    { r: n - 7, c: 0 },
  ];
  const eyes = eyePos.map((e) =>
    drawEye(e.r, e.c, pw, PAD, qrStyle.eyeShape, qrStyle.pupilShape),
  );
  const eyeRingPath = eyes.map((e) => e.ring).join(" ");
  const eyeDotPath = eyes.map((e) => e.pupil).filter((p) => p.length > 0).join(" ");

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
    `</svg>`,
  ]
    .filter(Boolean)
    .join("\n");

  return svg;
}
