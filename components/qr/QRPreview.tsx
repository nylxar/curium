import { useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import QRCodeStyled from "react-native-qrcode-styled";
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedStyle,
  Easing,
} from "react-native-reanimated";
import { Colors, Radius } from "@/constants/theme";
import {
  QRStyle,
  EYE_BORDER_RADIUS,
  PIXEL_BORDER_RADIUS,
  PIXEL_IS_GLUED,
} from "@/types/qr";

interface Props {
  value: string;
  qrStyle: QRStyle;
  size?: number;
  innerRef?: React.MutableRefObject<any>;
}

export function QRPreview({ value, qrStyle, size = 220, innerRef }: Props) {
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);
  const prevSig = useRef("");

  // Entrance animation
  useEffect(() => {
    scale.value = withSpring(1, { damping: 16, stiffness: 180 });
    opacity.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  // Pulse on any meaningful change — compare signature string, no .value reads in render
  const sig = `${value}|${qrStyle.fgColor}|${qrStyle.bgColor}|${qrStyle.eyeShape}|${qrStyle.pixelShape}|${qrStyle.logoUri}`;
  useEffect(() => {
    if (prevSig.current === sig || prevSig.current === "") {
      prevSig.current = sig;
      return;
    }
    prevSig.current = sig;
    scale.value = withSpring(0.93, { damping: 22, stiffness: 400 });
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 14, stiffness: 220 });
    }, 70);
  }, [sig]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const isEmpty = !value || value.trim().length === 0;
  const eyeBR = EYE_BORDER_RADIUS[qrStyle.eyeShape];
  const pieceBR = PIXEL_BORDER_RADIUS[qrStyle.pixelShape];
  const isGlued = PIXEL_IS_GLUED[qrStyle.pixelShape];

  return (
    <Animated.View style={[styles.wrap, animStyle]}>
      <View
        style={[
          styles.card,
          { backgroundColor: qrStyle.bgColor, shadowColor: qrStyle.fgColor },
        ]}
      >
        {isEmpty ? (
          <View style={[styles.empty, { width: size, height: size }]}>
            <View
              style={[styles.emptyDot, { borderColor: qrStyle.fgColor + "55" }]}
            />
          </View>
        ) : (
          <QRCodeStyled
            data={value}
            style={{ backgroundColor: qrStyle.bgColor }}
            padding={16}
            pieceSize={8}
            pieceScale={1.02}
            color={qrStyle.fgColor}
            errorCorrectionLevel={qrStyle.ecl}
            pieceBorderRadius={pieceBR}
            isPiecesGlued={isGlued}
            outerEyesOptions={{ borderRadius: eyeBR, color: qrStyle.fgColor }}
            innerEyesOptions={{
              borderRadius: typeof eyeBR === "number" ? eyeBR * 0.5 : 4,
              color: qrStyle.fgColor,
            }}
            logo={
              qrStyle.logoUri
                ? {
                    href: qrStyle.logoUri,
                    scale: 0.22,
                    hidePieces: true,
                    padding: 4,
                  }
                : undefined
            }
          />
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  card: {
    borderRadius: Radius.xl,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 10,
    overflow: "hidden",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.lg,
  },
  emptyDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: "dashed",
  },
});
