// components/qr/StyleSection.tsx — Shape selector with live mini-previews
import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { useTheme } from "@/context/ThemeContext";
import { EyeShape, PixelShape } from "@/types/qr";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";

// Mini 40×40 QR shape preview — draws 3×3 grid of pixels + one eye stub
function ShapePreview({
  pixelShape,
  eyeShape,
  fg,
  bg,
}: {
  pixelShape: PixelShape;
  eyeShape: EyeShape;
  fg: string;
  bg: string;
}) {
  const S = 40;
  const pw = S / 9;
  const grid = [
    [1, 1, 0, 1, 0, 1, 0, 1, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1],
    [0, 1, 1, 0, 0, 1, 1, 0, 0],
    [1, 0, 0, 1, 0, 0, 1, 1, 0],
    [0, 1, 0, 0, 1, 0, 0, 1, 1],
    [1, 0, 1, 1, 0, 1, 0, 0, 1],
    [0, 1, 1, 0, 1, 0, 1, 0, 0],
    [1, 0, 0, 1, 0, 1, 0, 1, 0],
    [1, 1, 0, 0, 1, 0, 1, 0, 1],
  ];

  const R: Record<PixelShape, number> = {
    sharp: 0,
    soft: 0.2,
    round: 0.4,
    dots: 0.5,
    liquid: 0.35,
    glued: 0.28,
    diamond: 0,
    cross: 0,
    star: 0.1,
  };
  const r = R[pixelShape] * pw;

  const paths: string[] = [];
  grid.forEach((row, ri) => {
    row.forEach((cell, ci) => {
      if (!cell) return;
      if (ri < 3 && ci < 3) return; // skip eye region
      const x = ci * pw + 0.5,
        y = ri * pw + 0.5;
      const w = pw - 1;
      if (pixelShape === "dots") {
        const cx = x + w / 2,
          cy = y + w / 2,
          rad = w / 2;
        paths.push(
          `M${cx - rad},${cy}a${rad},${rad} 0 1,0 ${rad * 2},0a${rad},${rad} 0 1,0 -${rad * 2},0`,
        );
      } else if (pixelShape === "diamond") {
        const cx = x + w / 2,
          cy = y + w / 2,
          hs = w / 2;
        paths.push(
          `M${cx},${cy - hs}L${cx + hs},${cy}L${cx},${cy + hs}L${cx - hs},${cy}Z`,
        );
      } else {
        const cr = Math.min(r, w / 2);
        if (cr < 0.5) paths.push(`M${x},${y}h${w}v${w}h-${w}Z`);
        else
          paths.push(
            `M${x + cr},${y}H${x + w - cr}Q${x + w},${y} ${x + w},${y + cr}V${y + w - cr}Q${x + w},${y + w} ${x + w - cr},${y + w}H${x + cr}Q${x},${y + w} ${x},${y + w - cr}V${y + cr}Q${x},${y} ${x + cr},${y}Z`,
          );
      }
    });
  });

  // Eye outer ring
  const ER: Record<EyeShape, number> = {
    sharp: 0,
    soft: 0.1,
    round: 0.22,
    pill: 0.48,
    leaf: 0.22,
    diamond: 0.12,
    shield: 0.18,
    dot: 0.5,
  };
  const eyeR = ER[eyeShape] * pw * 3;
  const ex = 0.5,
    ey = 0.5,
    es = pw * 3 - 1;
  const er = Math.min(eyeR, es / 2);

  let outerEye: string;
  if (er < 0.5) {
    outerEye = `M${ex},${ey}h${es}v${es}h-${es}Z M${ex + pw},${ey + pw}v${pw}h${pw}v-${pw}Z`;
  } else {
    outerEye = `M${ex + er},${ey}H${ex + es - er}Q${ex + es},${ey} ${ex + es},${ey + er}V${ey + es - er}Q${ex + es},${ey + es} ${ex + es - er},${ey + es}H${ex + er}Q${ex},${ey + es} ${ex},${ey + es - er}V${ey + er}Q${ex},${ey} ${ex + er},${ey}Z`;
    const ix = ex + pw,
      iy = ey + pw,
      iw = pw;
    outerEye += ` M${ix},${iy}v${iw}h${iw}v-${iw}Z`;
  }

  return (
    <Svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
      <Rect width={S} height={S} fill={bg} />
      <Path d={paths.join(" ")} fill={fg} />
      <Path d={outerEye} fill={fg} fillRule="evenodd" />
    </Svg>
  );
}

const EYE_SHAPES: EyeShape[] = [
  "sharp",
  "soft",
  "round",
  "pill",
  "leaf",
  "diamond",
  "shield",
  "dot",
];
const PIXEL_SHAPES: PixelShape[] = [
  "sharp",
  "soft",
  "round",
  "dots",
  "liquid",
  "glued",
  "diamond",
  "cross",
  "star",
];

interface StyleSectionProps {
  eyeShape: EyeShape;
  pixelShape: PixelShape;
  fgColor: string;
  bgColor: string;
  onEyeChange: (e: EyeShape) => void;
  onPixelChange: (p: PixelShape) => void;
}

export function StyleSection({
  eyeShape,
  pixelShape,
  fgColor,
  bgColor,
  onEyeChange,
  onPixelChange,
}: StyleSectionProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      {/* Eye shapes */}
      <Text style={[styles.label, { color: colors.textMuted }]}>Eye Shape</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.shapeRow}
      >
        {EYE_SHAPES.map((shape) => {
          const active = shape === eyeShape;
          return (
            <TouchableOpacity
              key={shape}
              onPress={() => onEyeChange(shape)}
              style={[
                styles.shapeBtn,
                {
                  borderColor: active ? fgColor : colors.border,
                  backgroundColor: active ? bgColor : colors.bg,
                  transform: [{ scale: active ? 1.06 : 1 }],
                },
              ]}
              activeOpacity={0.75}
            >
              <ShapePreview
                pixelShape={pixelShape}
                eyeShape={shape}
                fg={fgColor}
                bg={bgColor}
              />
              <Text
                style={[
                  styles.shapeName,
                  {
                    color: active ? colors.text : colors.textFaint,
                  },
                ]}
              >
                {shape}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Pixel shapes */}
      <Text style={[styles.label, { color: colors.textMuted }]}>
        Pixel Shape
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.shapeRow}
      >
        {PIXEL_SHAPES.map((shape) => {
          const active = shape === pixelShape;
          return (
            <TouchableOpacity
              key={shape}
              onPress={() => onPixelChange(shape)}
              style={[
                styles.shapeBtn,
                {
                  borderColor: active ? fgColor : colors.border,
                  backgroundColor: active ? bgColor : colors.bg,
                  transform: [{ scale: active ? 1.06 : 1 }],
                },
              ]}
              activeOpacity={0.75}
            >
              <ShapePreview
                pixelShape={shape}
                eyeShape={eyeShape}
                fg={fgColor}
                bg={bgColor}
              />
              <Text
                style={[
                  styles.shapeName,
                  {
                    color: active ? colors.text : colors.textFaint,
                  },
                ]}
              >
                {shape}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.sm },
  label: {
    fontSize: FontSize.xs,
    fontFamily: Fonts.mono,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: Spacing.lg,
  },
  shapeRow: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  shapeBtn: {
    alignItems: "center",
    gap: 4,
    padding: 6,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  shapeName: {
    fontSize: 9,
    fontFamily: Fonts.mono,
    textTransform: "capitalize",
  },
});
