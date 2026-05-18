import React, { useRef } from "react";
import {
  View,
  Image,
  PanResponder,
  Animated,
  StyleSheet,
  TouchableOpacity,
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
  logoSize = 56,
  onRemove,
}: Props) {
  const { colors } = useTheme();
  // Start at center
  const center = (containerSize - logoSize) / 2;
  const pan = useRef(new Animated.ValueXY({ x: center, y: center })).current;
  const offset = useRef({ x: center, y: center });

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ x: offset.current.x, y: offset.current.y });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, g) => {
        pan.flattenOffset();
        // Clamp to container bounds
        const maxX = containerSize - logoSize;
        const maxY = containerSize - logoSize;
        const nx = Math.max(0, Math.min(maxX, offset.current.x + g.dx));
        const ny = Math.max(0, Math.min(maxY, offset.current.y + g.dy));
        offset.current = { x: nx, y: ny };
        Animated.spring(pan, {
          toValue: { x: nx, y: ny },
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }).start();
      },
    }),
  ).current;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          width: logoSize + 16,
          height: logoSize + 16,
          transform: pan.getTranslateTransform(),
        },
      ]}
      {...responder.panHandlers}
    >
      {/* White bg plate behind logo */}
      <View
        style={[
          styles.plate,
          { width: logoSize, height: logoSize, borderRadius: logoSize * 0.2 },
        ]}
      >
        <Image
          source={{ uri }}
          style={{
            width: logoSize - 8,
            height: logoSize - 8,
            borderRadius: logoSize * 0.15,
          }}
          resizeMode="contain"
        />
      </View>

      {/* Remove button */}
      <TouchableOpacity
        style={[styles.removeBtn, { backgroundColor: colors.error }]}
        onPress={onRemove}
        hitSlop={8}
      >
        <Ionicons name="close" size={10} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  plate: {
    backgroundColor: "#ffffff",
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
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
