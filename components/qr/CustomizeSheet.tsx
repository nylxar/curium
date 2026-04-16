import { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedStyle,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { ColorPalette } from "./ColorPalette";
import { EyeShapeSelector, PixelShapeSelector } from "./ShapeSelector";
import { LogoPicker } from "./LogoPicker";
import { QRStyle, EyeShape, PixelShape } from "@/types/qr";
import { Colors, Radius, FontSize, Spacing } from "@/constants/theme";

const { height: SCREEN_H } = Dimensions.get("window");
const SHEET_H = SCREEN_H * 0.78;

interface Props {
  visible: boolean;
  style: QRStyle;
  onStyleChange: (s: QRStyle) => void;
  onClose: () => void;
}

export function CustomizeSheet({
  visible,
  style,
  onStyleChange,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SHEET_H);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, {
        duration: 280,
        easing: Easing.out(Easing.cubic),
      });
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 180,
        mass: 0.9,
      });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 220 });
      translateY.value = withSpring(SHEET_H, { damping: 22, stiffness: 200 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    pointerEvents: backdropOpacity.value > 0 ? "auto" : "none",
  }));

  // Drag to dismiss
  const dragStart = useSharedValue(0);
  const panGesture = Gesture.Pan()
    .onStart(() => {
      dragStart.value = translateY.value;
    })
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = dragStart.value + e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > SHEET_H * 0.25 || e.velocityY > 800) {
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 180 });
      }
    });

  if (!visible && translateY.value >= SHEET_H) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + Spacing.xl },
          sheetStyle,
        ]}
      >
        {/* Drag handle */}
        <GestureDetector gesture={panGesture}>
          <View style={styles.dragArea}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Customise</Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.closeBtnLabel}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </GestureDetector>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <ColorPalette
            selectedId={style.colorId}
            onSelect={(id, fg, bg) =>
              onStyleChange({ ...style, colorId: id, fgColor: fg, bgColor: bg })
            }
          />

          <View style={styles.divider} />

          <EyeShapeSelector
            selected={style.eyeShape}
            fgColor={style.fgColor}
            onChange={(s) => onStyleChange({ ...style, eyeShape: s })}
          />

          <View style={styles.divider} />

          <PixelShapeSelector
            selected={style.pixelShape}
            fgColor={style.fgColor}
            onChange={(s) => onStyleChange({ ...style, pixelShape: s })}
          />

          <View style={styles.divider} />

          <LogoPicker
            logoUri={style.logoUri}
            onChange={(uri) => onStyleChange({ ...style, logoUri: uri })}
          />

          <View style={styles.divider} />

          {/* Reset */}
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() => {
              Haptics.selectionAsync();
              onStyleChange({
                colorId: "ink",
                fgColor: "#f0f0f0",
                bgColor: "#0a0a0a",
                eyeShape: "square",
                pixelShape: "square",
                logoUri: undefined,
                ecl: style.ecl,
              });
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.resetLabel}>Reset to Default</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_H,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl + 4,
    borderTopRightRadius: Radius.xl + 4,
    overflow: "hidden",
  },
  dragArea: { paddingTop: Spacing.sm },
  handle: {
    width: 36,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  sheetTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.text,
  },
  closeBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.primaryBg,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  closeBtnLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.primary,
  },
  scrollContent: {
    gap: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  divider: {
    height: 0.5,
    backgroundColor: Colors.divider,
    marginHorizontal: Spacing.base,
  },
  resetBtn: { alignSelf: "center", padding: Spacing.md },
  resetLabel: { fontSize: FontSize.sm, color: Colors.error, fontWeight: "500" },
});
