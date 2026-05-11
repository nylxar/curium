// app/settings.tsx — FULL REPLACEMENT
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { clearHistory } from "@/services/history";
import { useTheme } from "@/context/ThemeContext";
import { Spacing, Radius, FontSize, Fonts, AppTheme } from "@/constants/theme";

const THEME_OPTIONS: {
  id: AppTheme;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: "dark", label: "Dark", icon: "moon-outline" },
  { id: "light", label: "Light", icon: "sunny-outline" },
  { id: "system", label: "System", icon: "phone-portrait-outline" },
];

export default function SettingsScreen() {
  const { colors, theme, setTheme } = useTheme();
  const [haptics, setHaptics] = useState(true);
  const insets = useSafeAreaInsets();
  const router = useRouter();

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
      color: colors.textMuted,
      fontFamily: Fonts.monoBold,
      textTransform: "uppercase",
      letterSpacing: 1.2,
      marginTop: Spacing.xl,
      marginBottom: Spacing.sm,
      marginLeft: 2,
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
    themeBtn: {
      flex: 1,
      alignItems: "center",
      gap: Spacing.xs,
      paddingVertical: Spacing.md,
      borderRadius: Radius.lg,
      borderWidth: 1.5,
    },
    themeBtnLabel: { fontSize: FontSize.xs, fontFamily: Fonts.mono },
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
    accentRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      marginTop: Spacing.sm,
      padding: Spacing.md,
      borderRadius: Radius.md,
      borderWidth: StyleSheet.hairlineWidth,
    },
    accentDot: { width: 12, height: 12, borderRadius: 6 },
    accentLabel: { flex: 1, fontSize: FontSize.xs, lineHeight: 16 },
  });

  const Row = ({
    icon,
    label,
    sub,
    right,
    onPress,
    danger,
    iconBg,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    sub?: string;
    right?: React.ReactNode;
    onPress?: () => void;
    danger?: boolean;
    iconBg?: string;
  }) => (
    <TouchableOpacity
      style={S.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View
        style={[
          S.rowIcon,
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
      <View style={S.rowText}>
        <Text style={[S.rowLabel, danger && { color: colors.error }]}>
          {label}
        </Text>
        {sub && <Text style={S.rowSub}>{sub}</Text>}
      </View>
      {right ??
        (onPress && (
          <Ionicons name="chevron-forward" size={14} color={colors.textFaint} />
        ))}
    </TouchableOpacity>
  );

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
        <Text style={S.sectionTitle}>Appearance</Text>
        <View style={S.themeRow}>
          {THEME_OPTIONS.map((t) => {
            const active = theme === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[
                  S.themeBtn,
                  {
                    backgroundColor: active
                      ? colors.primary + "22"
                      : colors.surface,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setTheme(t.id);
                }}
              >
                <Ionicons
                  name={t.icon}
                  size={20}
                  color={active ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    S.themeBtnLabel,
                    { color: active ? colors.primary : colors.textMuted },
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View
          style={[
            S.accentRow,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={[S.accentDot, { backgroundColor: colors.primary }]} />
          <Text
            style={[
              S.accentLabel,
              { color: colors.textMuted, fontFamily: Fonts.mono },
            ]}
          >
            Accent follows your QR color — change it on the Create screen
          </Text>
        </View>

        {/* Interaction */}
        <Text style={S.sectionTitle}>Interaction</Text>
        <Row
          icon="pulse-outline"
          label="Haptic Feedback"
          sub="Vibrate on taps and actions"
          right={
            <Switch
              value={haptics}
              onValueChange={(v) => {
                setHaptics(v);
                Haptics.selectionAsync();
              }}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={haptics ? colors.primary : colors.textFaint}
            />
          }
        />

        {/* Privacy */}
        <Text style={S.sectionTitle}>Privacy</Text>
        <Row
          icon="shield-checkmark-outline"
          label="Offline Only"
          sub="No internet requests, ever"
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
          right={
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.success}
            />
          }
        />

        {/* Data */}
        <Text style={S.sectionTitle}>Data</Text>
        <Row
          icon="trash-outline"
          label="Clear History"
          sub="Delete all saved QR codes"
          danger
          onPress={() =>
            Alert.alert("Clear History", "Delete everything?", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Clear",
                style: "destructive",
                onPress: () => clearHistory(),
              },
            ])
          }
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
