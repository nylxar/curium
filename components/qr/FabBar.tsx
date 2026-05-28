import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";
import { AnimatedScale } from "@/components/ui/FadeInView";

interface FabBarProps {
  tintColor: string;
  bgColor?: string;
  disabled?: boolean;
  onCopy:    () => void;
  onShuffle: () => void;
  onShare:   () => void;
}

interface FabItem {
  icon:    string;
  label:   string;
  onPress: () => void;
  primary?: boolean;
}

export function FabBar({
  tintColor,
  bgColor,
  disabled = false,
  onCopy,
  onShuffle,
  onShare,
}: FabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const actions: FabItem[] = [
    {
      icon: "shuffle-outline",
      label: "Shuffle",
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onShuffle();
      },
    },
    {
      icon: "copy-outline",
      label: "Copy",
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onCopy();
      },
    },
    {
      icon: "share-outline",
      label: "Export",
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onShare();
      },
      primary: true,
    },
  ];

  return (
    <Animated.View
      entering={FadeInDown.delay(400).duration(500).springify().damping(18)}
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom + Spacing.sm,
        },
      ]}
    >
      {actions.map((action) => (
        <AnimatedScale
          key={action.label}
          onPress={action.onPress}
          disabled={disabled}
          style={{ flex: 1 }}
        >
          {action.primary ? (
            <LinearGradient
              colors={disabled ? [colors.border, colors.border] : [tintColor, tintColor + "cc"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.btn, styles.btnPrimary]}
            >
              <Ionicons
                name={action.icon as any}
                size={20}
                color="#fff"
              />
              <Text
                style={[styles.btnLabel, { color: "#fff", fontFamily: Fonts.mono }]}
              >
                {action.label}
              </Text>
            </LinearGradient>
          ) : (
            <View
              style={[
                styles.btn,
                styles.btnSecondary,
                {
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                  opacity: disabled ? 0.4 : 1,
                },
              ]}
            >
              <Ionicons
                name={action.icon as any}
                size={20}
                color={colors.text}
              />
              <Text
                style={[styles.btnLabel, { color: colors.textMuted, fontFamily: Fonts.mono }]}
              >
                {action.label}
              </Text>
            </View>
          )}
        </AnimatedScale>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderTopWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  btnPrimary: {},
  btnSecondary: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  btnLabel: { fontSize: FontSize.sm, fontWeight: "600" },
});
