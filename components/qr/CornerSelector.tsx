// components/qr/CornerSelector.tsx
//
// 5-step selector for the QR canvas corner radius.  Each preview is a
// small rounded rect that visually shows the radius — sharp / slight /
// soft / round / very round.

import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";
import * as Haptics from "expo-haptics";

interface Props {
  selected: number; // 0 / 8 / 16 / 24 / 32
  fgColor: string;
  onChange: (radius: number) => void;
}

interface CornerOpt {
  value: number;
  label: string;
  corner: number;
}

const CORNER_OPTIONS: CornerOpt[] = [
  { value: 0, label: "Sharp", corner: 0 },
  { value: 8, label: "Slight", corner: 4 },
  { value: 16, label: "Soft", corner: 6 },
  { value: 24, label: "Round", corner: 9 },
  { value: 32, label: "Pill", corner: 14 },
];

function CornerPreview({
  value,
  corner,
  color,
}: {
  value: number;
  corner: number;
  color: string;
}) {
  return (
    <View
      style={[
        styles.preview,
        {
          borderRadius: corner,
          backgroundColor: color + "15",
          borderWidth: 1.5,
          borderColor: color + "60",
        },
      ]}
    >
      <Text
        style={[
          styles.previewLabel,
          { color: color + "90" },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

export function CornerSelector({ selected, fgColor, onChange }: Props) {
  return (
    <View style={styles.grid}>
      {CORNER_OPTIONS.map((opt) => {
        const active = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(opt.value);
            }}
            style={[
              styles.cell,
              { borderColor: active ? fgColor : fgColor + "25" },
              active && { backgroundColor: fgColor + "18" },
            ]}
            activeOpacity={0.6}
          >
            <CornerPreview
              value={opt.value}
              corner={opt.corner}
              color={fgColor}
            />
            <Text
              style={[
                styles.cellLabel,
                { color: active ? fgColor : fgColor + "90" },
              ]}
            >
              {opt.label}
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
    // Fixed cell width matches ShapeSelector / FrameSelector so all
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
  preview: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  previewLabel: {
    fontSize: 8,
    fontFamily: Fonts.mono,
  },
});
