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

  const [pos, setPos] = useState(
    initialPosition ?? { x: cx, y: cy },
  );
  const posRef = useRef(initialPosition ?? { x: cx, y: cy });
  const panOrigin = useRef({ x: 0, y: 0 });

  const MAX_X = containerSize - plateSize;
  const MAX_Y = containerSize - plateSize;

  // PanResponder handles dragging via a transparent full-coverage
  // overlay.  The actual logo View is a pure visual element with NO
  // touch handlers — this is critical for captureRef (react-native-
  // view-shot) on Android, which cannot capture absolutely-positioned
  // children that have PanResponder attached.
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
    <View style={{ position: "absolute", left: 0, top: 0, width: containerSize, height: containerSize }}>
      {/* Visual logo — NO touch handlers, pure rendering.
          captureRef on Android can see this because there's no
          PanResponder intercepting the native view. */}
      <View
        collapsable={false}
        renderToHardwareTextureAndroid
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
      </View>
      {/* Touch overlay — transparent, full-size, handles dragging.
          This View is where PanResponder lives.  It covers the
          entire QR area so drag works even outside the logo bounds. */}
      {draggable && (
        <View
          {...pan.panHandlers}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: containerSize,
            height: containerSize,
          }}
        />
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
