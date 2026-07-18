import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Keyboard,
  Platform,
  BackHandler,
} from "react-native";
import { Icon, type IconName } from "../ui/Icon";
import { useTheme } from "@/context/ThemeContext";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";
import { AnimatedSheet } from "@/components/ui/AnimatedSheet";

interface Props {
  value: string;
  onChange: (v: string) => void;
  label: string;
}

function parseDateTime(v: string) {
  if (!v) {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
      hour: now.getHours(),
      minute: now.getMinutes(),
    };
  }
  const clean = v.replace("T", " ");
  const [datePart, timePart] = clean.split(" ");
  const [y, m, d] = (datePart ?? "").split("-").map(Number);
  const [hh, mm] = (timePart ?? "00:00").split(":").map(Number);
  return {
    year: y || new Date().getFullYear(),
    month: m || 1,
    day: d || 1,
    hour: hh || 0,
    minute: mm || 0,
  };
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function ScrollColumn({
  items,
  selected,
  onSelect,
  formatItem,
  colors,
}: {
  items: number[];
  selected: number;
  onSelect: (v: number) => void;
  formatItem: (v: number) => string;
  colors: any;
}) {
  const ref = useRef<ScrollView>(null);
  const CELL_H = 32;

  useEffect(() => {
    const idx = items.indexOf(selected);
    if (idx >= 0 && ref.current) {
      setTimeout(() => {
        ref.current?.scrollTo({ y: idx * CELL_H, animated: false });
      }, 50);
    }
  }, []);

  return (
    <ScrollView
      ref={ref}
      style={styles.scroll}
      showsVerticalScrollIndicator={false}
      snapToInterval={CELL_H}
      decelerationRate="fast"
    >
      <View style={{ height: CELL_H * 2 }} />
      {items.map((v) => (
        <TouchableOpacity
          key={v}
          activeOpacity={0.6}
          onPress={() => onSelect(v)}
          style={[
            styles.cell,
            {
              height: CELL_H,
              backgroundColor: v === selected ? colors.primary + "18" : "transparent",
            },
          ]}
        >
          <Text
            style={{
              fontSize: FontSize.sm,
              fontFamily: v === selected ? Fonts.monoBold : Fonts.mono,
              color: v === selected ? colors.primary : colors.textMuted,
            }}
          >
            {formatItem(v)}
          </Text>
        </TouchableOpacity>
      ))}
      <View style={{ height: CELL_H * 2 }} />
    </ScrollView>
  );
}

export function DateTimePicker({ value, onChange, label }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const dt = parseDateTime(value);

  useEffect(() => {
    if (open) Keyboard.dismiss();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setOpen(false);
      return true;
    });
    return () => sub.remove();
  }, [open]);

  const display = value
    ? `${dt.year}-${pad(dt.month)}-${pad(dt.day)} ${pad(dt.hour)}:${pad(dt.minute)}`
    : "";

  const update = (partial: Partial<typeof dt>) => {
    const next = { ...dt, ...partial };
    onChange(
      `${next.year}-${pad(next.month)}-${pad(next.day)} ${pad(next.hour)}:${pad(next.minute)}`,
    );
  };

  const months = [1,2,3,4,5,6,7,8,9,10,11,12];
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from({ length: 25 }, (_, i) => new Date().getFullYear() - 1 + i);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0,5,10,15,20,25,30,35,40,45,50,55];

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[
          styles.trigger,
          { backgroundColor: colors.surfaceOffset, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.triggerLabel, { color: colors.textMuted, fontFamily: Fonts.mono }]}>
          {label}
        </Text>
        <Text
          style={[styles.triggerValue, { color: value ? colors.text : colors.textFaint, fontFamily: Fonts.mono }]}
        >
          {display || "Tap to select"}
        </Text>
        <Icon name="chevron-forward" size={14} color={colors.textMuted} />
      </TouchableOpacity>

      <AnimatedSheet
        visible={open}
        onClose={() => setOpen(false)}
        bgColor={colors.surface}
        borderColor={colors.border}
      >
        <Text style={[styles.sheetTitle, { color: colors.text, fontFamily: Fonts.monoBold }]}>
          {label}
        </Text>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: Fonts.monoMedium }]}>
          Date
        </Text>
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={[styles.colLabel, { color: colors.textFaint }]}>Month</Text>
            <ScrollColumn
              items={months}
              selected={dt.month}
              onSelect={(v) => update({ month: v })}
              formatItem={(v) => monthNames[v - 1]}
              colors={colors}
            />
          </View>
          <View style={styles.col}>
            <Text style={[styles.colLabel, { color: colors.textFaint }]}>Day</Text>
            <ScrollColumn
              items={days}
              selected={dt.day}
              onSelect={(v) => update({ day: v })}
              formatItem={(v) => `${v}`}
              colors={colors}
            />
          </View>
          <View style={styles.col}>
            <Text style={[styles.colLabel, { color: colors.textFaint }]}>Year</Text>
            <ScrollColumn
              items={years}
              selected={dt.year}
              onSelect={(v) => update({ year: v })}
              formatItem={(v) => `${v}`}
              colors={colors}
            />
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: Fonts.monoMedium }]}>
          Time
        </Text>
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={[styles.colLabel, { color: colors.textFaint }]}>Hour</Text>
            <ScrollColumn
              items={hours}
              selected={dt.hour}
              onSelect={(v) => update({ hour: v })}
              formatItem={(v) => pad(v)}
              colors={colors}
            />
          </View>
          <Text style={[styles.colon, { color: colors.textMuted, fontFamily: Fonts.monoBold }]}>:</Text>
          <View style={styles.col}>
            <Text style={[styles.colLabel, { color: colors.textFaint }]}>Min</Text>
            <ScrollColumn
              items={minutes}
              selected={dt.minute}
              onSelect={(v) => update({ minute: v })}
              formatItem={(v) => pad(v)}
              colors={colors}
            />
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <TouchableOpacity
          onPress={() => setOpen(false)}
          style={[styles.doneBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.doneLabel, { color: colors.bg, fontFamily: Fonts.monoBold }]}>
            Done
          </Text>
        </TouchableOpacity>
      </AnimatedSheet>
    </>
  );
}

const CELL_H = 32;

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  triggerLabel: { fontSize: FontSize.xs, width: 60 },
  triggerValue: { flex: 1, fontSize: FontSize.sm },
  sheetTitle: {
    fontSize: FontSize.md,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.sm,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    marginBottom: Spacing.xs,
    marginLeft: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: { flexDirection: "row", gap: Spacing.xs, alignItems: "stretch" },
  col: { flex: 1 },
  colLabel: {
    fontSize: 9,
    textAlign: "center",
    marginBottom: 4,
    fontFamily: Fonts.mono,
  },
  scroll: { maxHeight: CELL_H * 5 },
  cell: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.sm,
  },
  colon: {
    fontSize: FontSize.lg,
    alignSelf: "center",
    marginTop: 18,
  },
  doneBtn: {
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  doneLabel: { fontSize: FontSize.base },
});
