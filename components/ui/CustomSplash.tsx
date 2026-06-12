import { useEffect } from "react";
import { StyleSheet, Image, useColorScheme } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
  interpolateColor,
} from "react-native-reanimated";

const FADE_IN_DURATION = 400;
const SCALE_IN_DURATION = 500;
const FADE_OUT_DURATION = 350;
const NATIVE_SPLASH_BG = "#f5f0e8";
const THEMES = {
  light: { bg: "#f5f0e8" },
  dark: { bg: "#0d0d0f" },
};

/**
 * Custom splash shown while fonts load.  Starts with the native splash
 * background color (#0d0d0f) so there is zero visual jump when the
 * native splash auto-hides.  Once mounted, the background animates to
 * the theme-appropriate color, then fades out when the app is ready.
 */
export function CustomSplash({
  ready,
  onHidden,
}: {
  ready: boolean;
  onHidden: () => void;
}) {
  const scheme = useColorScheme();
  const theme = THEMES[scheme === "dark" ? "dark" : "light"];

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.85);
  const bgOpacity = useSharedValue(1);
  const bgProgress = useSharedValue(0);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const bgStyle = useAnimatedStyle(() => {
    const bg = interpolateColor(
      bgProgress.value,
      [0, 1],
      [NATIVE_SPLASH_BG, theme.bg],
    );
    return { opacity: bgOpacity.value, backgroundColor: bg };
  });

  // Logo entrance animation
  useEffect(() => {
    logoOpacity.value = withDelay(
      120,
      withTiming(1, {
        duration: FADE_IN_DURATION,
        easing: Easing.out(Easing.cubic),
      }),
    );
    logoScale.value = withDelay(
      120,
      withTiming(1, {
        duration: SCALE_IN_DURATION,
        easing: Easing.out(Easing.cubic),
      }),
    );
    // Animate bg from native splash color to theme color
    bgProgress.value = withDelay(
      200,
      withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }),
    );
  }, []);

  // When fonts are ready, fade out background and hide native splash
  useEffect(() => {
    if (!ready) return;
    bgOpacity.value = withTiming(
      0,
      { duration: FADE_OUT_DURATION, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(SplashScreen.hideAsync)();
          runOnJS(onHidden)();
        }
      },
    );
  }, [ready]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, bgStyle]}
    >
      <Animated.View style={logoStyle}>
        <Image
          source={require("../../assets/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  logo: {
    width: 120,
    height: 120,
  },
});
