import { ReactNode, useEffect, useLayoutEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  View,
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
import { Spacing } from "@/constants/theme";
import { useOverlay } from "./Overlay";

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

const SPRING = { damping: 30, stiffness: 420, mass: 0.6 };
const SHEET_OFFSCREEN = 1200;
const CLOSE_DURATION = 160;

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
  const overlay = useOverlay();
  const [overlayId, setOverlayId] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      // Push a placeholder first, then update with the real content
      const id = overlay.show(
        <SheetContent
          visible={visible}
          bgColor={bgColor}
          borderColor={borderColor}
          style={style}
          disableBackdropPress={disableBackdropPress}
          disableSwipeDown={disableSwipeDown}
          onClose={() => {
            overlay.dismiss(id);
            onClose();
          }}
        >
          {children}
        </SheetContent>,
      );
      setOverlayId(id);
      return () => {
        overlay.dismiss(id);
        setOverlayId(null);
      };
    } else if (overlayId !== null) {
      // Tell the SheetContent to animate out, then dismiss
      overlay.update(
        overlayId,
        <SheetContent
          visible={false}
          bgColor={bgColor}
          borderColor={borderColor}
          style={style}
          disableBackdropPress={disableBackdropPress}
          disableSwipeDown={disableSwipeDown}
          onClose={() => {
            overlay.dismiss(overlayId);
            setOverlayId(null);
            onClose();
          }}
        >
          {children}
        </SheetContent>,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Keep overlay content in sync with children changes
  useEffect(() => {
    if (overlayId !== null) {
      overlay.update(
        overlayId,
        <SheetContent
          visible={visible}
          bgColor={bgColor}
          borderColor={borderColor}
          style={style}
          disableBackdropPress={disableBackdropPress}
          disableSwipeDown={disableSwipeDown}
          onClose={() => {
            overlay.dismiss(overlayId);
            setOverlayId(null);
            onClose();
          }}
        >
          {children}
        </SheetContent>,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, bgColor, borderColor, visible]);

  return null;
}

interface SheetContentProps {
  visible: boolean;
  bgColor?: string;
  borderColor?: string;
  style?: ViewStyle;
  disableBackdropPress: boolean;
  disableSwipeDown: boolean;
  onClose: () => void;
  children: ReactNode;
}

function SheetContent({
  visible,
  bgColor,
  borderColor,
  style,
  disableBackdropPress,
  disableSwipeDown,
  onClose,
  children,
}: SheetContentProps) {
  const sheetY = useSharedValue(SHEET_OFFSCREEN);
  const backdropOp = useSharedValue(0);
  const keyboardH = useSharedValue(0);
  const keyboardHeight = useSharedValue(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      "keyboardDidShow",
      (e: KeyboardEvent) => {
        const adjustedHeight = Math.max(0, e.endCoordinates.height);
        keyboardHeight.value = withTiming(adjustedHeight, {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        });
        keyboardH.value = withTiming(adjustedHeight, {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        });
      },
    );
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      keyboardHeight.value = withTiming(0, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      });
      keyboardH.value = withTiming(0, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      });
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Animate in on mount, or animate out if visible becomes false
  useLayoutEffect(() => {
    if (visible) {
      sheetY.value = withSpring(0, SPRING);
      backdropOp.value = withTiming(0.5, { duration: 140 });
    } else {
      sheetY.value = withTiming(SHEET_OFFSCREEN, {
        duration: CLOSE_DURATION,
        easing: Easing.in(Easing.cubic),
      });
      backdropOp.value = withTiming(0, { duration: CLOSE_DURATION }, (f) => {
        if (f) {
          runOnJS(onClose)();
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const dismiss = () => {
    "worklet";
    sheetY.value = withTiming(SHEET_OFFSCREEN, {
      duration: CLOSE_DURATION,
      easing: Easing.in(Easing.cubic),
    });
    backdropOp.value = withTiming(0, { duration: CLOSE_DURATION }, (f) => {
      if (f) {
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
      if (e.translationY > 100 || e.velocityY > 600) {
        dismiss();
      } else {
        sheetY.value = withSpring(0, SPRING);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value - keyboardH.value }],
  }));
  const gapFillStyle = useAnimatedStyle(() => ({
    height: keyboardHeight.value,
  }));
  const bgStyle = useAnimatedStyle(() => ({
    opacity: backdropOp.value,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
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

      {/* Fill gap between sheet bottom and keyboard */}
      <Animated.View
        style={[styles.gapFill, gapFillStyle, { backgroundColor: bgColor }]}
        pointerEvents="none"
      />

      {/* Sheet */}
      <GestureDetector gesture={disableSwipeDown ? Gesture.Pan() : pan}>
        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Spacing.md,
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
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "#000",
  },
  gapFill: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
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
