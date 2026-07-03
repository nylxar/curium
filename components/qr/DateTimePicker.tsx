import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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

export function DateTimePicker({ value, onChange, label }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const dt = parseDateTime(value);

  const display = value
    ? `${dt.year}-${pad(dt.month)}-${pad(dt.day)} ${pad(dt.hour)}:${pad(dt.minute)}`
    : "";

  const update = (partial: Partial<typeof dt>) => {
    const next = { ...dt, ...partial };
    onChange(
      `${next.year}-${pad(next.month)}-${pad(next.day)} ${pad(next.hour)}:${pad(next.minute)}`,
    );
  };

  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ];

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[
          styles.trigger,
          {
            backgroundColor: colors.surfaceOffset,
            borderColor: colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.triggerLabel,
            { color: colors.textMuted, fontFamily: Fonts.mono },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            styles.triggerValue,
            {
              color: value ? colors.text : colors.textFaint,
              fontFamily: Fonts.mono,
            },
          ]}
        >
          {display || "Tap to select"}
        </Text>
        <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
      </TouchableOpacity>

      <AnimatedSheet
        visible={open}
        onClose={() => setOpen(false)}
        bgColor={colors.surface}
        borderColor={colors.border}
      >
        <Text
          style={[
            styles.sheetTitle,
            { color: colors.text, fontFamily: Fonts.monoBold },
          ]}
        >
          {label}
        </Text>

        {/* Date section */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: Fonts.mono }]}
          >
            Date
          </Text>
          <View style={styles.row}>
            {/* Month */}
            <View style={styles.col}>
              <Text style={[styles.colLabel, { color: colors.textFaint }]}>Month</Text>
              <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {months.map((m, i) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => update({ month: i + 1 })}
                    style={[
                      styles.cell,
                      {
                        backgroundColor:
                          dt.month === i + 1 ? colors.primary + "18" : "transparent",
                        borderColor: dt.month === i + 1 ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: FontSize.sm,
                        fontFamily: dt.month === i + 1 ? Fonts.monoBold : Fonts.mono,
                        color: dt.month === i + 1 ? colors.primary : colors.textMuted,
                      }}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Day */}
            <View style={styles.col}>
              <Text style={[styles.colLabel, { color: colors.textFaint }]}>Day</Text>
              <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => update({ day: d })}
                    style={[
                      styles.cell,
                      {
                        backgroundColor:
                          dt.day === d ? colors.primary + "18" : "transparent",
                        borderColor: dt.day === d ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: FontSize.sm,
                        fontFamily: dt.day === d ? Fonts.monoBold : Fonts.mono,
                        color: dt.day === d ? colors.primary : colors.textMuted,
                      }}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Year */}
            <View style={styles.col}>
              <Text style={[styles.colLabel, { color: colors.textFaint }]}>Year</Text>
              <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 1 + i).map(
                  (y) => (
                    <TouchableOpacity
                      key={y}
                      onPress={() => update({ year: y })}
                      style={[
                        styles.cell,
                        {
                          backgroundColor:
                            dt.year === y ? colors.primary + "18" : "transparent",
                          borderColor: dt.year === y ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: FontSize.sm,
                          fontFamily: dt.year === y ? Fonts.monoBold : Fonts.mono,
                          color: dt.year === y ? colors.primary : colors.textMuted,
                        }}
                      >
                        {y}
                      </Text>
                    </TouchableOpacity>
                  ),
                )}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* Time section */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: Fonts.mono }]}
          >
            Time
          </Text>
          <View style={styles.row}>
            {/* Hour */}
            <View style={styles.col}>
              <Text style={[styles.colLabel, { color: colors.textFaint }]}>Hour</Text>
              <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                  <TouchableOpacity
                    key={h}
                    onPress={() => update({ hour: h })}
                    style={[
                      styles.cell,
                      {
                        backgroundColor:
                          dt.hour === h ? colors.primary + "18" : "transparent",
                        borderColor: dt.hour === h ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: FontSize.sm,
                        fontFamily: dt.hour === h ? Fonts.monoBold : Fonts.mono,
                        color: dt.hour === h ? colors.primary : colors.textMuted,
                      }}
                    >
                      {pad(h)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text
              style={[
                styles.colon,
                { color: colors.textMuted, fontFamily: Fonts.monoBold },
              ]}
            >
              :
            </Text>

            {/* Minute */}
            <View style={styles.col}>
              <Text style={[styles.colLabel, { color: colors.textFaint }]}>Min</Text>
              <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => update({ minute: m })}
                    style={[
                      styles.cell,
                      {
                        backgroundColor:
                          dt.minute === m ? colors.primary + "18" : "transparent",
                        borderColor: dt.minute === m ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: FontSize.sm,
                        fontFamily: dt.minute === m ? Fonts.monoBold : Fonts.mono,
                        color: dt.minute === m ? colors.primary : colors.textMuted,
                      }}
                    >
                      {pad(m)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* Done */}
        <TouchableOpacity
          onPress={() => setOpen(false)}
          style={[styles.doneBtn, { backgroundColor: colors.primary }]}
        >
          <Text
            style={[
              styles.doneLabel,
              { color: colors.bg, fontFamily: Fonts.monoBold },
            ]}
          >
            Done
          </Text>
        </TouchableOpacity>
      </AnimatedSheet>
    </>
  );
}

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
    marginBottom: Spacing.md,
  },
  section: { marginBottom: Spacing.md },
  sectionLabel: {
    fontSize: FontSize.xs,
    marginBottom: Spacing.xs,
    marginLeft: 2,
  },
  row: { flexDirection: "row", gap: Spacing.xs, alignItems: "stretch" },
  col: { flex: 1 },
  colLabel: {
    fontSize: 9,
    textAlign: "center",
    marginBottom: 4,
    fontFamily: Fonts.mono,
  },
  scroll: { maxHeight: 140 },
  cell: {
    paddingVertical: 6,
    alignItems: "center",
    borderRadius: Radius.sm,
    borderWidth: 1,
    marginBottom: 2,
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
    marginTop: Spacing.sm,
  },
  doneLabel: { fontSize: FontSize.base },
});
