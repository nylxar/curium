import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  tintColor: string;
}

export function ExpandableField({
  label,
  value,
  onChange,
  placeholder,
  tintColor,
}: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const preview = value.trim() || placeholder;
  const hasValue = value.trim().length > 0;

  return (
    <>
      {/* Single-line preview row — always fixed height */}
      <TouchableOpacity
        style={[
          styles.row,
          {
            backgroundColor: colors.surfaceOffset,
            borderColor: open ? tintColor : colors.border,
          },
        ]}
        onPress={() => setOpen(true)}
        activeOpacity={0.75}
      >
        <View style={styles.rowContent}>
          <Text
            style={[
              styles.label,
              { color: colors.textMuted, fontFamily: Fonts.mono },
            ]}
          >
            {label}
          </Text>
          <Text
            style={[
              styles.preview,
              {
                color: hasValue ? colors.text : colors.textFaint,
                fontFamily: Fonts.mono,
              },
            ]}
            numberOfLines={1}
          >
            {preview}
          </Text>
        </View>
        <Ionicons
          name={hasValue ? "create-outline" : "add-outline"}
          size={16}
          color={tintColor}
        />
      </TouchableOpacity>

      {/* Full editor modal */}
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: insets.bottom + Spacing.lg,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Sheet header */}
          <View style={styles.sheetHeader}>
            <Text
              style={[
                styles.sheetTitle,
                { color: colors.text, fontFamily: Fonts.monoBold },
              ]}
            >
              {label}
            </Text>
            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: tintColor }]}
              onPress={() => setOpen(false)}
            >
              <Text
                style={[styles.doneBtnText, { fontFamily: Fonts.monoBold }]}
              >
                Done
              </Text>
            </TouchableOpacity>
          </View>

          {/* Full text input */}
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceOffset,
                borderColor: colors.border,
                color: colors.text,
                fontFamily: Fonts.mono,
              },
            ]}
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor={colors.textFaint}
            multiline
            autoFocus
            textAlignVertical="top"
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.sm,
  },
  rowContent: { flex: 1, gap: 2 },
  label: { fontSize: FontSize.xs },
  preview: { fontSize: FontSize.sm },

  backdrop: { flex: 1, backgroundColor: "#00000066" },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center" },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: { fontSize: FontSize.md },
  doneBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  doneBtnText: { fontSize: FontSize.sm, color: "#fff" },
  input: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    fontSize: FontSize.base,
    minHeight: 160,
    maxHeight: 280,
  },
});
