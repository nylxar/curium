import { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/context/ThemeContext";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";
import { RELEASE_NOTES_MD } from "@/constants/release-notes";
import { parseReleaseNotes, ParsedRelease } from "@/utils/release-notes-parser";

const LAST_SEEN_KEY = "curium_last_seen_version";

function FadeIn({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const opacity = useSharedValue(0);
  const y = useSharedValue(12);
  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }),
    );
    y.value = withDelay(
      delay,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }),
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: y.value }],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

export default function WhatsNewScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ forced?: string; chain?: string }>();
  const isForced = params.forced === "true";
  const isChained = params.chain === "true";

  const release = useMemo(() => parseReleaseNotes(RELEASE_NOTES_MD), []);
  const appVersion = require("../app.json").expo.version;
  const [matched, setMatched] = useState(true);

  const dismiss = useCallback(() => {
    if (isChained) router.replace("/");
    else router.back();
  }, [isChained, router]);

  useEffect(() => {
    // If parsed version doesn't match app version, no notes to show
    setMatched(release.version === appVersion);
  }, [release, appVersion]);

  useEffect(() => {
    if (isForced) return;
    AsyncStorage.getItem(LAST_SEEN_KEY).then((last) => {
      if (last === appVersion) {
        router.replace("/");
      } else {
        AsyncStorage.setItem(LAST_SEEN_KEY, appVersion);
      }
    });
  }, [appVersion, isForced]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + Spacing.sm,
            borderBottomColor: colors.border,
          },
        ]}
      >
        {isForced ? (
          <TouchableOpacity onPress={dismiss} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
        <Text
          style={[
            styles.headerTitle,
            { color: colors.text, fontFamily: Fonts.monoBold },
          ]}
        >
          What's New
        </Text>
        <TouchableOpacity onPress={dismiss} hitSlop={12}>
          <Text
            style={[
              styles.doneBtn,
              { color: colors.primary, fontFamily: Fonts.monoBold },
            ]}
          >
            Done
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xxxl,
        }}
      >
        {/* Version badge */}
        <FadeIn delay={0}>
          <View style={styles.hero}>
            <View
              style={[
                styles.versionBadge,
                { backgroundColor: colors.primary + "15" },
              ]}
            >
              <Text
                style={[
                  styles.versionText,
                  { color: colors.primary, fontFamily: Fonts.monoBold },
                ]}
              >
                v{release.version || appVersion}
              </Text>
            </View>
            {release.channel ? (
              <View
                style={[
                  styles.channelBadge,
                  { backgroundColor: colors.primary + "10" },
                ]}
              >
                <Text
                  style={[
                    styles.channelText,
                    { color: colors.textMuted, fontFamily: Fonts.mono },
                  ]}
                >
                  {release.channel}
                </Text>
              </View>
            ) : null}
          </View>
        </FadeIn>

        {/* Release sections */}
        {release.sections.map((section, si) => (
          <FadeIn key={si} delay={100 + si * 80}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View
                  style={[
                    styles.sectionIcon,
                    { backgroundColor: colors.primary + "15" },
                  ]}
                >
                  <Ionicons
                    name={section.icon as keyof typeof Ionicons.glyphMap}
                    size={16}
                    color={colors.primary}
                  />
                </View>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.text, fontFamily: Fonts.monoBold },
                  ]}
                >
                  {section.title}
                </Text>
              </View>
              {section.items.map((item, ii) => (
                <View key={ii} style={styles.itemRow}>
                  <View
                    style={[
                      styles.itemDot,
                      { backgroundColor: colors.primary + "40" },
                    ]}
                  />
                  <Text
                    style={[
                      styles.itemText,
                      { color: colors.textMuted, fontFamily: Fonts.mono },
                    ]}
                  >
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </FadeIn>
        ))}

        {/* No release data for this version */}
        {!matched && (
          <FadeIn delay={100}>
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.textFaint }]}>
                No release notes for v{appVersion} yet.
              </Text>
            </View>
          </FadeIn>
        )}
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
  doneBtn: {
    fontSize: FontSize.sm,
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: Spacing.sm,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.lg,
  },
  versionBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  versionText: {
    fontSize: FontSize.sm,
    letterSpacing: 1,
  },
  channelBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  channelText: {
    fontSize: FontSize.sm,
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: FontSize.base,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.md,
  },
  itemDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 7,
  },
  itemText: {
    flex: 1,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  empty: {
    paddingVertical: Spacing.xxl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: FontSize.sm,
    fontFamily: Fonts.mono,
  },
});
