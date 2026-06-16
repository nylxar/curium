import { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const KOFI_URL = "https://ko-fi.com/nylxar";
const GUMROAD_URL = "https://nylxar.gumroad.com";

interface SupportOption {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  url: string;
  color: string;
}

const OPTIONS: SupportOption[] = [
  {
    icon: "cafe-outline",
    title: "Ko-fi",
    desc: "Buy me a coffee. One-time or recurring support.",
    url: KOFI_URL,
    color: "#FF5E5B",
  },
  {
    icon: "bag-outline",
    title: "Gumroad",
    desc: "Get premium packs or support via Gumroad.",
    url: GUMROAD_URL,
    color: "#FF90E8",
  },
];

export default function SupportScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(10);
  const cardsOpacity = useSharedValue(0);
  const cardsY = useSharedValue(10);

  useEffect(() => {
    headerOpacity.value = withDelay(100, withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }));
    headerY.value = withDelay(100, withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) }));
    cardsOpacity.value = withDelay(250, withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }));
    cardsY.value = withDelay(250, withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));
  const cardsStyle = useAnimatedStyle(() => ({
    opacity: cardsOpacity.value,
    transform: [{ translateY: cardsY.value }],
  }));

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
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={12}
          style={[
            styles.backBtn,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: colors.text, fontFamily: Fonts.monoBold },
          ]}
        >
          Support
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.body}>
        <Animated.View style={[styles.hero, headerStyle]}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primary + "15" }]}>
            <Ionicons name="heart" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.text, fontFamily: Fonts.monoBold }]}>
            Support Curium
          </Text>
          <Text style={[styles.heroDesc, { color: colors.textMuted, fontFamily: Fonts.mono }]}>
            If this app saved you from another ad-filled QR generator, consider supporting its development.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.options, cardsStyle]}>
          {OPTIONS.map((opt, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.optionCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => Linking.openURL(opt.url)}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIconWrap, { backgroundColor: opt.color + "18" }]}>
                <Ionicons name={opt.icon} size={22} color={opt.color} />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: colors.text, fontFamily: Fonts.monoBold }]}>
                  {opt.title}
                </Text>
                <Text style={[styles.optionDesc, { color: colors.textMuted, fontFamily: Fonts.mono }]}>
                  {opt.desc}
                </Text>
              </View>
              <Ionicons name="open-outline" size={16} color={colors.textFaint} />
            </TouchableOpacity>
          ))}
        </Animated.View>

        <Animated.View style={cardsStyle}>
          <Text style={[styles.footerNote, { color: colors.textFaint, fontFamily: Fonts.mono }]}>
            Every contribution keeps the app free, offline, and ad-free.
          </Text>
        </Animated.View>
      </View>
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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: FontSize.base,
    letterSpacing: 0.3,
  },
  body: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    gap: Spacing.xl,
  },
  hero: {
    alignItems: "center",
    gap: Spacing.md,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  heroTitle: {
    fontSize: FontSize.lg,
    letterSpacing: -0.3,
    textAlign: "center",
  },
  heroDesc: {
    fontSize: FontSize.sm,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
  },
  options: {
    gap: Spacing.md,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  optionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: FontSize.base,
  },
  optionDesc: {
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  footerNote: {
    fontSize: FontSize.xs,
    textAlign: "center",
    lineHeight: 18,
  },
});
