import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { clearHistory } from "@/services/history";
import { Spacing, Radius, FontSize, Colors } from "@/constants/theme";

export default function SettingsScreen() {
  const [haptics, setHaptics] = useState(true);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleClearHistory = () => {
    Alert.alert(
      "Clear History",
      "Delete all saved QR codes? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: () => clearHistory() },
      ],
    );
  };

  const Section = ({ title }: { title: string }) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  const Row = ({
    icon,
    label,
    sub,
    right,
    onPress,
    destructive,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    sub?: string;
    right?: React.ReactNode;
    onPress?: () => void;
    destructive?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.row, { borderColor: Colors.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View
        style={[
          styles.rowIcon,
          {
            backgroundColor: (destructive ? "#ef4444" : Colors.primary) + "18",
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={destructive ? "#ef4444" : Colors.primary}
        />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, destructive && { color: "#ef4444" }]}>
          {label}
        </Text>
        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      {right ?? (
        <Ionicons name="chevron-forward" size={16} color={Colors.textFaint} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.screen, { backgroundColor: Colors.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: Spacing.base,
          paddingBottom: insets.bottom + Spacing.xl,
        }}
      >
        <Section title="Preferences" />
        <Row
          icon="pulse-outline"
          label="Haptic Feedback"
          sub="Vibrate on interactions"
          right={
            <Switch
              value={haptics}
              onValueChange={setHaptics}
              trackColor={{ true: Colors.primary }}
            />
          }
        />

        <Section title="Privacy" />
        <Row
          icon="shield-checkmark-outline"
          label="Offline Only"
          sub="Curium never sends data anywhere"
          right={
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={Colors.primary}
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
              color={Colors.primary}
            />
          }
        />

        <Section title="Data" />
        <Row
          icon="trash-outline"
          label="Clear History"
          sub="Delete all saved QR codes"
          onPress={handleClearHistory}
          destructive
        />

        <Section title="About" />
        <Row
          icon="information-circle-outline"
          label="Version"
          sub="Curium v1.0.0 · Built with ❤️"
          right={
            <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm }}>
              1.0.0
            </Text>
          }
        />
        <Row
          icon="code-slash-outline"
          label="Open Source"
          sub="Built with Expo + React Native"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.text },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    marginLeft: 2,
  },
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
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: FontSize.base, fontWeight: "600", color: Colors.text },
  rowSub: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
});
