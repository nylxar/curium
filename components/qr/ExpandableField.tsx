import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";
import { AnimatedSheet } from "@/components/ui/AnimatedSheet";

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
  const hasValue = value.trim().length > 0;

  return (
    <>
      <TouchableOpacity
        style={[
          styles.row,
          { backgroundColor: colors.surfaceOffset, borderColor: colors.border },
        ]}
        onPress={() => setOpen(true)}
        activeOpacity={0.6}
      >
        <View style={styles.rowContent}>
          <Text
            style={[
              styles.fieldLabel,
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
            {hasValue ? value : (placeholder ?? "Tap to enter...")}
          </Text>
        </View>
        <Ionicons
          name={hasValue ? "create-outline" : "add-circle-outline"}
          size={16}
          color={tintColor}
        />
      </TouchableOpacity>

      <AnimatedSheet
        visible={open}
        onClose={() => setOpen(false)}
        bgColor={colors.surface}
        borderColor={colors.border}
        disableSwipeDown
      >
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
              activeOpacity={0.7}
            >
              <Text
                style={[styles.doneBtnText, { fontFamily: Fonts.monoBold }]}
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
                fontFamily: Fonts.mono,
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
      </AnimatedSheet>
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
    minHeight: 52,
  },
  rowContent: { flex: 1, gap: 2 },
  fieldLabel: { fontSize: FontSize.xs },
  preview: { fontSize: FontSize.sm },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: Spacing.sm,
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.base,
  },
});
