import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { Colors, Radius, FontSize, Spacing, Fonts } from "@/constants/theme";

interface Props {
  logoUri?: string;
  logoSize?: number; // 0.1 to 0.4 of QR size
  onChange: (uri: string | undefined) => void;
  onSizeChange?: (size: number) => void;
}

const DEFAULT_SIZE = 0.2;
const MIN_SIZE = 0.1;
const MAX_SIZE = 0.4;

function triggerHaptic() {
  Haptics.selectionAsync();
}

function LogoSizeControl({
  size,
  onSizeChange,
}: {
  size: number;
  onSizeChange: (s: number) => void;
}) {
  const trackWidthSV = useSharedValue(0);
  const sv = useSharedValue(size);
  const isActive = useSharedValue(0);
  const [displaySize, setDisplaySize] = useState(Math.round(size * 100));

  useEffect(() => {
    sv.value = withTiming(size, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
    setDisplaySize(Math.round(size * 100));
  }, [size]);

  const fillStyle = useAnimatedStyle(() => {
    const w = trackWidthSV.value;
    const pct = w > 0 ? ((sv.value - MIN_SIZE) / (MAX_SIZE - MIN_SIZE)) * w : 0;
    return { width: pct };
  });

  const knobStyle = useAnimatedStyle(() => {
    const w = trackWidthSV.value;
    const pct = w > 0 ? ((sv.value - MIN_SIZE) / (MAX_SIZE - MIN_SIZE)) * w : 0;
    return {
      transform: [
        { translateX: pct - 10 },
        { scale: isActive.value === 1 ? 1.2 : 1 },
      ],
    };
  });

  const pan = Gesture.Pan()
    .onBegin(() => {
      "worklet";
      isActive.value = withTiming(1, { duration: 150 });
      runOnJS(triggerHaptic)();
    })
    .onUpdate((e) => {
      "worklet";
      if (trackWidthSV.value <= 0) return;
      const pct = Math.max(0, Math.min(1, e.x / trackWidthSV.value));
      sv.value = MIN_SIZE + pct * (MAX_SIZE - MIN_SIZE);
    })
    .onEnd(() => {
      "worklet";
      isActive.value = withTiming(0, { duration: 200 });
      const pct =
        trackWidthSV.value > 0
          ? Math.max(0, Math.min(1, sv.value / trackWidthSV.value))
          : 0;
      const finalSize = MIN_SIZE + pct * (MAX_SIZE - MIN_SIZE);
      runOnJS(onSizeChange)(Math.round(finalSize * 100) / 100);
    });

  const tap = Gesture.Tap().onEnd((e) => {
    "worklet";
    if (trackWidthSV.value <= 0) return;
    const pct = Math.max(0, Math.min(1, e.x / trackWidthSV.value));
    const newSize = MIN_SIZE + pct * (MAX_SIZE - MIN_SIZE);
    sv.value = withTiming(newSize, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
    runOnJS(onSizeChange)(Math.round(newSize * 100) / 100);
    runOnJS(triggerHaptic)();
  });

  return (
    <View style={styles.sizeControl}>
      <GestureDetector gesture={Gesture.Race(pan, tap)}>
        <View
          style={styles.sizeTrack}
          onLayout={(e) => (trackWidthSV.value = e.nativeEvent.layout.width)}
        >
          <Animated.View style={[styles.sizeFill, fillStyle]} />
          <Animated.View style={[styles.sizeKnob, knobStyle]} />
        </View>
      </GestureDetector>
      <Text style={styles.sizeLabel}>{displaySize}%</Text>
    </View>
  );
}

export function LogoPicker({
  logoUri,
  logoSize = DEFAULT_SIZE,
  onChange,
  onSizeChange,
}: Props) {
  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permission needed",
        "Allow photo library access to embed a logo.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onChange(result.assets[0].uri);
    }
  };

  const remove = () => {
    Haptics.selectionAsync();
    onChange(undefined);
  };

  const handleSizeChange = (s: number) => {
    onSizeChange?.(s);
  };

  return (
    <View>
      <Text style={styles.sectionTitle}>Logo (optional)</Text>
      <View style={styles.row}>
        {logoUri ? (
          <View style={styles.logoPreview}>
            <Image source={{ uri: logoUri }} style={styles.logoImage} />
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={remove}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={20} color={Colors.error} />
            </TouchableOpacity>
          </View>
        ) : null}
        <TouchableOpacity
          style={styles.pickBtn}
          onPress={pick}
          activeOpacity={0.75}
        >
          <Ionicons
            name={logoUri ? "refresh-outline" : "image-outline"}
            size={18}
            color={Colors.primary}
          />
          <Text style={styles.pickLabel}>
            {logoUri ? "Change" : "Pick Logo"}
          </Text>
        </TouchableOpacity>
      </View>
      {logoUri && onSizeChange && (
        <View style={styles.sizeRow}>
          <Ionicons name="resize-outline" size={14} color={Colors.textFaint} />
          <LogoSizeControl size={logoSize} onSizeChange={handleSizeChange} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: FontSize.xs,
    fontFamily: Fonts.monoMedium,
    fontWeight: "600",
    color: Colors.textFaint,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginLeft: Spacing.base,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  logoPreview: { position: "relative" },
  logoImage: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
  },
  removeBtn: { position: "absolute", top: -6, right: -6 },
  pickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.primaryBg,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  pickLabel: {
    fontSize: FontSize.sm,
    fontFamily: Fonts.monoMedium,
    color: Colors.primary,
    fontWeight: "600",
  },
  sizeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.sm,
  },
  sizeControl: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  sizeTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.surfaceOffset,
    borderRadius: 3,
    position: "relative",
    justifyContent: "center",
  },
  sizeFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  sizeKnob: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    borderWidth: 2.5,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },
  sizeLabel: {
    fontSize: FontSize.xs,
    fontFamily: Fonts.monoMedium,
    color: Colors.textMuted,
    minWidth: 32,
    textAlign: "right",
  },
});
