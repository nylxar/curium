import { useEffect, useRef } from "react";
import { View, StyleSheet, Image, useColorScheme } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  type SharedValue,
} from "react-native-reanimated";

const FADE_IN_DURATION = 400;
const SCALE_IN_DURATION = 500;
const THEMES = {
  light: { bg: "#f5f0e8" },
  dark: { bg: "#0d0d0f" },
};

export function CustomSplash({ splashOpacity }: { splashOpacity: SharedValue<number> }) {
  const scheme = useColorScheme();
  const theme = THEMES[scheme === "dark" ? "dark" : "light"];
  const mounted = useRef(true);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.85);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const bgStyle = useAnimatedStyle(() => ({
    opacity: splashOpacity.value,
  }));

  useEffect(() => {
    mounted.current = true;
    logoOpacity.value = withDelay(120, withTiming(1, { duration: FADE_IN_DURATION, easing: Easing.out(Easing.cubic) }));
    logoScale.value = withDelay(120, withTiming(1, { duration: SCALE_IN_DURATION, easing: Easing.out(Easing.cubic) }));
    return () => { mounted.current = false; };
  }, []);

  return (
    <Animated.View pointerEvents="none" style={[styles.container, { backgroundColor: theme.bg }, bgStyle]}>
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