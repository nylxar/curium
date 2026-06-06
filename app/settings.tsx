// app/settings.tsx — FULL REPLACEMENT
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Switch,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { clearHistory } from "@/services/history";
import { useTheme } from "@/context/ThemeContext";
import { Spacing, Radius, FontSize, Fonts, AppTheme } from "@/constants/theme";
import { useToast } from "@/components/ui/Toast";

const THEME_OPTIONS: {
  id: AppTheme;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: "dark", label: "Dark", icon: "moon-outline" },
  { id: "light", label: "Light", icon: "sunny-outline" },
  { id: "system", label: "System", icon: "phone-portrait-outline" },
  { id: "dynamic", label: "Dynamic", icon: "color-palette-outline" },
];

// ── Animated section title — slides in from left, then a tiny underline
//    "ink-fill" sweeps from left to right under the word.
function AnimatedSection({
  index,
  colors,
  children,
}: {
  index: number;
  colors: any;
  children: React.ReactNode;
}) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(
      index * 28,
      withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) }),
    );
  }, []);
  const titleStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateX: (1 - progress.value) * -16 },
    ],
  }));
  const underlineStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
    opacity: progress.value,
  }));
  return (
    <View style={styles.sectionWrap}>
      <Animated.Text
        style={[
          styles.sectionTitle,
          { color: colors.textMuted, fontFamily: Fonts.monoBold },
          titleStyle,
        ]}
      >
        {children}
      </Animated.Text>
      <Animated.View
        style={[
          styles.sectionUnderline,
          { backgroundColor: colors.textMuted + "55" },
          underlineStyle,
        ]}
      />
    </View>
  );
}

