import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { Fonts, Spacing, Radius, FontSize } from "@/constants/theme";

type RowProps = {
  icon: string;
  label: string;
  sublabel?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
};

function SettingRow({ icon, label, sublabel, right, onPress, colors }: RowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[styles.row, { borderBottomColor: colors.border }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.surface }]}>
        <Ionicons name={icon as any} size={18} color={colors.textMuted} />
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowLabel, { color: colors.text, fontFamily: Fonts.mono }]}>
          {label}
        </Text>
        {sublabel ? (
          <Text style={[styles.rowSub, { color: colors.textMuted, fontFamily: Fonts.mono }]}>
            {sublabel}
          </Text>
        ) : null}
      </View>
      {right ?? (
        onPress ? <Ionicons name="chevron-forward" size={16} color={colors.textFaint} /> : null
      )}
    </TouchableOpacity>
  );
}

function SectionHeader({ title, colors }: { title: string; colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <Text style={[styles.sectionHeader, { color: colors.textMuted, fontFamily: Fonts.mono }]}>
      {title.toUpperCase()}
    </Text>
  );
}

export default function SettingsScreen() {
  const { colors, isDark, setTheme } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={["top"]}>
      {/* App bar */}
      <View style={[styles.appBar, { borderBottomColor: colors.border }]}>
        <Text style={[styles.appTitle, { color: colors.text, fontFamily: Fonts.monoBold }]}>
          Settings
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Appearance */}
        <SectionHeader title="Appearance" colors={colors} />
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow
            icon={isDark ? "moon" : "sunny"}
            label="Dark Mode"
            sublabel={isDark ? "On" : "Off"}
            colors={colors}
            right={
              <Switch
                value={isDark}
                onValueChange={(next) => setTheme(next ? "dark" : "light")}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={isDark ? "#fff" : "#fff"}
              />
            }
          />
        </View>

        {/* About */}
        <SectionHeader title="About" colors={colors} />
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow
            icon="information-circle-outline"
            label="Version"
            sublabel="1.0.0"
            colors={colors}
          />
          <SettingRow
            icon="logo-github"
            label="Source Code"
            sublabel="github.com/leviathnan/curium"
            colors={colors}
            onPress={() => Linking.openURL("https://github.com/leviathnan/curium")}
          />
          <SettingRow
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            colors={colors}
            onPress={() => Linking.openURL("https://curium.app/privacy")}
          />
        </View>

        {/* Footer */}
        <Text style={[styles.footer, { color: colors.textFaint, fontFamily: Fonts.mono }]}>
          Made with ♥  · Curium v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  appBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  appTitle: { fontSize: FontSize.lg },

  scrollContent: {
    padding: Spacing.base,
    paddingBottom: Spacing.xxl ?? 48,
    gap: Spacing.xs,
  },

  sectionHeader: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    letterSpacing: 0.8,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
    marginHorizontal: Spacing.xs,
  },

  section: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody:  { flex: 1, gap: 1 },
  rowLabel: { fontSize: FontSize.sm },
  rowSub:   { fontSize: FontSize.xs },

  footer: {
    fontSize: FontSize.xs,
    textAlign: "center",
    marginTop: Spacing.xxl ?? 48,
    marginBottom: Spacing.lg,
  },
});
