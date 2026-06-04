import { ReactNode, useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  ViewStyle,
  Keyboard,
  KeyboardEvent,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spacing } from "@/constants/theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  style?: ViewStyle;
  bgColor?: string;
  borderColor?: string;
  disableBackdropPress?: boolean;
  disableSwipeDown?: boolean;
}

const SPRING = { damping: 28, stiffness: 380, mass: 0.7 };

export function AnimatedSheet({
  visible,
  onClose,
  children,
  style,
  bgColor,
  borderColor,
  disableBackdropPress = false,
  disableSwipeDown = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const sheetY = useSharedValue(500);
  const backdropOp = useSharedValue(0);
  const keyboardH = useSharedValue(0);
  const [mounted, setMounted] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const closing = useSharedValue(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      "keyboardDidShow",
      (e: KeyboardEvent) => {
        setKeyboardHeight(e.endCoordinates.height);
      },
    );
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      closing.value = 0;
      setMounted(true);
      requestAnimationFrame(() => {
        sheetY.value = withSpring(0, SPRING);
        backdropOp.value = withTiming(0.5, { duration: 180 });
      });
    } else if (mounted) {
      closing.value = 1;
      sheetY.value = withSpring(500, SPRING);
      backdropOp.value = withTiming(0, { duration: 120 }, (f) => {
        if (f) {
          runOnJS(setMounted)(false);
          runOnJS(onClose)();
        }
      });
    }
  }, [visible]);

  // Animate keyboard offset smoothly
  useEffect(() => {
    keyboardH.value = withTiming(keyboardHeight > 0 ? keyboardHeight + 20 : 0, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
  }, [keyboardHeight]);

  const dismiss = () => {
    "worklet";
    if (closing.value === 1) return;
    closing.value = 1;
    sheetY.value = withSpring(500, SPRING);
    backdropOp.value = withTiming(0, { duration: 120 }, (f) => {
      if (f) {
        runOnJS(setMounted)(false);
        runOnJS(onClose)();
      }
    });
  };

  const pan = Gesture.Pan()
    .activeOffsetY(30)
    .onUpdate((e) => {
      if (e.translationY > 0) sheetY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 100 || e.velocityY > 600) dismiss();
      else sheetY.value = withSpring(0, SPRING);
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value - keyboardH.value }],
  }));
  const bgStyle = useAnimatedStyle(() => ({
    opacity: backdropOp.value,
  }));

  if (!mounted) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={dismiss}
    >
      {/* Backdrop */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.backdrop, bgStyle]}
        pointerEvents="auto"
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={disableBackdropPress ? undefined : dismiss}
        />
      </Animated.View>

      {/* Sheet */}
      <GestureDetector gesture={disableSwipeDown ? Gesture.Pan() : pan}>
        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom:
                insets.bottom > 0 ? insets.bottom + Spacing.md : Spacing.xl,
              backgroundColor: bgColor,
              borderTopColor: borderColor,
            },
            sheetStyle,
            style,
          ]}
        >
          <Animated.View
            style={[styles.handle, { backgroundColor: borderColor }]}
          />
          {children}
        </Animated.View>
      </GestureDetector>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "#000",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.sm,
  },
});
