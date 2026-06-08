import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useTheme } from "@/context/ThemeContext";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";
import buildInfo from "@/constants/build-info.json";
import { useToast } from "@/components/ui/Toast";
import AppIcon from "@/assets/icon.png";

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  index: number;
  colors: any;
}

function InfoRow({ icon, label, value, index, colors }: InfoRowProps) {
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withDelay(index * 40, withTiming(1, { duration: 280 }));
  }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[styles.infoRow, animStyle]}>
      <View
        style={[styles.infoIcon, { backgroundColor: colors.primary + "18" }]}
      >
        <Ionicons name={icon} size={15} color={colors.primary} />
      </View>
      <Text
        style={[
          styles.infoLabel,
          { color: colors.textMuted, fontFamily: Fonts.mono },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.infoValue,
          { color: colors.text, fontFamily: Fonts.monoBold },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </Animated.View>
  );
}

interface ActionRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub: string;
  onPress: () => void;
  tintColor: string;
  index: number;
}

function ActionRow({
  icon,
  label,
  sub,
  onPress,
  tintColor,
  index,
}: ActionRowProps) {
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withDelay(index * 50, withTiming(1, { duration: 280 }));
  }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={styles.actionRow}
        activeOpacity={0.6}
        onPress={onPress}
      >
        <View
          style={[styles.actionIcon, { backgroundColor: tintColor + "18" }]}
        >
          <Ionicons name={icon} size={18} color={tintColor} />
        </View>
        <View style={styles.actionText}>
          <Text
            style={[
              styles.actionLabel,
              { color: tintColor, fontFamily: Fonts.monoBold },
            ]}
          >
            {label}
          </Text>
          <Text
            style={[
              styles.actionSub,
              { color: tintColor + "99", fontFamily: Fonts.mono },
            ]}
          >
            {sub}
          </Text>
        </View>
        <Ionicons name="open-outline" size={14} color={tintColor + "60"} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function AboutScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();

  const [appVersion] = useState(Constants.expoConfig?.version ?? "0.0.0");
  const [appVariant] = useState<"dev" | "prod">(__DEV__ ? "dev" : "prod");

  const openLink = async (url: string, label: string) => {
    try {
      const can = await Linking.canOpenURL(url);
      if (!can) {
        toast.error("Unavailable", `Cannot open ${label} on this device.`);
        return;
      }
      await Linking.openURL(url);
    } catch {
      toast.error("Error", `Could not open ${label}.`);
    }
  };

  const copyCommit = () => {
    // Lazy import to avoid bundling if not used elsewhere
    import("expo-clipboard").then(({ setStringAsync }) => {
      setStringAsync(buildInfo.commit);
      toast.success("Copied", "Commit hash copied to clipboard.");
    });
  };

  // Links — adjust to real values when published
  const GITHUB_URL = "https://github.com/leviathnan/Curium";
  const DONATE_URL = "https://github.com/sponsors/leviathnan";
  const ISSUES_URL = "https://github.com/leviathnan/Curium/issues";
  const RELEASES_URL = "https://github.com/leviathnan/Curium/releases";

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + Spacing.sm,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: colors.text, fontFamily: Fonts.monoBold },
          ]}
        >
          About
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xxxl,
        }}
      >
        {/* App identity card */}
        <View
          style={[
            styles.identityCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.logoBox,
              {
                backgroundColor: colors.primary + "18",
                borderColor: colors.primary + "40",
              },
            ]}
          >
            <Image
              source={AppIcon}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text
            style={[
              styles.appName,
              { color: colors.text, fontFamily: Fonts.monoBold },
            ]}
          >
            Curium
          </Text>
          <Text
            style={[
              styles.appTagline,
              { color: colors.textMuted, fontFamily: Fonts.mono },
            ]}
          >
            Privacy-first QR customizer
          </Text>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    appVariant === "dev"
                      ? colors.warning + "20"
                      : colors.success + "20",
                  borderColor:
                    appVariant === "dev"
                      ? colors.warning + "50"
                      : colors.success + "50",
                },
              ]}
            >
              <View
                style={[
                  styles.badgeDot,
                  {
                    backgroundColor:
                      appVariant === "dev" ? colors.warning : colors.success,
                  },
                ]}
              />
              <Text
                style={[
                  styles.badgeText,
                  {
                    color:
                      appVariant === "dev" ? colors.warning : colors.success,
                    fontFamily: Fonts.monoBold,
                  },
                ]}
              >
                {appVariant.toUpperCase()}
              </Text>
            </View>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: colors.primary + "18",
                  borderColor: colors.primary + "40",
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: colors.primary, fontFamily: Fonts.monoBold },
                ]}
              >
                v{appVersion}
              </Text>
            </View>
          </View>
        </View>

        {/* Build info section */}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.textMuted, fontFamily: Fonts.monoBold },
          ]}
        >
          BUILD
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <InfoRow
            icon="git-commit-outline"
            label="Commit"
            value={buildInfo.shortCommit + (buildInfo.isDirty ? " •" : "")}
            index={0}
            colors={colors}
          />
          <InfoRow
            icon="git-branch-outline"
            label="Branch"
            value={buildInfo.branch || "—"}
            index={1}
            colors={colors}
          />
          <InfoRow
            icon="calendar-outline"
            label="Committed"
            value={
              buildInfo.commitDate ? buildInfo.commitDate.split(" ")[0] : "—"
            }
            index={2}
            colors={colors}
          />
          <InfoRow
            icon="time-outline"
            label="Built"
            value={buildInfo.buildDate.split("T")[0]}
            index={3}
            colors={colors}
          />
          <InfoRow
            icon="phone-portrait-outline"
            label="Platform"
            value={`${Platform.OS} · ${Platform.Version}`}
            index={4}
            colors={colors}
          />
          <InfoRow
            icon="cube-outline"
            label="Runtime"
            value={`Expo SDK ${Constants.expoConfig?.sdkVersion ?? "—"}`}
            index={5}
            colors={colors}
          />

          <TouchableOpacity
            style={[styles.copyRow, { borderTopColor: colors.border }]}
            onPress={copyCommit}
            activeOpacity={0.6}
          >
            <Ionicons name="copy-outline" size={14} color={colors.textMuted} />
            <Text
              style={[
                styles.copyRowText,
                { color: colors.textMuted, fontFamily: Fonts.mono },
              ]}
            >
              Tap to copy full commit hash
            </Text>
          </TouchableOpacity>
        </View>

        {/* Links section */}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.textMuted, fontFamily: Fonts.monoBold },
          ]}
        >
          LINKS
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <ActionRow
            icon="logo-github"
            label="Source Code"
            sub={GITHUB_URL.replace("https://", "")}
            onPress={() => openLink(GITHUB_URL, "GitHub")}
            tintColor={colors.primary}
            index={0}
          />
          <ActionRow
            icon="bug-outline"
            label="Report an Issue"
            sub={ISSUES_URL.replace("https://", "")}
            onPress={() => openLink(ISSUES_URL, "Issues")}
            tintColor={colors.primary}
            index={1}
          />
          <ActionRow
            icon="megaphone-outline"
            label="Release Notes"
            sub={RELEASES_URL.replace("https://", "")}
            onPress={() => openLink(RELEASES_URL, "Releases")}
            tintColor={colors.primary}
            index={2}
          />
          <ActionRow
            icon="heart-outline"
            label="Support Development"
            sub="Donate via GitHub Sponsors"
            onPress={() => openLink(DONATE_URL, "Donate")}
            tintColor={colors.error}
            index={3}
          />
        </View>

        {/* Privacy section */}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.textMuted, fontFamily: Fonts.monoBold },
          ]}
        >
          PRIVACY
        </Text>
        <View
          style={[
            styles.card,
            styles.privacyCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.privacyItem}>
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color={colors.success}
            />
            <Text
              style={[
                styles.privacyText,
                { color: colors.text, fontFamily: Fonts.mono },
              ]}
            >
              No internet requests. Fully offline.
            </Text>
          </View>
          <View style={styles.privacyItem}>
            <Ionicons name="eye-off-outline" size={16} color={colors.success} />
            <Text
              style={[
                styles.privacyText,
                { color: colors.text, fontFamily: Fonts.mono },
              ]}
            >
              No analytics, no tracking, no telemetry.
            </Text>
          </View>
          <View style={styles.privacyItem}>
            <Ionicons
              name="lock-closed-outline"
              size={16}
              color={colors.success}
            />
            <Text
              style={[
                styles.privacyText,
                { color: colors.text, fontFamily: Fonts.mono },
              ]}
            >
              All data stays on your device.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text
            style={[
              styles.footerText,
              { color: colors.textFaint, fontFamily: Fonts.mono },
            ]}
          >
            Made with care · Open source
          </Text>
          <Text
            style={[
              styles.footerText,
              { color: colors.textFaint, fontFamily: Fonts.mono },
            ]}
          >
            © {new Date().getFullYear()} Curium
          </Text>
        </View>
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
  },
  headerTitle: {
    fontSize: FontSize.lg,
  },
  identityCard: {
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: Radius.lg,
    borderWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
    overflow: "hidden",
  },
  logoImage: {
    width: 64,
    height: 64,
  },
  appName: {
    fontSize: FontSize.xl,
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
  },
  badgeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  badgeText: {
    fontSize: 10,
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    letterSpacing: 1.5,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    marginLeft: 2,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoIcon: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    flex: 1,
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: FontSize.sm,
    maxWidth: "55%",
  },
  copyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  copyRowText: {
    fontSize: 11,
    letterSpacing: 0.3,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { flex: 1 },
  actionLabel: {
    fontSize: FontSize.base,
  },
  actionSub: {
    fontSize: 11,
    marginTop: 2,
  },
  privacyCard: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  privacyItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  privacyText: {
    flex: 1,
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  footer: {
    alignItems: "center",
    marginTop: Spacing.xl,
    gap: 4,
  },
  footerText: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
