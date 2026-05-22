import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";

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
    <View
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
        <TouchableOpacity
          key={action.label}
          onPress={action.onPress}
          disabled={disabled}
          activeOpacity={0.72}
          style={[
            styles.btn,
            action.primary
              ? [
                  styles.btnPrimary,
                  {
                    backgroundColor: disabled
                      ? colors.border
                      : tintColor,
                  },
                ]
              : [
                  styles.btnSecondary,
                  {
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                    opacity: disabled ? 0.4 : 1,
                  },
                ],
          ]}
        >
          <Ionicons
            name={action.icon as any}
            size={20}
            color={action.primary ? "#fff" : colors.text}
          />
          <Text
            style={[
              styles.btnLabel,
              {
                color: action.primary ? "#fff" : colors.textMuted,
                fontFamily: Fonts.mono,
              },
            ]}
          >
            {action.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
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
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  btn: {
    flex: 1,
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
