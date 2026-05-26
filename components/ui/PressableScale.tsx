import { ReactNode, useEffect } from "react";
import { Pressable, StyleProp, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  disabled?: boolean;
  pressedScale?: number;
}

export function PressableScale({
  onPress,
  style,
  children,
  disabled,
  pressedScale = 0.96,
}: Props) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(disabled ? 0.45 : 1);

  useEffect(() => {
    opacity.value = withTiming(disabled ? 0.45 : 1, { duration: 160 });
  }, [disabled, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={() => {
        if (disabled) return;
        scale.value = withSpring(pressedScale, {
          damping: 18,
          stiffness: 360,
          mass: 0.45,
        });
        opacity.value = withTiming(0.88, { duration: 120 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, {
          damping: 16,
          stiffness: 260,
          mass: 0.5,
        });
        opacity.value = withTiming(disabled ? 0.45 : 1, { duration: 140 });
      }}
      onPress={onPress}
      disabled={disabled}
      style={[animStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
}
