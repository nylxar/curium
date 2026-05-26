import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
} from "react-native";
import Animated, {
  FadeInUp,
  LinearTransition,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QRType } from "@/types/qr";
import { useTheme } from "@/context/ThemeContext";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";
import { PressableScale } from "@/components/ui/PressableScale";

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
  const insets = useSafeAreaInsets();
  const current = TYPES.find((t) => t.id === selected)!;

  return (
    <>
      {/* Option row — tappable */}
      <PressableScale
        style={[
          styles.row,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={() => {
          Haptics.selectionAsync();
          setOpen(true);
        }}
      >
        <View style={[styles.rowIcon, { backgroundColor: tintColor + "18" }]}>
          <Ionicons name={current.icon} size={18} color={tintColor} />
        </View>
        <View style={styles.rowText}>
          <Text
            style={[
              styles.rowLabel,
              { color: colors.text, fontFamily: Fonts.system },
            ]}
          >
            QR Type
          </Text>
          <Text
            style={[
              styles.rowSub,
              { color: colors.textMuted, fontFamily: Fonts.system },
            ]}
          >
            {current.label}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color={colors.textFaint} />
      </PressableScale>

      {/* Modal picker */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <Animated.View
          entering={FadeInUp.duration(180)}
          layout={LinearTransition.duration(140)}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: insets.bottom + Spacing.lg,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text
            style={[
              styles.sheetTitle,
              { color: colors.text, fontFamily: Fonts.system },
            ]}
          >
            Select QR Type
          </Text>
          <View style={styles.grid}>
            {TYPES.map((t) => {
              const active = t.id === selected;
              return (
                <PressableScale
                  key={t.id}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: active
                        ? tintColor + "18"
                        : colors.surfaceOffset,
                      borderColor: active ? tintColor : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onChange(t.id);
                    setOpen(false);
                  }}
                  pressedScale={0.94}
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
                        fontFamily: Fonts.system,
                        fontWeight: active ? "700" : "500",
                      },
                    ]}
                  >
                    {t.label}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    minHeight: 60,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: FontSize.base, fontWeight: "600" },
  rowSub: { fontSize: FontSize.sm, marginTop: 2 },

  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.18)" },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center" },
  sheetTitle: { fontSize: FontSize.lg, fontWeight: "700", textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  cell: {
    width: "22%",
    aspectRatio: 1,
    minHeight: 76,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    flexGrow: 1,
  },
  cellLabel: { fontSize: FontSize.sm },
});
