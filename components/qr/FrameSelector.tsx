// components/qr/FrameSelector.tsx
//
// A 4-column grid showing each frame style as a tiny preview.  Selecting
// updates the qrStyle.frame via onChange.

import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { FrameStyle } from "@/types/qr";

const FRAME_OPTIONS: FrameStyle[] = [
  "none",
  "thin",
  "rounded",
  "thick",
  "dashed",
  "dotted",
  "double",
];

const FRAME_LABELS: Record<FrameStyle, string> = {
  none: "None",
  thin: "Thin",
  rounded: "Round",
  thick: "Thick",
  dashed: "Dash",
  dotted: "Dot",
  double: "Dbl",
};

interface Props {
  selected: FrameStyle;
  fgColor: string;
  onChange: (f: FrameStyle) => void;
}

function FramePreview({
  style,
  color,
}: {
  style: FrameStyle;
  color: string;
}) {
  const base = {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: color + "08",
  };
  switch (style) {
    case "none":
      return <View style={base} />;
    case "thin":
      return (
        <View
          style={[base, { borderWidth: 1, borderColor: color + "60" }]}
        />
      );
    case "rounded":
      return (
        <View
          style={[
            base,
            {
              borderWidth: 1.5,
              borderColor: color + "70",
              borderRadius: 6,
            },
          ]}
        />
      );
    case "thick":
      return (
        <View
          style={[
            base,
            {
              borderWidth: 3.5,
              borderColor: color + "80",
              borderRadius: 4,
            },
          ]}
        />
      );
    case "dashed":
      return (
        <View
          style={[
            base,
            {
              borderWidth: 2,
              borderColor: color + "70",
              borderStyle: "dashed",
            },
          ]}
        />
      );
    case "dotted":
      return (
        <View
          style={[
            base,
            {
              borderWidth: 1.5,
              borderColor: color + "70",
              borderStyle: "dotted",
              borderRadius: 6,
            },
          ]}
        />
      );
    case "double":
      return (
        <View
          style={[
            base,
            {
              borderWidth: 1.5,
              borderColor: color + "60",
              borderRadius: 4,
            },
          ]}
        >
          <View
            style={{
              flex: 1,
              margin: 3,
              borderWidth: 1,
              borderColor: color + "60",
              borderRadius: 2,
            }}
          />
        </View>
      );
  }
}

export function FrameSelector({ selected, fgColor, onChange }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.grid}>
      {FRAME_OPTIONS.map((frame) => {
        const active = frame === selected;
        return (
          <TouchableOpacity
            key={frame}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(frame);
            }}
            activeOpacity={0.6}
            style={[
              styles.cell,
              {
                backgroundColor: active ? fgColor + "20" : colors.surface,
                borderColor: active ? fgColor : colors.border,
              },
            ]}
          >
            <FramePreview style={frame} color={fgColor} />
            <Text
              style={[
                styles.cellLabel,
                { color: active ? fgColor : colors.textMuted },
              ]}
            >
              {FRAME_LABELS[frame]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    // Centered so odd-count rows don't leave a gap on the right that
    // reads as the grid "leaning" to the left.  See ShapeSelector for
    // the full rationale.
    justifyContent: "center",
  },
  cell: {
    // Fixed cell width matches ShapeSelector / CornerSelector so all
    // option modals have the same-size cells.  See ShapeSelector for
    // the full rationale.
    width: 64,
    aspectRatio: 1,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: Spacing.xs,
  },
  cellLabel: {
    fontSize: 9,
    fontFamily: Fonts.monoMedium,
    fontWeight: "600",
  },
});
