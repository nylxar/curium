import { ReactNode, useEffect, useLayoutEffect, useState, useRef, useCallback } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
  Keyboard,
  KeyboardEvent,
  BackHandler,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Spacing } from "@/constants/theme";
import { useOverlay } from "./Overlay";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

// Sheet motion timings — tuned for "feels expensive, not bouncy".
// 340ms entrance with ease-out cubic: rises smoothly and parks without
// overshoot.  Spring physics felt rough on successive opens.
const ENTER_DURATION = 340;
const CLOSE_DURATION = 180;
const BACKDROP_ENTER = 160;
const BACKDROP_CLOSE = 140;
const SHEET_OFFSCREEN = 1200;

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
  // Single source of truth: the overlay's *internal* visibility.  This
  // tracks the *animation phase*, not the *user intent*.  When the user
  // presses back / swipes / taps backdrop, we transition to "closing" and
  // keep the overlay mounted until the animation finishes, then dismiss.
  const [phase, setPhase] = useState<"closed" | "open" | "closing">("closed");
  const [overlayId, setOverlayId] = useState<number | null>(null);

  // requestClose is what user-initiated dismisses call.  It moves us into
  // the closing phase — SheetContent detects that and animates out.
  // The parent never has to know that any animation is happening.
  useEffect(() => {
    if (visible && phase === "closed") {
      setPhase("open");
    } else if (!visible && phase !== "closed") {
      setPhase("closing");
    }
  }, [visible, phase]);

  // Mount the overlay once (on first open) and update its props when phase
  // changes.  Crucially, we DON'T call overlay.dismiss in any cleanup —
  // dismissal happens only after the close animation's runOnJS callback
  // fires, inside SheetContent.  That's what makes the back-gesture close
  // animate properly.
  useEffect(() => {
    if (phase === "open" && overlayId === null) {
      const id = overlay.show(
        <SheetContent
          phase="open"
          bgColor={bgColor}
          borderColor={borderColor}
          style={style}
          disableBackdropPress={disableBackdropPress}
          disableSwipeDown={disableSwipeDown}
          onRequestClose={onClose}
          onDismissed={() => {
            overlay.dismiss(id);
            setOverlayId(null);
            setPhase("closed");
          }}
        >
          {children}
        </SheetContent>,
      );
      setOverlayId(id);
      return; // no cleanup
    }

    if (phase === "closing" && overlayId !== null) {
      // Tell the existing SheetContent to animate out.  The
      // onDismissed callback (from the original show call) will fire
      // when the animation completes, removing the overlay.
      overlay.update(
        overlayId,
        <SheetContent
          phase="closing"
          bgColor={bgColor}
          borderColor={borderColor}
          style={style}
          disableBackdropPress={disableBackdropPress}
          disableSwipeDown={disableSwipeDown}
          onRequestClose={onClose}
          onDismissed={() => {
            overlay.dismiss(overlayId);
            setOverlayId(null);
            setPhase("closed");
          }}
        >
          {children}
        </SheetContent>,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Keep overlay content in sync with children / style changes (only while
  // open — once we're closing, we don't want to re-mount or change the
  // animation).
  useEffect(() => {
    if (phase === "open" && overlayId !== null) {
      overlay.update(
        overlayId,
        <SheetContent
          phase="open"
          bgColor={bgColor}
          borderColor={borderColor}
          style={style}
          disableBackdropPress={disableBackdropPress}
          disableSwipeDown={disableSwipeDown}
          onRequestClose={onClose}
          onDismissed={() => {
            overlay.dismiss(overlayId);
            setOverlayId(null);
            setPhase("closed");
          }}
        >
          {children}
        </SheetContent>,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, bgColor, borderColor, phase]);

  return null;
}

interface SheetContentProps {
  /** Animation phase the SheetContent should be in. */
  phase: "open" | "closing";
  bgColor?: string;
  borderColor?: string;
  style?: ViewStyle;
  disableBackdropPress: boolean;
  disableSwipeDown: boolean;
  /** Called when the user dismisses (swipe, backdrop, back, X).  Triggers
   *  the close animation by setting `visible: false` in the parent. */
  onRequestClose: () => void;
  /** Called after the close animation finishes.  Removes the overlay
   *  entry from the tree. */
  onDismissed: () => void;
  children: ReactNode;
}

function SheetContent({
  phase,
  bgColor,
  borderColor,
  style,
  disableBackdropPress,
  disableSwipeDown,
  onRequestClose,
  onDismissed,
  children,
}: SheetContentProps) {
  const insets = useSafeAreaInsets();
  // Store onDismissed in a ref so the worklet callback doesn't capture
  // React state setters (which can't be serialized for the UI thread).
  const onDismissedRef = useRef(onDismissed);
  onDismissedRef.current = onDismissed;

  const handleDismissed = useCallback(() => {
    onDismissedRef.current();
  }, []);

  // Start offscreen so the very first frame of the open animation is
  // already at the offscreen position, not at 0.
  const sheetY = useSharedValue(SHEET_OFFSCREEN);
  const backdropOp = useSharedValue(0);
  const keyboardH = useSharedValue(0);
  const keyboardHeight = useSharedValue(0);

  // Intercept the Android hardware back / gesture back so the sheet
  // closes (with animation) instead of the app exiting or the parent
  // screen popping.  We call onRequestClose which moves the parent
  // into the "closing" phase — the next render's useLayoutEffect will
  // animate out, then runOnJS(onDismissed) will tear down.
  useEffect(() => {
    if (phase !== "open") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onRequestClose();
      return true;
    });
    return () => sub.remove();
  }, [phase, onRequestClose]);

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

  // Animate in on open, out on closing.  Always go to 0 on open and to
  // offscreen on closing, regardless of current value — that way
  // re-entering a half-open sheet always resolves cleanly.
  //
  // The close completion is wired to the *sheet* (the slower of the two
  // animations).  If we fired onDismissed from the backdrop instead, the
  // overlay would unmount while the sheet is still sliding out, freezing
  // it mid-animation.
  useLayoutEffect(() => {
    if (phase === "open") {
      sheetY.value = withTiming(0, {
        duration: ENTER_DURATION,
        easing: Easing.out(Easing.cubic),
      });
      backdropOp.value = withTiming(0.32, { duration: BACKDROP_ENTER });
    } else {
      sheetY.value = withTiming(
        SHEET_OFFSCREEN,
        { duration: CLOSE_DURATION, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) {
            runOnJS(handleDismissed)();
          }
        },
      );
      backdropOp.value = withTiming(0, { duration: BACKDROP_CLOSE });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const pan = Gesture.Pan()
    .activeOffsetY(30)
    .onUpdate((e) => {
      if (e.translationY > 0) sheetY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 100 || e.velocityY > 600) {
        runOnJS(onRequestClose)();
      } else {
        sheetY.value = withTiming(0, {
          duration: 220,
          easing: Easing.out(Easing.cubic),
        });
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
          onPress={disableBackdropPress ? undefined : onRequestClose}
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
              paddingBottom: insets.bottom + Spacing.md,
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
