import { useRef } from "react";
import {
  View,
  Image,
  PanResponder,
  Animated,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  uri: string;
  containerSize: number;
  logoSize?: number;
  onRemove: () => void;
}

export function LogoOverlay({
  uri,
  containerSize,
  logoSize = 60,
  onRemove,
}: Props) {
  const cx = (containerSize - logoSize) / 2;
  const cy = (containerSize - logoSize) / 2;

  const pos = useRef(new Animated.ValueXY({ x: cx, y: cy })).current;
  const posRef = useRef({ x: cx, y: cy });

  const MAX_X = containerSize - logoSize;
  const MAX_Y = containerSize - logoSize;

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

  const BADGE = 20;

  return (
    // Outer View: full container size, pointerEvents="box-none" so taps pass through
    <View
      style={[
        StyleSheet.absoluteFillObject,
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
          width: logoSize,
          height: logoSize,
        }}
      >
        <View
          style={[
            styles.plate,
            {
              width: logoSize,
              height: logoSize,
              borderRadius: logoSize * 0.2,
            },
          ]}
        >
          <Image
            source={{ uri }}
            style={{
              width: logoSize - 12,
              height: logoSize - 12,
              borderRadius: logoSize * 0.15,
            }}
            resizeMode="contain"
          />
        </View>
      </Animated.View>

      {/* X button — separate from pan handler, positioned via JS */}
      <Animated.View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          left: Animated.add(pos.x, logoSize - BADGE / 2),
          top: Animated.add(pos.y, -BADGE / 2),
          zIndex: 20,
        }}
      >
        <TouchableOpacity
          onPress={onRemove}
          style={styles.removeBtn}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={11} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  removeBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#e53e3e",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
  },
});
