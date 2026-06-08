import { ReactNode } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Radius, Spacing, FontSize, Fonts } from "@/constants/theme";
import { AnimatedSheet } from "@/components/ui/AnimatedSheet";
import { useTheme } from "@/context/ThemeContext";

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  tintColor: string;
  bgColor: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  children: ReactNode;
}

export function OptionSheet({
  visible,
  onClose,
  title,
  subtitle,
  tintColor,
  bgColor,
  iconName,
  children,
}: Props) {
  const { colors } = useTheme();
  return (
    <AnimatedSheet
      visible={visible}
      onClose={onClose}
      bgColor={bgColor}
      borderColor={colors.border}
    >
      {/* Header — drag handle + icon + title + close */}
      <View style={s.header}>
        <View
          style={[s.iconCircle, { backgroundColor: tintColor + "18" }]}
        >
          {iconName && (
            <Ionicons name={iconName} size={18} color={tintColor} />
          )}
        </View>
        <View style={s.titles}>
          <Text
            style={[
              s.title,
              { color: colors.text, fontFamily: Fonts.monoBold },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[
                s.subtitle,
                { color: colors.textMuted, fontFamily: Fonts.mono },
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={onClose}
          hitSlop={10}
          style={({ pressed }) => [
            s.closeBtn,
            {
              backgroundColor: pressed
                ? colors.surfaceOffset
                : colors.surfaceOffset + "80",
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons name="close" size={16} color={colors.textMuted} />
        </Pressable>
      </View>

      {/* Accent line */}
      <View
        style={[
          s.accent,
          { backgroundColor: tintColor + "50" },
        ]}
      />

      <View style={s.body}>{children}</View>
    </AnimatedSheet>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingTop: Spacing.xs,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  titles: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: FontSize.lg,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  accent: {
    height: 2,
    borderRadius: 1,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    alignSelf: "flex-start",
    width: 36,
  },
  body: {
    gap: Spacing.md,
  },
});
