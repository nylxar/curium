import { useEffect, useLayoutEffect, useRef } from "react";
import { useWindowDimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";

interface Props {
  fgColor: string;
  bgColor: string;
  eyeColor: string;
}

export function GlowPulse({ fgColor, bgColor, eyeColor }: Props) {
  const { height } = useWindowDimensions();
  const opacity = useSharedValue(0);
  const lastSig = useRef("");

  useLayoutEffect(() => {
    const sig = `${fgColor}|${bgColor}|${eyeColor}`;
    if (sig === lastSig.current) return;
    lastSig.current = sig;
    // Quick in (120ms) → smooth out (300ms).  Total: ~420ms.
    opacity.value = 0;
    opacity.value = withSequence(
      withTiming(1, {
        duration: 120,
        easing: Easing.out(Easing.quad),
      }),
      withTiming(0, {
        duration: 300,
        easing: Easing.in(Easing.cubic),
      }),
    );
  }, [fgColor, bgColor, eyeColor]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: fgColor + "14",
          zIndex: 9999,
        },
        animStyle,
      ]}
    />
  );
}
