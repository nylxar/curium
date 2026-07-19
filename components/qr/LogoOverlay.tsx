import { useRef } from "react";
import { View, Image, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import { LogoStyleConfig } from "@/types/qr";

interface Props {
  uri: string;
  containerSize: number;
  logoSize?: number;
  style?: LogoStyleConfig;
  bgColor?: string;
  /** When false the logo is static (used in qr-detail for saved QRs). */
  draggable?: boolean;
  /** Restore a previously saved logo position (from QRStyle.logoPosition). */
  initialPosition?: { x: number; y: number };
  /** Fired when the user finishes dragging the logo. */
  onPositionChange?: (pos: { x: number; y: number }) => void;
}

export function LogoOverlay({
  uri,
  containerSize,
  logoSize = 60,
  style,
  bgColor = "#ffffff",
  draggable = true,
  initialPosition,
  onPositionChange,
}: Props) {
  const cfg = style ?? {
    background: "rounded" as const,
    padding: 10,
    border: true,
    shadow: true,
  };

  const pad = (cfg.padding / 100) * logoSize;
  const plateSize = logoSize + pad * 2;

  // Center the plate in the container (default position).
  const cx = (containerSize - plateSize) / 2;
  const cy = (containerSize - plateSize) / 2;

  const initPos = initialPosition ?? { x: cx, y: cy };
  const posX = useSharedValue(initPos.x);
  const posY = useSharedValue(initPos.y);
  const panOriginX = useSharedValue(initPos.x);
  const panOriginY = useSharedValue(initPos.y);

  const MAX_X = containerSize - plateSize;
  const MAX_Y = containerSize - plateSize;

  const onPositionChangeRef = useRef(onPositionChange ?? (() => {}));
  onPositionChangeRef.current = onPositionChange ?? (() => {});

  const pan = Gesture.Pan()
    .enabled(draggable)
    .onStart(() => {
      panOriginX.value = posX.value;
      panOriginY.value = posY.value;
    })
    .onUpdate((e) => {
      "worklet";
      posX.value = Math.max(0, Math.min(MAX_X, panOriginX.value + e.translationX));
      posY.value = Math.max(0, Math.min(MAX_Y, panOriginY.value + e.translationY));
    })
    .onEnd(() => {
      "worklet";
      runOnJS(onPositionChangeRef.current)({
        x: posX.value,
        y: posY.value,
      });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: posX.value },
      { translateY: posY.value },
    ],
  }));

  const plateRadius = (() => {
    switch (cfg.background) {
      case "circle":
        return plateSize * 0.5;
      case "rounded":
        return Math.min(plateSize * 0.22, 16);
      case "square":
        return 0;
      case "none":
        return 0;
    }
  })();

  const imageRadius = (() => {
    switch (cfg.background) {
      case "circle":
        return logoSize * 0.5;
      case "rounded":
        return Math.min(logoSize * 0.18, 12);
      case "square":
        return 0;
      case "none":
        return logoSize * 0.1;
    }
  })();

  return (
    <View style={{ position: "absolute", left: 0, top: 0, width: containerSize, height: containerSize }}>
      {/* Visual logo — animated on UI thread via shared values.
          No React state updates during drag. */}
      <Animated.View
        collapsable={false}
        renderToHardwareTextureAndroid
        style={[
          {
            position: "absolute",
            width: plateSize,
            height: plateSize,
            zIndex: 10,
          },
          animatedStyle,
        ]}
      >
        {cfg.background !== "none" && (
          <View
            collapsable={false}
            style={[
              styles.plate,
              {
                width: plateSize,
                height: plateSize,
                borderRadius: plateRadius,
                backgroundColor: bgColor,
                borderWidth: cfg.border ? 1.5 : 0,
                borderColor: "#00000018",
                shadowOpacity: cfg.shadow ? 0.18 : 0,
                shadowRadius: cfg.shadow ? 8 : 0,
                shadowOffset: cfg.shadow
                  ? { width: 0, height: 3 }
                  : { width: 0, height: 0 },
                elevation: cfg.shadow ? 6 : 0,
              },
            ]}
          >
            <Image
              source={{ uri }}
              style={{
                width: logoSize,
                height: logoSize,
                borderRadius: imageRadius,
              }}
              resizeMode="contain"
            />
          </View>
        )}
        {cfg.background === "none" && (
          <Image
            source={{ uri }}
            style={{
              width: logoSize,
              height: logoSize,
              borderRadius: imageRadius,
              borderWidth: cfg.border ? 1.5 : 0,
              borderColor: "#00000018",
            }}
            resizeMode="contain"
          />
        )}
      </Animated.View>
      {/* Touch overlay — Gesture Handler runs on UI thread.
          No JS bridge crossings during drag (120Hz safe). */}
      {draggable && (
        <GestureDetector gesture={pan}>
          <View
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: containerSize,
              height: containerSize,
            }}
          />
        </GestureDetector>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
  },
});
