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
import { useTheme } from "@/context/ThemeContext";

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
  const { colors } = useTheme();

  // Start at center
  const startX = (containerSize - logoSize) / 2;
  const startY = (containerSize - logoSize) / 2;

  const pos = useRef(new Animated.ValueXY({ x: startX, y: startY })).current;
  const posRef = useRef({ x: startX, y: startY });

  // Bounds: logo must stay inside container
  const MAX_X = containerSize - logoSize;
  const MAX_Y = containerSize - logoSize;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Stop any spring in progress
        pos.stopAnimation();
      },
      onPanResponderMove: (_, g) => {
        const nx = Math.max(0, Math.min(MAX_X, posRef.current.x + g.dx));
        const ny = Math.max(0, Math.min(MAX_Y, posRef.current.y + g.dy));
        pos.setValue({ x: nx, y: ny });
      },
      onPanResponderRelease: (_, g) => {
        // Commit final clamped position
        posRef.current = {
          x: Math.max(0, Math.min(MAX_X, posRef.current.x + g.dx)),
          y: Math.max(0, Math.min(MAX_Y, posRef.current.y + g.dy)),
        };
        // Snap with spring to clamped value (snaps back if dragged outside)
        Animated.spring(pos, {
          toValue: posRef.current,
          useNativeDriver: false,
          speed: 30,
          bounciness: 4,
        }).start();
      },
    }),
  ).current;

  return (
    <Animated.View
      {...pan.panHandlers}
      style={[
        styles.wrapper,
        {
          width: logoSize,
          height: logoSize,
          left: pos.x,
          top: pos.y,
        },
      ]}
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
            width: logoSize - 10,
            height: logoSize - 10,
            borderRadius: logoSize * 0.15,
          }}
          resizeMode="contain"
        />
      </View>

      <TouchableOpacity
        style={[
          styles.removeBtn,
          { backgroundColor: colors.error ?? "#e53e3e" },
        ]}
        onPress={onRemove}
        hitSlop={10}
      >
        <Ionicons name="close" size={9} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    zIndex: 10,
  },
  plate: {
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  removeBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    elevation: 7,
  },
});
