import { useEffect } from "react";
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
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";

function FadeIn({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
  }, []);
  return (
    <Animated.View style={useAnimatedStyle(() => ({ opacity: opacity.value }))}>
      {children}
    </Animated.View>
  );
}

export default function AboutScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xxxl,
        }}
      >
        {/* What is this */}
        <FadeIn delay={0}>
          <Text
            style={[
              styles.sectionLabel,
              { color: colors.textMuted, fontFamily: Fonts.monoBold },
            ]}
          >
            WHAT IS THIS
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text
              style={[
                styles.bodyText,
                { color: colors.text, fontFamily: Fonts.mono },
              ]}
            >
              Curium is a QR code generator, customizer, and scanner. It runs
              entirely on your device. No servers. No accounts. No cloud. Your
              QR codes, your data, your rules.
            </Text>
          </View>
        </FadeIn>

        {/* Why it exists */}
        <FadeIn delay={60}>
          <Text
            style={[
              styles.sectionLabel,
              { color: colors.textMuted, fontFamily: Fonts.monoBold },
            ]}
          >
            WHY IT EXISTS
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text
              style={[
                styles.bodyText,
                { color: colors.text, fontFamily: Fonts.mono },
              ]}
            >
              Every QR code generator on the internet does the same thing: they
              let you create a code, then they track you, log your data, or
              serve you ads. Most of them are free because you are the product.
            </Text>
            <Text
              style={[
                styles.bodyText,
                {
                  color: colors.text,
                  fontFamily: Fonts.mono,
                  marginTop: Spacing.md,
                },
              ]}
            >
              Curium exists because a QR code is a simple thing. It does not
              need a server. It does not need your location. It does not need to
              phone home. It is math — and math works offline.
            </Text>
          </View>
        </FadeIn>

        {/* The problem */}
        <FadeIn delay={120}>
          <Text
            style={[
              styles.sectionLabel,
              { color: colors.textMuted, fontFamily: Fonts.monoBold },
            ]}
          >
            THE PROBLEM
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.pointRow}>
              <Ionicons
                name="close-circle-outline"
                size={16}
                color={colors.error}
              />
              <Text
                style={[
                  styles.pointText,
                  { color: colors.text, fontFamily: Fonts.mono },
                ]}
              >
                Most QR tools inject tracking parameters into your codes
              </Text>
            </View>
            <View style={styles.pointRow}>
              <Ionicons
                name="close-circle-outline"
                size={16}
                color={colors.error}
              />
              <Text
                style={[
                  styles.pointText,
                  { color: colors.text, fontFamily: Fonts.mono },
                ]}
              >
                They log every scan — time, location, device, referrer
              </Text>
            </View>
            <View style={styles.pointRow}>
              <Ionicons
                name="close-circle-outline"
                size={16}
                color={colors.error}
              />
              <Text
                style={[
                  styles.pointText,
                  { color: colors.text, fontFamily: Fonts.mono },
                ]}
              >
                They sell this data to advertisers, or worse, leak it
              </Text>
            </View>
            <View style={styles.pointRow}>
              <Ionicons
                name="close-circle-outline"
                size={16}
                color={colors.error}
              />
              <Text
                style={[
                  styles.pointText,
                  { color: colors.text, fontFamily: Fonts.mono },
                ]}
              >
                They lock basic features behind paywalls and subscriptions
              </Text>
            </View>
            <View style={styles.pointRow}>
              <Ionicons
                name="close-circle-outline"
                size={16}
                color={colors.error}
              />
              <Text
                style={[
                  styles.pointText,
                  { color: colors.text, fontFamily: Fonts.mono },
                ]}
              >
                They require accounts for basic features like saving or
                customizing
              </Text>
            </View>
          </View>
        </FadeIn>

        {/* What Curium does differently */}
        <FadeIn delay={180}>
          <Text
            style={[
              styles.sectionLabel,
              { color: colors.textMuted, fontFamily: Fonts.monoBold },
            ]}
          >
            WHAT CURIUM DOES DIFFERENTLY
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.pointRow}>
              <Ionicons name="checkmark" size={16} color={colors.text} />
              <Text
                style={[
                  styles.pointText,
                  { color: colors.text, fontFamily: Fonts.mono },
                ]}
              >
                Zero network requests — not even a ping
              </Text>
            </View>
            <View style={styles.pointRow}>
              <Ionicons name="checkmark" size={16} color={colors.text} />
              <Text
                style={[
                  styles.pointText,
                  { color: colors.text, fontFamily: Fonts.mono },
                ]}
              >
                No accounts, no sign-ups, no email collection
              </Text>
            </View>
            <View style={styles.pointRow}>
              <Ionicons name="checkmark" size={16} color={colors.text} />
              <Text
                style={[
                  styles.pointText,
                  { color: colors.text, fontFamily: Fonts.mono },
                ]}
              >
                No analytics, no telemetry, no crash reporting
              </Text>
            </View>
            <View style={styles.pointRow}>
              <Ionicons name="checkmark" size={16} color={colors.text} />
              <Text
                style={[
                  styles.pointText,
                  { color: colors.text, fontFamily: Fonts.mono },
                ]}
              >
                Full customization offline — colors, shapes, logos, eyes, etc.
              </Text>
            </View>
            <View style={styles.pointRow}>
              <Ionicons name="checkmark" size={16} color={colors.text} />
              <Text
                style={[
                  styles.pointText,
                  { color: colors.text, fontFamily: Fonts.mono },
                ]}
              >
                Open source — anyone can audit the code
              </Text>
            </View>
          </View>
        </FadeIn>

        {/* Against capitalism */}
        <FadeIn delay={240}>
          <Text
            style={[
              styles.sectionLabel,
              { color: colors.textMuted, fontFamily: Fonts.monoBold },
            ]}
          >
            AGAINST CAPITALISM FOR SIMPLE THINGS
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text
              style={[
                styles.bodyText,
                { color: colors.text, fontFamily: Fonts.mono },
              ]}
            >
              A QR code is a 35-year-old standard. It is public domain math. The
              idea that companies can charge you for generating a QR code — or
              worse, track you for doing it — is absurd.
            </Text>
            <Text
              style={[
                styles.bodyText,
                {
                  color: colors.text,
                  fontFamily: Fonts.mono,
                  marginTop: Spacing.md,
                },
              ]}
            >
              Curium rejects the idea that every digital tool must be a SaaS
              product. Some things should just work. Some things should be free.
              Some things should respect your privacy by default, not as a
              premium feature.
            </Text>
            <Text
              style={[
                styles.bodyText,
                {
                  color: colors.text,
                  fontFamily: Fonts.mono,
                  marginTop: Spacing.md,
                },
              ]}
            >
              We believe the QR code space is oversaturated with tools that
              exist to harvest data, not to serve users. Curium is the
              antithesis of that model.
            </Text>
          </View>
        </FadeIn>

        {/* Making others obsolete */}
        <FadeIn delay={300}>
          <Text
            style={[
              styles.sectionLabel,
              { color: colors.textMuted, fontFamily: Fonts.monoBold },
            ]}
          >
            MAKING OTHER TOOLS OBSOLETE
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text
              style={[
                styles.bodyText,
                { color: colors.text, fontFamily: Fonts.mono },
              ]}
            >
              Most QR tools are web apps. They require an internet connection.
              They store your designs on their servers. They can disappear at
              any time, and your saved QR codes go with them.
            </Text>
            <Text
              style={[
                styles.bodyText,
                {
                  color: colors.text,
                  fontFamily: Fonts.mono,
                  marginTop: Spacing.md,
                },
              ]}
            >
              Curium is a native app. It works without internet. Your history,
              your designs, your settings — they live on your device. No server
              dependency means no shutdown risk. No account means no lock-in.
            </Text>
            <Text
              style={[
                styles.bodyText,
                {
                  color: colors.text,
                  fontFamily: Fonts.mono,
                  marginTop: Spacing.md,
                },
              ]}
            >
              As Curium adds batch generation, templates, SVG export, and deep
              customization — features that web tools charge for or lock behind
              paywalls — the value proposition of every QR SaaS collapses. Why
              pay monthly for something you can own forever?
            </Text>
          </View>
        </FadeIn>

        {/* The future */}
        <FadeIn delay={360}>
          <Text
            style={[
              styles.sectionLabel,
              { color: colors.textMuted, fontFamily: Fonts.monoBold },
            ]}
          >
            THE FUTURE
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text
              style={[
                styles.bodyText,
                { color: colors.text, fontFamily: Fonts.mono },
              ]}
            >
              Curium is not just an app. It is a statement. Every feature we
              ship proves that a tool can be powerful, beautiful, and free —
              without compromising your privacy.
            </Text>
            <Text
              style={[
                styles.bodyText,
                {
                  color: colors.text,
                  fontFamily: Fonts.mono,
                  marginTop: Spacing.md,
                },
              ]}
            >
              We are building the definitive QR tool. Not the one that makes the
              most money. The one that makes all others unnecessary.
            </Text>
          </View>
        </FadeIn>

        {/* Footer */}
        <View style={styles.footer}>
          <Text
            style={[
              styles.footerText,
              { color: colors.textFaint, fontFamily: Fonts.mono },
            ]}
          >
            Made with cats · Open source · Free forever
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
  hero: {
    alignItems: "center",
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  heroTitle: {
    fontSize: FontSize.xxl,
    letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: FontSize.sm,
    letterSpacing: 0.3,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    letterSpacing: 1.5,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    marginLeft: 2,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
  },
  bodyText: {
    fontSize: FontSize.sm,
    lineHeight: 22,
  },
  pointRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  pointText: {
    flex: 1,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  footer: {
    alignItems: "center",
    marginTop: Spacing.xxl,
    gap: 4,
  },
  footerText: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
