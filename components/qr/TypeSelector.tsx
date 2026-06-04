import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { QRType } from "@/types/qr";
import { useTheme } from "@/context/ThemeContext";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";
import { AnimatedSheet } from "@/components/ui/AnimatedSheet";

const TYPES: {
  id: QRType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: "url", label: "URL", icon: "link-outline" },
  { id: "text", label: "Text", icon: "text-outline" },
  { id: "wifi", label: "WiFi", icon: "wifi-outline" },
  { id: "email", label: "Email", icon: "mail-outline" },
  { id: "phone", label: "Phone", icon: "call-outline" },
  { id: "sms", label: "SMS", icon: "chatbubble-outline" },
  { id: "contact", label: "Contact", icon: "person-outline" },
  { id: "location", label: "Location", icon: "location-outline" },
];

interface Props {
  selected: QRType;
  tintColor: string;
  onChange: (t: QRType) => void;
}

export function TypeSelector({ selected, tintColor, onChange }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const current = TYPES.find((t) => t.id === selected)!;

  return (
    <>
      <TouchableOpacity
        style={[
          styles.row,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={() => {
          Haptics.selectionAsync();
          setOpen(true);
        }}
        activeOpacity={0.6}
      >
        <View style={[styles.rowIcon, { backgroundColor: tintColor + "18" }]}>
          <Ionicons name={current.icon} size={18} color={tintColor} />
        </View>
        <View style={styles.rowText}>
          <Text
            style={[
              styles.rowLabel,
              { color: colors.text, fontFamily: Fonts.monoMedium },
            ]}
          >
            QR Type
          </Text>
          <Text
            style={[
              styles.rowSub,
              { color: colors.textMuted, fontFamily: Fonts.mono },
            ]}
          >
            {current.label}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color={colors.textFaint} />
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
          Select QR Type
        </Text>
        <View style={styles.grid}>
          {TYPES.map((t) => {
            const active = t.id === selected;
            return (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.cell,
                  {
                    backgroundColor: active ? tintColor + "18" : colors.surfaceOffset,
                    borderColor: active ? tintColor : colors.border,
                    borderWidth: active ? 2 : 1,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  onChange(t.id);
                  setOpen(false);
                }}
                activeOpacity={0.6}
              >
                <Ionicons
                  name={t.icon}
                  size={22}
                  color={active ? tintColor : colors.textMuted}
                />
                <Text
                  style={[
                    styles.cellLabel,
                    {
                      color: active ? tintColor : colors.textMuted,
                      fontFamily: active ? Fonts.monoBold : Fonts.mono,
                    },
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </AnimatedSheet>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: FontSize.base },
  rowSub: { fontSize: FontSize.xs, marginTop: 1 },

  sheetTitle: { fontSize: FontSize.md, textAlign: "center", marginBottom: Spacing.md },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  cell: {
    width: "22%",
    flexGrow: 1,
    aspectRatio: 1,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  cellLabel: { fontSize: FontSize.xs },
});
