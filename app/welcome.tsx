import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/context/ThemeContext";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ chain?: string }>();

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.9);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(12);
  const descOpacity = useSharedValue(0);
  const descY = useSharedValue(12);
  const btnsOpacity = useSharedValue(0);
  const btnsY = useSharedValue(12);

  useEffect(() => {
    logoOpacity.value = withDelay(100, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));
    logoScale.value = withDelay(100, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    titleOpacity.value = withDelay(250, withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) }));
    titleY.value = withDelay(250, withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) }));
    descOpacity.value = withDelay(400, withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) }));
    descY.value = withDelay(400, withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) }));
    btnsOpacity.value = withDelay(550, withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) }));
    btnsY.value = withDelay(550, withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));
  const descStyle = useAnimatedStyle(() => ({
    opacity: descOpacity.value,
    transform: [{ translateY: descY.value }],
  }));
  const btnsStyle = useAnimatedStyle(() => ({
    opacity: btnsOpacity.value,
    transform: [{ translateY: btnsY.value }],
  }));

  const handleContinue = async () => {
    await AsyncStorage.setItem("curium_onboarded", "true");
    if (params.chain === "whats-new") {
      router.replace({ pathname: "/whats-new", params: { forced: "true" } });
    } else {
      router.replace("/");
    }
  };

  const handleSupport = async () => {
    await AsyncStorage.setItem("curium_onboarded", "true");
    router.push("/support");
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <View style={styles.spacer} />

        <Animated.View style={[styles.logoWrap, logoStyle]}>
          <Image
            source={require("../assets/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={[styles.textBlock, titleStyle]}>
          <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.monoBold }]}>
            Welcome to Curium
          </Text>
        </Animated.View>

        <Animated.View style={[styles.textBlock, descStyle]}>
          <Text style={[styles.desc, { color: colors.textMuted, fontFamily: Fonts.mono }]}>
            A privacy-first QR customizer.{"\n"}
            No ads. No accounts. No network.{"\n"}
            Your codes stay on your device.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.features, descStyle]}>
          {[
            { icon: "lock-closed-outline", text: "Fully offline, zero tracking" },
            { icon: "color-palette-outline", text: "Deep customization, logos, themes" },
            { icon: "scan-outline", text: "Scan, reskin, and re-export any QR" },
          ].map((f, i) => (
            <View key={i} style={[styles.featureRow, { borderColor: colors.border }]}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary + "15" }]}>
                <Ionicons name={f.icon as any} size={18} color={colors.primary} />
              </View>
              <Text style={[styles.featureText, { color: colors.text, fontFamily: Fonts.mono }]}>
                {f.text}
              </Text>
            </View>
          ))}
        </Animated.View>

        <View style={styles.spacer} />

        <Animated.View style={btnsStyle}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={[styles.primaryBtnLabel, { color: colors.bg, fontFamily: Fonts.monoBold }]}>
              Get Started
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.supportBtn, { borderColor: colors.border }]}
            onPress={handleSupport}
            activeOpacity={0.7}
          >
            <Ionicons name="heart-outline" size={16} color={colors.textMuted} />
            <Text style={[styles.supportLabel, { color: colors.textMuted, fontFamily: Fonts.mono }]}>
              Support the project
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  spacer: { flex: 1 },
  logoWrap: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: Radius.xl,
  },
  textBlock: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xl,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  desc: {
    fontSize: FontSize.sm,
    textAlign: "center",
    lineHeight: 22,
  },
  features: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    fontSize: FontSize.sm,
    flex: 1,
  },
  primaryBtn: {
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  primaryBtnLabel: {
    fontSize: FontSize.base,
    letterSpacing: 0.3,
  },
  supportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  supportLabel: {
    fontSize: FontSize.sm,
  },
});