// ── Animated theme button — micro stagger so the 4 buttons cascade in.
function AnimatedThemeBtn({
  index,
  active,
  colors,
  onPress,
  icon,
  label,
}: {
  index: number;
  active: boolean;
  colors: any;
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(
      60 + index * 24,
      withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) }),
    );
  }, []);
  const animStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: (1 - progress.value) * 10 },
      { scale: 0.96 + 0.04 * progress.value },
    ],
  }));
  return (
    <Animated.View style={[animStyle, { flex: 1 }]}>
      <TouchableOpacity
        style={[
          styles.themeBtn,
          {
            backgroundColor: active
              ? colors.primary + "22"
              : colors.surface,
            borderColor: active ? colors.primary : colors.border,
          },
        ]}
        onPress={onPress}
      >
        <Ionicons
          name={icon}
          size={20}
          color={active ? colors.primary : colors.textMuted}
        />
        <Text
          style={[
            styles.themeBtnLabel,
            { color: active ? colors.primary : colors.textMuted },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function Row({
  icon,
  label,
  sub,
  right,
  onPress,
  danger,
  iconBg,
  index = 0,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
  iconBg?: string;
  index?: number;
  colors: any;
}) {
  // ── "Cascade" reveal:  each row slides up from below + fades in,
  //    with a subtle scale-from-0.97.  Rows are staggered by 28ms so
  //    the whole section lands in ~580ms total.  Inside the row, the
  //    icon circle pops in slightly later, the text fades in mid-way,
  //    and the right side slides in last.
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      index * 28,
      withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) }),
    );
  }, []);

  const rowStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: (1 - progress.value) * 14 },
      { scale: 0.97 + 0.03 * progress.value },
    ],
  }));
  const iconStyle = useAnimatedStyle(() => {
    // Icon pops in slightly later than the row body, with a damped spin
    const local = interpolate(progress.value, [0.55, 1], [0, 1], "clamp");
    return {
      opacity: local,
      transform: [{ scale: 0.5 + 0.5 * local }],
    };
  });
  const textStyle = useAnimatedStyle(() => {
    const local = interpolate(progress.value, [0.35, 1], [0, 1], "clamp");
    return { opacity: local };
  });
  const rightStyle = useAnimatedStyle(() => {
    const local = interpolate(progress.value, [0.45, 1], [0, 1], "clamp");
    return {
      opacity: local,
      transform: [{ translateX: (1 - local) * 8 }],
    };
  });

  return (
    <Animated.View style={rowStyle}>
      <Pressable
        style={({ pressed }) => [
          styles.row,
          pressed && { backgroundColor: colors.surfaceOffset },
        ]}
        onPress={onPress}
      >
        <Animated.View
          style={[
            styles.rowIcon,
            {
              backgroundColor:
                iconBg ?? (danger ? colors.error + "18" : colors.primary + "18"),
            },
            iconStyle,
          ]}
        >
          <Ionicons
            name={icon}
            size={17}
            color={danger ? colors.error : colors.primary}
          />
        </Animated.View>
        <Animated.View style={[styles.rowText, textStyle]}>
          <Text style={[styles.rowLabel, danger && { color: colors.error }]}>
            {label}
          </Text>
          {sub && <Text style={styles.rowSub}>{sub}</Text>}
        </Animated.View>
        <Animated.View style={rightStyle}>
          {right ??
            (onPress && (
              <Ionicons
                name="chevron-forward"
                size={14}
                color={colors.textFaint}
              />
            ))}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export default function SettingsScreen() {
  const { colors, theme, setTheme } = useTheme();
  const [haptics, setHaptics] = useState(true);
  const [soundOnScan, setSoundOnScan] = useState(false);
  const [autoCopy, setAutoCopy] = useState(false);
  const [keepScreenOn, setKeepScreenOn] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();

  const S = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.md,
      paddingTop: insets.top + Spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: FontSize.lg,
      color: colors.text,
      fontFamily: Fonts.monoBold,
    },
    sectionTitle: {
      fontSize: FontSize.xs,
      textTransform: "uppercase",
      letterSpacing: 1.2,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingVertical: Spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    rowIcon: {
      width: 36,
      height: 36,
      borderRadius: Radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    rowText: { flex: 1 },
    rowLabel: {
      fontSize: FontSize.base,
      color: colors.text,
      fontFamily: Fonts.monoMedium,
    },
    rowSub: {
      fontSize: FontSize.xs,
      color: colors.textMuted,
      marginTop: 2,
      fontFamily: Fonts.mono,
    },
    themeRow: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.sm },
    versionBox: {
      marginTop: Spacing.xl,
      padding: Spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      alignItems: "center",
      gap: Spacing.xs,
    },
    versionTitle: {
      fontSize: FontSize.md,
      color: colors.text,
      fontFamily: Fonts.monoBold,
    },
    versionSub: {
      fontSize: FontSize.xs,
      color: colors.textFaint,
      fontFamily: Fonts.mono,
    },
    dynamicNote: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      padding: Spacing.md,
      borderRadius: Radius.md,
      borderWidth: 1,
      marginTop: Spacing.sm,
    },
    dynamicNoteText: { flex: 1, fontSize: FontSize.xs, lineHeight: 16 },
  });

  return (
    <View style={S.screen}>
      <View style={S.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={S.title}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xxxl,
        }}
      >
        {/* Theme */}
        <AnimatedSection index={0} colors={colors}>
          Appearance
        </AnimatedSection>
        <View style={S.themeRow}>
          {THEME_OPTIONS.map((t, i) => {
            const active = theme === t.id;
            return (
              <AnimatedThemeBtn
                key={t.id}
                index={i}
                active={active}
                colors={colors}
                onPress={() => {
                  Haptics.selectionAsync();
                  setTheme(t.id);
                }}
                icon={t.icon}
                label={t.label}
              />
            );
          })}
        </View>
        {theme === "dynamic" && (
          <View
            style={[
              S.dynamicNote,
              {
                backgroundColor: colors.primary + "15",
                borderColor: colors.primary + "30",
              },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={14}
              color={colors.primary}
            />
            <Text
              style={[
                S.dynamicNoteText,
                { color: colors.primary, fontFamily: Fonts.mono },
              ]}
            >
              App colors match your QR theme. Change it on the Create screen.
            </Text>
          </View>
        )}

        {/* Interaction */}
        <AnimatedSection index={1} colors={colors}>
          Interaction
        </AnimatedSection>
        <Row
          icon="pulse-outline"
          label="Haptic Feedback"
          sub="Vibrate on taps and actions"
          index={5}
          colors={colors}
          right={
            <Switch
              value={haptics}
              onValueChange={(v) => {
                setHaptics(v);
                if (v) Haptics.selectionAsync();
              }}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={haptics ? colors.primary : colors.textFaint}
            />
          }
        />
        <Row
          icon="volume-high-outline"
          label="Sound on Scan"
          sub="Play a beep when a QR is detected"
          index={6}
          colors={colors}
          right={
            <Switch
              value={soundOnScan}
              onValueChange={(v) => {
                setSoundOnScan(v);
                Haptics.selectionAsync();
              }}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={soundOnScan ? colors.primary : colors.textFaint}
            />
          }
        />
        <Row
          icon="sunny-outline"
          label="Keep Screen On"
          sub="Prevent screen from sleeping"
          index={7}
          colors={colors}
          right={
            <Switch
              value={keepScreenOn}
              onValueChange={(v) => {
                setKeepScreenOn(v);
                Haptics.selectionAsync();
              }}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={keepScreenOn ? colors.primary : colors.textFaint}
            />
          }
        />

        {/* Generator */}
        <AnimatedSection index={2} colors={colors}>
          Generator
        </AnimatedSection>
        <Row
          icon="clipboard-outline"
          label="Auto-copy on Generate"
          sub="Copy QR content when you create one"
          index={8}
          colors={colors}
          right={
            <Switch
              value={autoCopy}
              onValueChange={(v) => {
                setAutoCopy(v);
                Haptics.selectionAsync();
              }}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={autoCopy ? colors.primary : colors.textFaint}
            />
          }
        />

        {/* Privacy */}
        <AnimatedSection index={3} colors={colors}>
          Privacy
        </AnimatedSection>
        <Row
          icon="shield-checkmark-outline"
          label="Offline Only"
          sub="No internet requests, ever"
          index={10}
          colors={colors}
          right={
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.success}
            />
          }
        />
        <Row
          icon="eye-off-outline"
          label="No Tracking"
          sub="Zero analytics, zero telemetry"
          index={11}
          colors={colors}
          right={
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.success}
            />
          }
        />
        <Row
          icon="lock-closed-outline"
          label="Local Storage Only"
          sub="All data stays on your device"
          index={12}
          colors={colors}
          right={
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.success}
            />
          }
        />

        {/* Data */}
        <AnimatedSection index={4} colors={colors}>
          Data
        </AnimatedSection>
        <Row
          icon="trash-outline"
          label="Clear History"
          sub="Delete all saved QR codes"
          danger
          index={13}
          colors={colors}
          onPress={() =>
            toast.confirm(
              "Clear History",
              "Delete everything?",
              () => clearHistory(),
              "Clear",
              true,
            )
          }
        />

        {/* App */}
        <AnimatedSection index={5} colors={colors}>
          App
        </AnimatedSection>
        <Row
          icon="information-circle-outline"
          label="About Curium"
          sub="Version, build, and more"
          index={15}
          colors={colors}
          onPress={() => router.push("/about")}
        />

        {/* Version card */}
        <View style={S.versionBox}>
          <Text style={S.versionTitle}>Curium</Text>
          <Text style={S.versionSub}>v1.0.0 · Privacy-first QR generator</Text>
          <Text style={S.versionSub}>
            Built with Expo · No trackers · Fully offline
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1 },
  rowLabel: {
    fontSize: FontSize.base,
    fontFamily: Fonts.monoMedium,
  },
  rowSub: {
    fontSize: FontSize.xs,
    color: "#8b949e",
    marginTop: 2,
    fontFamily: Fonts.mono,
  },
  sectionWrap: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    marginLeft: 2,
    gap: 4,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  sectionUnderline: {
    height: 1.5,
    width: 28,
    borderRadius: 1,
    transformOrigin: "left center",
  },
  themeBtn: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  themeBtnLabel: { fontSize: FontSize.xs, fontFamily: Fonts.mono },
});
