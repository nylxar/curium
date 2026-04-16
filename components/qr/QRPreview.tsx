import { useEffect, useRef } from "react";
import { View, Image, StyleSheet } from "react-native";
import QRCode from "react-native-qrcode-svg";
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedStyle,
  Easing,
} from "react-native-reanimated";
import { Colors, Radius } from "@/constants/theme";
import { ECL, QRStyle } from "@/types/qr";

interface Props {
  value: string;
  qrStyle: QRStyle;
  size?: number;
  svgRef?: React.MutableRefObject<any>;
}

export function QRPreview({ value, qrStyle, size = 220, svgRef }: Props) {
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);
  const prevValue = useRef(value);
  const prevStyle = useRef(qrStyle);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 16, stiffness: 180 });
    opacity.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  // Pulse on value or style change
  useEffect(() => {
    const changed =
      prevValue.current !== value ||
      prevStyle.current.fgColor !== qrStyle.fgColor ||
      prevStyle.current.bgColor !== qrStyle.bgColor ||
      prevStyle.current.eyeShape !== qrStyle.eyeShape ||
      prevStyle.current.pixelShape !== qrStyle.pixelShape;
    if (!changed) return;
    prevValue.current = value;
    prevStyle.current = qrStyle;
    scale.value = withSpring(0.93, { damping: 20, stiffness: 400 });
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 14, stiffness: 220 });
    }, 70);
  }, [value, qrStyle]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const isEmpty = !value || value.trim().length === 0;
  const logoSize = Math.round(size * 0.22);

  return (
    <Animated.View style={[styles.wrap, animStyle]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: qrStyle.bgColor,
            shadowColor: qrStyle.fgColor,
          },
        ]}
      >
        {isEmpty ? (
          <View style={[styles.empty, { width: size, height: size }]}>
            <View
              style={[styles.emptyDot, { borderColor: qrStyle.fgColor + "44" }]}
            />
          </View>
        ) : (
          <View>
            <QRCode
              value={value}
              size={size}
              color={qrStyle.fgColor}
              backgroundColor={qrStyle.bgColor}
              ecl={qrStyle.ecl}
              getRef={(ref) => {
                if (svgRef) svgRef.current = ref;
              }}
              quietZone={12}
            />
            {/* Logo overlay */}
            {qrStyle.logoUri && (
              <View
                style={[
                  styles.logoWrap,
                  {
                    width: logoSize + 8,
                    height: logoSize + 8,
                    backgroundColor: qrStyle.bgColor,
                    top: (size - logoSize - 8) / 2 + 12,
                    left: (size - logoSize - 8) / 2 + 12,
                  },
                ]}
              >
                <Image
                  source={{ uri: qrStyle.logoUri }}
                  style={{
                    width: logoSize,
                    height: logoSize,
                    borderRadius: logoSize * 0.2,
                  }}
                />
              </View>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  card: {
    borderRadius: Radius.xl,
    padding: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
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
  logoWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
});
