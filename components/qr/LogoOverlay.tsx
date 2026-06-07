import { useRef } from "react";
import {
  View,
  Image,
  PanResponder,
  Animated,
  StyleSheet,
} from "react-native";
import { LogoStyleConfig } from "@/types/qr";

interface Props {
  uri: string;
  containerSize: number;
  logoSize?: number;
  /** Optional. The logo can be removed from the LogoStyle option
   *  modal — the inline X button was removed because it cluttered
   *  the QR canvas and the user already has a dedicated control. */
  onRemove?: () => void;
  style?: LogoStyleConfig;
  bgColor?: string;
}

export function LogoOverlay({
  uri,
  containerSize,
  logoSize = 60,
  style,
  bgColor = "#ffffff",
}: Props) {
  // Default to the previous "rounded white plate" look if no style config
  // was passed.  This keeps older call sites (qr-detail, history) working
  // unchanged.
  const cfg = style ?? {
    background: "rounded" as const,
    padding: 10,
    border: true,
    shadow: true,
  };

  // Total visual plate size = logo + padding on each side.
  const pad = (cfg.padding / 100) * logoSize;
  const plateSize = logoSize + pad * 2;

  // Center the plate in the container.
  const cx = (containerSize - plateSize) / 2;
  const cy = (containerSize - plateSize) / 2;

  const pos = useRef(new Animated.ValueXY({ x: cx, y: cy })).current;
  const posRef = useRef({ x: cx, y: cy });

  const MAX_X = containerSize - plateSize;
  const MAX_Y = containerSize - plateSize;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pos.stopAnimation();
      },
      onPanResponderMove: (_, g) => {
        pos.setValue({
          x: Math.max(0, Math.min(MAX_X, posRef.current.x + g.dx)),
          y: Math.max(0, Math.min(MAX_Y, posRef.current.y + g.dy)),
        });
      },
      onPanResponderRelease: (_, g) => {
        const nx = Math.max(0, Math.min(MAX_X, posRef.current.x + g.dx));
        const ny = Math.max(0, Math.min(MAX_Y, posRef.current.y + g.dy));
        posRef.current = { x: nx, y: ny };
        Animated.spring(pos, {
          toValue: { x: nx, y: ny },
          useNativeDriver: false,
          speed: 30,
          bounciness: 4,
        }).start();
      },
    }),
  ).current;

  // Plate corner radius driven by the background shape.
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

  // Image corner radius — same logic, slightly less so it insets into the
  // plate nicely.  If background is "none" the image gets a small radius
  // so rounded logos don't have hard corners either.
  const imageRadius = (() => {
    switch (cfg.background) {
      case "circle":
        return (logoSize * 0.5);
      case "rounded":
        return Math.min(logoSize * 0.18, 12);
      case "square":
        return 0;
      case "none":
        return logoSize * 0.1;
    }
  })();

  return (
    // Outer View: full container size, pointerEvents="box-none" so taps pass through
    <View
      style={[
        StyleSheet.absoluteFill,
        { width: containerSize, height: containerSize },
      ]}
      pointerEvents="box-none"
    >
      {/* Draggable logo plate */}
      <Animated.View
        {...pan.panHandlers}
        style={{
          position: "absolute",
          left: pos.x,
          top: pos.y,
          width: plateSize,
          height: plateSize,
        }}
      >
        {cfg.background !== "none" && (
          <View
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
