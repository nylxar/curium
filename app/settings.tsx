// app/settings.tsx — FULL REPLACEMENT
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { clearHistory } from "@/services/history";
import { loadSettings, saveSettings, AppSettings } from "@/services/settings";
import { useTheme } from "@/context/ThemeContext";
import { Spacing, Radius, FontSize, Fonts, AppTheme } from "@/constants/theme";
import { useToast } from "@/components/ui/Toast";
import { ModernSwitch } from "@/components/ui/ModernSwitch";

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

// ── Static section title — small caps label with a thin underline accent.
function SectionTitle({
  colors,
  children,
}: {
  colors: any;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionWrap}>
      <Text
        style={[
          styles.sectionTitle,
          { color: colors.textMuted, fontFamily: Fonts.monoBold },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

// ── Theme button — static render, no reveal animation.  Removing the
//    cascade keeps the screen feeling snappy on entry.
function ThemeBtn({
  active,
  colors,
  onPress,
  icon,
  label,
}: {
  active: boolean;
  colors: any;
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.themeBtn,
        {
          backgroundColor: active ? colors.primary + "22" : colors.surface,
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
  last,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
  iconBg?: string;
  last?: boolean;
  colors: any;
}) {
  return (
    <Pressable
      style={[
        styles.row,
        last && { borderBottomWidth: 0, paddingBottom: Spacing.md + 1 },
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.rowIcon,
          {
            backgroundColor:
              iconBg ?? (danger ? colors.error + "18" : colors.primary + "18"),
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={17}
          color={danger ? colors.error : colors.primary}
        />
      </View>
      <View style={styles.rowText}>
        <Text
          style={[
            styles.rowLabel,
            {
              color: danger ? colors.error : colors.text,
              fontFamily: Fonts.monoMedium,
            },
          ]}
        >
          {label}
        </Text>
        {sub && (
          <Text
            style={[
              styles.rowSub,
              { color: colors.textMuted, fontFamily: Fonts.mono },
            ]}
          >
            {sub}
          </Text>
        )}
      </View>
      <View>
        {right ??
          (onPress && (
            <Ionicons
              name="chevron-forward"
              size={14}
              color={colors.textFaint}
            />
          ))}
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { colors, theme, setTheme, pureDark, setPureDark } = useTheme();
  const [haptics, setHaptics] = useState(true);
  const [soundOnScan, setSoundOnScan] = useState(false);
  const [autoCopy, setAutoCopy] = useState(false);
  const [keepScreenOn, setKeepScreenOn] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    loadSettings().then((s) => {
      setHaptics(s.haptics);
      setSoundOnScan(s.soundOnScan);
      setAutoCopy(s.autoCopy);
      setKeepScreenOn(s.keepScreenOn);
    });
  }, []);

  const update = useCallback((partial: Partial<AppSettings>) => {
    saveSettings(partial);
  }, []);

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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xxxl,
        }}
      >
        {/* Theme */}
        <SectionTitle colors={colors}>Appearance</SectionTitle>
        <View style={S.themeRow}>
          {THEME_OPTIONS.map((t) => {
            const active = theme === t.id;
            return (
              <ThemeBtn
                key={t.id}
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

        {/* Enhancement */}
        {(theme === "dark" || theme === "system" || theme === "dynamic") && (
          <>
            <SectionTitle colors={colors}>Enhancement</SectionTitle>
            <Row
              icon="ellipse-outline"
              label="Pure Black"
              sub="True black background for OLED screens"
              colors={colors}
              last
              right={
                <ModernSwitch
                  value={pureDark}
                  onChange={(v) => {
                    setPureDark(v);
                    Haptics.selectionAsync();
                  }}
                  activeColor={colors.primary}
                  inactiveColor={colors.surfaceOffset}
                />
              }
            />
          </>
        )}

        {/* Interaction */}
        <SectionTitle colors={colors}>Interaction</SectionTitle>
        <Row
          icon="pulse-outline"
          label="Haptic Feedback"
          sub="Vibrate on taps and actions"
          colors={colors}
          right={
            <ModernSwitch
              value={haptics}
              onChange={(v) => {
                setHaptics(v);
                update({ haptics: v });
                if (v) Haptics.selectionAsync();
              }}
              activeColor={colors.primary}
              inactiveColor={colors.surfaceOffset}
            />
          }
        />
        <Row
          icon="volume-high-outline"
          label="Sound on Scan"
          sub="Play a beep when a QR is detected"
          colors={colors}
          right={
            <ModernSwitch
              value={soundOnScan}
              onChange={(v) => {
                setSoundOnScan(v);
                update({ soundOnScan: v });
                Haptics.selectionAsync();
              }}
              activeColor={colors.primary}
              inactiveColor={colors.surfaceOffset}
            />
          }
        />
        <Row
          icon="sunny-outline"
          label="Keep Screen On"
          sub="Prevent screen from sleeping"
          colors={colors}
          last
          right={
            <ModernSwitch
              value={keepScreenOn}
              onChange={(v) => {
                setKeepScreenOn(v);
                update({ keepScreenOn: v });
                Haptics.selectionAsync();
              }}
              activeColor={colors.primary}
              inactiveColor={colors.surfaceOffset}
            />
          }
        />

        {/* Generator */}
        <SectionTitle colors={colors}>Generator</SectionTitle>
        <Row
          icon="clipboard-outline"
          label="Auto-copy on Generate"
          sub="Copy QR content when you create one"
          colors={colors}
          last
          right={
            <ModernSwitch
              value={autoCopy}
              onChange={(v) => {
                setAutoCopy(v);
                update({ autoCopy: v });
                Haptics.selectionAsync();
              }}
              activeColor={colors.primary}
              inactiveColor={colors.surfaceOffset}
            />
          }
        />

        {/* Data */}
        <SectionTitle colors={colors}>Data</SectionTitle>
        <Row
          icon="trash-outline"
          label="Clear History"
          sub="Delete all saved QR codes"
          danger
          colors={colors}
          last
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
        <SectionTitle colors={colors}>App</SectionTitle>
        <Row
          icon="build-outline"
          label="App Info"
          sub="Version, build, and links"
          colors={colors}
          onPress={() => router.push("/info")}
        />
        <Row
          icon="information-circle-outline"
          label="About Curium"
          colors={colors}
          last
          onPress={() => router.push("/about")}
        />
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
