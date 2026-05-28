import { ReactNode } from "react";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  SlideInRight,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from "react-native-reanimated";

type AnimationType = "fade" | "fadeDown" | "fadeUp" | "slideRight" | "zoom";

interface FadeInViewProps {
  children: ReactNode;
  delay?: number;
  animation?: AnimationType;
  duration?: number;
  style?: any;
}

const ANIMATION_MAP: Record<AnimationType, typeof FadeIn> = {
  fade: FadeIn,
  fadeDown: FadeInDown,
  fadeUp: FadeInUp,
  slideRight: SlideInRight,
  zoom: ZoomIn,
};

export function FadeInView({
  children,
  delay = 0,
  animation = "fadeDown",
  duration = 500,
  style,
}: FadeInViewProps) {
  const entering = ANIMATION_MAP[animation].delay(delay).duration(duration);
  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
}

// ─── AnimatedScale: press-to-scale reusable wrapper ──────────────────────────
interface AnimatedScaleProps {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: any;
  scaleTo?: number;
}

import { Pressable } from "react-native";

export function AnimatedScale({
  children,
  onPress,
  disabled,
  style,
  scaleTo = 0.95,
}: AnimatedScaleProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value, { damping: 15, stiffness: 300 }) }],
  }));

  return (
    <Pressable
      onPressIn={() => { scale.value = scaleTo; }}
      onPressOut={() => { scale.value = 1; }}
      onPress={onPress}
      disabled={disabled}
    >
      <Animated.View style={[animStyle, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
