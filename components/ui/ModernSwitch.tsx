import { useEffect, useLayoutEffect } from "react";
import { Pressable, View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  Easing,
} from "react-native-reanimated";

const TRACK_W = 44;
const TRACK_H = 26;
const KNOB = 20;
const TRAVEL = TRACK_W - KNOB - 6;

interface Props {
  value: boolean;
  onChange: (v: boolean) => void;
  activeColor: string;
  inactiveColor: string;
  knobColor?: string;
  disabled?: boolean;
}

/**
 * A modern, theme-aware toggle.  Replaces the platform-default <Switch>
 * which renders as a chunky Android-style toggle on Android and looks
 * out of place with the rest of the Curium UI.  This version:
 *
 *   - Has a thin pill track (44 × 26) with a 20px knob that slides 18px
 *   - Cross-fades the track color via Reanimated (160ms, not a spring)
 *   - Suppresses the default web hover wash
 *   - Adapts to the active theme colors passed in via props
 */
export function ModernSwitch({
  value,
  onChange,
  activeColor,
  inactiveColor,
  knobColor = "#ffffff",
  disabled,
}: Props) {
  const progress = useSharedValue(value ? 1 : 0);
  const isFirst = useSharedValue(true);

  // Keep the knob in sync if `value` changes externally
  useLayoutEffect(() => {
    if (isFirst.value) {
      progress.value = value ? 1 : 0;
      isFirst.value = false;
      return;
    }
    progress.value = withTiming(value ? 1 : 0, {
      duration: 160,
      easing: Easing.out(Easing.cubic),
    });
  }, [value]);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * TRAVEL }],
  }));
  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [inactiveColor, activeColor],
    ),
  }));

  return (
    <Pressable
      onPress={() => !disabled && onChange(!value)}
      hitSlop={8}
      style={() => [{}]}
    >
      <Animated.View
        style={[
          styles.track,
          { borderColor: value ? activeColor : "transparent" },
          trackStyle,
        ]}
      >
        <Animated.View
          style={[
            styles.knob,
            {
              backgroundColor: knobColor,
              shadowColor: "#000",
            },
            knobStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    padding: 3,
    justifyContent: "center",
    borderWidth: 1,
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
