import { ReactNode } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Radius, Spacing, FontSize, Fonts } from "@/constants/theme";
import { AnimatedSheet } from "@/components/ui/AnimatedSheet";
import { useTheme } from "@/context/ThemeContext";

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  iconName?: IconName;
  children: ReactNode;
}

export function OptionSheet({
  visible,
  onClose,
  title,
  subtitle,
  iconName,
  children,
}: Props) {
  const { colors } = useTheme();
  return (
    <AnimatedSheet
      visible={visible}
      onClose={onClose}
      bgColor={colors.surface}
      borderColor={colors.border}
    >
      <View style={s.header}>
        <View
          style={[s.iconCircle, { backgroundColor: colors.primary + "18" }]}
        >
          {iconName && (
            <Icon name={iconName} size={18} color={colors.primary} />
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
          <Icon name="close" size={16} color={colors.textMuted} />
        </Pressable>
      </View>

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
  body: {
    gap: Spacing.md,
  },
});
