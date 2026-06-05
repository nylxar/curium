import { ReactNode } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";
import { AnimatedSheet } from "@/components/ui/AnimatedSheet";

interface OptionRowProps {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  preview?: ReactNode;
  tintColor: string;
  bgColor?: string;
  onOpen?: () => void;
  onClose?: () => void;
  sheetOpen?: boolean;
  sheetSubtitle?: string;
  children?: ReactNode;
}

export function OptionRow({
  label,
  iconName,
  preview,
  tintColor,
  bgColor,
  onOpen,
  onClose,
  sheetOpen: externalOpen,
  sheetSubtitle,
  children,
}: OptionRowProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <>
      <Animated.View style={[pressStyle]}>
        <Pressable
          style={({ pressed }) => [
            styles.row,
            {
              backgroundColor: pressed
                ? colors.surfaceOffset
                : bgColor ?? colors.surface,
              borderColor: colors.border,
            },
          ]}
          onPressIn={() => {
            scale.value = withSpring(0.98, { damping: 18, stiffness: 300 });
          }}
          onPressOut={() => {
            scale.value = withSpring(1, { damping: 18, stiffness: 300 });
          }}
          onPress={onOpen}
        >
          <View
            style={[styles.iconBox, { backgroundColor: tintColor + "18" }]}
          >
            <Ionicons name={iconName} size={18} color={tintColor} />
          </View>
          <Text
            style={[
              styles.label,
              { color: colors.text, fontFamily: Fonts.monoMedium },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          <View style={styles.right}>
            {preview ? <View style={styles.preview}>{preview}</View> : null}
            <View
              style={[
                styles.chevronWrap,
                { backgroundColor: colors.surfaceOffset },
              ]}
            >
              <Ionicons
                name="chevron-forward"
                size={14}
                color={colors.textMuted}
              />
            </View>
          </View>
        </Pressable>
      </Animated.View>

      <AnimatedSheet
        visible={!!externalOpen}
        onClose={onClose ?? (() => {})}
        bgColor={colors.surface}
        borderColor={colors.border}
      >
        <View style={styles.sheetHeader}>
          <View
            style={[
              styles.sheetIconCircle,
              { backgroundColor: tintColor + "18" },
            ]}
          >
            <Ionicons name={iconName} size={20} color={tintColor} />
          </View>
          <View style={styles.sheetTitles}>
            <Text
              style={[
                styles.sheetTitle,
                { color: colors.text, fontFamily: Fonts.monoBold },
              ]}
            >
              {label}
            </Text>
            {sheetSubtitle ? (
              <Text
                style={[
                  styles.sheetSubtitle,
                  { color: colors.textMuted, fontFamily: Fonts.mono },
                ]}
              >
                {sheetSubtitle}
              </Text>
            ) : null}
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            style={({ pressed }) => [
              styles.sheetClose,
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

        <View
          style={[
            styles.sheetAccent,
            { backgroundColor: tintColor + "50" },
          ]}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </AnimatedSheet>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    flex: 1,
    fontSize: FontSize.base,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  preview: {
    alignItems: "flex-end",
  },
  chevronWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingTop: Spacing.xs,
  },
  sheetIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitles: {
    flex: 1,
    gap: 2,
  },
  sheetTitle: {
    fontSize: FontSize.lg,
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
  },
  sheetClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  sheetAccent: {
    height: 2,
    borderRadius: 1,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    alignSelf: "flex-start",
    width: 36,
  },
  scroll: { maxHeight: 500 },
  content: { gap: Spacing.sm, paddingBottom: Spacing.sm },
});
