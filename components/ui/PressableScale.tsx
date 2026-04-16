import { ReactNode } from "react";
import { Pressable, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  onPress: () => void;
  style?: ViewStyle | ViewStyle[];
  children: ReactNode;
  disabled?: boolean;
}

export function PressableScale({ onPress, style, children, disabled }: Props) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={() => {
        scale.value = withSpring(0.93, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      }}
      onPress={onPress}
      disabled={disabled}
      style={[animStyle, style as ViewStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
