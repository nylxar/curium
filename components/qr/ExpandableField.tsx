import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
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
  multiline?: boolean;
  keyboardType?:
    | "default"
    | "email-address"
    | "phone-pad"
    | "decimal-pad"
    | "url";
  secureTextEntry?: boolean;
}

export function ExpandableField({
  label,
  value,
  onChange,
  placeholder,
  tintColor,
  multiline = false,
  keyboardType = "default",
  secureTextEntry = false,
}: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const hasValue = value.trim().length > 0;

  return (
    <>
      <TouchableOpacity
        style={[
          styles.row,
          { backgroundColor: colors.surfaceOffset, borderColor: colors.border },
        ]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <View style={styles.rowContent}>
          <Text
            style={[
              styles.fieldLabel,
              { color: colors.textMuted, fontFamily: Fonts.system },
            ]}
          >
            {label}
          </Text>
          <Text
            style={[
              styles.preview,
              {
                color: hasValue ? colors.text : colors.textFaint,
                fontFamily: Fonts.system,
              },
            ]}
            numberOfLines={1}
          >
            {hasValue ? value : (placeholder ?? "Tap to enter...")}
          </Text>
        </View>
        <Ionicons
          name={hasValue ? "create-outline" : "add-circle-outline"}
          size={16}
          color={tintColor}
        />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
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
            <View style={styles.sheetHeader}>
              <Text
                style={[
                  styles.sheetTitle,
                  { color: colors.text, fontFamily: Fonts.system },
                ]}
              >
                {label}
              </Text>
              <TouchableOpacity
                style={[styles.doneBtn, { backgroundColor: tintColor }]}
                onPress={() => setOpen(false)}
              >
                <Text
                  style={[styles.doneBtnText, { fontFamily: Fonts.system }]}
                >
                  Done
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceOffset,
                  borderColor: colors.border,
                  color: colors.text,
                  fontFamily: Fonts.system,
                  height: multiline ? 140 : 52,
                },
              ]}
              value={value}
              onChangeText={onChange}
              placeholder={placeholder}
              placeholderTextColor={colors.textFaint}
              multiline={multiline}
              autoFocus
              textAlignVertical={multiline ? "top" : "center"}
              keyboardType={keyboardType}
              secureTextEntry={secureTextEntry}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.sm,
    minHeight: 52,
  },
  rowContent: { flex: 1, gap: 2 },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: "600" },
  preview: { fontSize: FontSize.base },
  backdrop: { flex: 1, backgroundColor: "#00000073" },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center" },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: { fontSize: FontSize.lg, fontWeight: "700" },
  doneBtn: {
    minHeight: 44,
    minWidth: 70,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  doneBtnText: { fontSize: FontSize.base, color: "#fff", fontWeight: "700" },
  input: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.base,
  },
});
