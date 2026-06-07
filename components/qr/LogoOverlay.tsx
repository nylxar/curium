import { useRef, useState } from "react";
import {
  View,
  Image,
  PanResponder,
  StyleSheet,
} from "react-native";
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

  // Use plain useState instead of Animated.ValueXY so the position is
  // always committed to the native layer synchronously.  This fixes two
  // issues:
  //   1. react-native-view-shot (captureRef) couldn't see the logo
  //      because Animated.ValueXY positions are resolved asynchronously
  //      in Reanimated 4 — by the time captureRef snapshots the view,
  //      the native layer still had the old (0,0) position.
  //   2. Saved/shared QRs now always render the logo at the correct
  //      position because useState is synchronous.
  const [pos, setPos] = useState(
    initialPosition ?? { x: cx, y: cy },
  );
  const posRef = useRef(initialPosition ?? { x: cx, y: cy });
  // Position at the start of a gesture — g.dx/g.dy are cumulative from
  // grant, so we must NOT add them to the live posRef (which would
  // double-count and cause acceleration).
  const panOrigin = useRef({ x: 0, y: 0 });

  const MAX_X = containerSize - plateSize;
  const MAX_Y = containerSize - plateSize;

  const pan = useRef(
    draggable
      ? PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onMoveShouldSetPanResponder: () => true,
          onPanResponderGrant: () => {
            panOrigin.current = { ...posRef.current };
          },
          onPanResponderMove: (_, g) => {
            const nx = Math.max(
              0,
              Math.min(MAX_X, panOrigin.current.x + g.dx),
            );
            const ny = Math.max(
              0,
              Math.min(MAX_Y, panOrigin.current.y + g.dy),
            );
            posRef.current = { x: nx, y: ny };
            setPos({ x: nx, y: ny });
          },
          onPanResponderRelease: () => {
            onPositionChange?.(posRef.current);
          },
        })
      : { panHandlers: {} as any },
  ).current;

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
    <View
      style={[
        StyleSheet.absoluteFill,
        { width: containerSize, height: containerSize, zIndex: 10 },
      ]}
      pointerEvents="box-none"
    >
      {/* Logo plate — plain View (not Animated.View) so captureRef
          sees the correct position synchronously. */}
      <View
        {...pan.panHandlers}
        style={{
          position: "absolute",
          left: pos.x,
          top: pos.y,
          width: plateSize,
          height: plateSize,
          zIndex: 10,
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
      </View>
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
