import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { Fonts } from "@/constants/theme";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  useAnimatedStyle,
  Easing,
} from "react-native-reanimated";
import { Spacing, Radius, FontSize } from "@/constants/theme";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();

  // Laser animation
  const laserY = useSharedValue(0);
  useEffect(() => {
    laserY.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);
  const laserStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: laserY.value * 220 }],
  }));

  const onBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (scanned) return;
      setScanned(true);
      setResult(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [scanned],
  );

  const handleAction = async (action: "open" | "copy") => {
    if (!result) return;
    if (action === "copy") {
      await Clipboard.setStringAsync(result);
      Alert.alert("Copied!", "Content copied to clipboard.");
    } else {
      const isURL = result.startsWith("http") || result.startsWith("www");
      if (isURL) {
        await Linking.openURL(
          result.startsWith("www") ? `https://${result}` : result,
        );
      } else {
        Alert.alert("Scanned Content", result);
      }
    }
  };

  if (!permission) return <View style={styles.screen} />;

  if (!permission.granted) {
    return (
      <View
        style={[styles.screen, styles.center, { backgroundColor: "colors.bg" }]}
      >
        <Ionicons name="camera-outline" size={56} color="#fff" />
        <Text style={styles.permTitle}>Camera Access Needed</Text>
        <Text style={styles.permSub}>
          Allow camera to scan QR codes and barcodes
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnLabel}>Allow Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: Spacing.md }}
        >
          <Text style={{ color: "#ffffff80", fontSize: FontSize.sm }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        onBarcodeScanned={scanned ? undefined : onBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: [
            "qr",
            "ean13",
            "ean8",
            "code128",
            "code39",
            "pdf417",
            "aztec",
            "datamatrix",
          ],
        }}
      />

      {/* Dark overlay with cutout */}
      <View style={styles.overlay}>
        {/* Top bar */}
        <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Scan QR / Barcode</Text>
          <TouchableOpacity onPress={() => setTorch((t) => !t)} hitSlop={12}>
            <Ionicons
              name={torch ? "flash" : "flash-outline"}
              size={24}
              color={torch ? "colors.warning" : "#fff"}
            />
          </TouchableOpacity>
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Scan frame */}
        <View style={styles.frameWrap}>
          <View style={styles.frame}>
            {/* Corner accents */}
            {[
              { top: -2, left: -2, borderTopWidth: 3, borderLeftWidth: 3 },
              { top: -2, right: -2, borderTopWidth: 3, borderRightWidth: 3 },
              {
                bottom: -2,
                left: -2,
                borderBottomWidth: 3,
                borderLeftWidth: 3,
              },
              {
                bottom: -2,
                right: -2,
                borderBottomWidth: 3,
                borderRightWidth: 3,
              },
            ].map((c, i) => (
              <View
                key={i}
                style={[styles.corner, c, { borderColor: "#fff" }]}
              />
            ))}
            {/* Laser sweep */}
            {!scanned && <Animated.View style={[styles.laser, laserStyle]} />}
          </View>
          <Text style={styles.hint}>
            {scanned ? "✓ Scanned!" : "Point at any QR code or barcode"}
          </Text>
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Result panel */}
        {scanned && result && (
          <View
            style={[
              styles.resultPanel,
              { paddingBottom: insets.bottom + Spacing.lg },
            ]}
          >
            <Text style={styles.resultLabel}>Scanned Content</Text>
            <Text style={styles.resultText} numberOfLines={3}>
              {result}
            </Text>
            <View style={styles.resultActions}>
              <TouchableOpacity
                style={[styles.resultBtn, { backgroundColor: "#ffffff20" }]}
                onPress={() => handleAction("copy")}
              >
                <Ionicons name="copy-outline" size={18} color="#fff" />
                <Text style={styles.resultBtnLabel}>Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.resultBtn, { backgroundColor: "#fff" }]}
                onPress={() => handleAction("open")}
              >
                <Ionicons name="open-outline" size={18} color="#000" />
                <Text style={[styles.resultBtnLabel, { color: "#000" }]}>
                  Open
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.resultBtn, { backgroundColor: "#ffffff20" }]}
                onPress={() => {
                  setScanned(false);
                  setResult(null);
                }}
              >
                <Ionicons name="scan-outline" size={18} color="#fff" />
                <Text style={styles.resultBtnLabel}>Rescan</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000" },
  center: {
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  topTitle: { color: "#fff", fontSize: FontSize.base, fontWeight: "600" },

  frameWrap: { alignItems: "center", gap: Spacing.lg },
  frame: {
    width: 260,
    height: 260,
    backgroundColor: "transparent",
  },
  corner: { position: "absolute", width: 24, height: 24, borderRadius: 3 },
  laser: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#4ade80",
    shadowColor: "#4ade80",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 8,
  },
  hint: {
    color: "colors.text+'cc'",
    fontSize: FontSize.sm,
    textAlign: "center",
  },

  resultPanel: {
    backgroundColor: "rgba(0,0,0,0.85)",
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  resultLabel: {
    color: "#ffffff80",
    fontSize: FontSize.xs,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  resultText: { color: "#fff", fontSize: FontSize.base, lineHeight: 22 },
  resultActions: { flexDirection: "row", gap: Spacing.sm },
  resultBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  resultBtnLabel: { color: "#fff", fontSize: FontSize.sm, fontWeight: "600" },

  permTitle: {
    color: "#fff",
    fontSize: FontSize.lg,
    fontWeight: "700",
    textAlign: "center",
  },
  permSub: {
    color: "#ffffff80",
    fontSize: FontSize.sm,
    textAlign: "center",
    maxWidth: 280,
  },
  permBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
  },
  permBtnLabel: { color: "#000", fontSize: FontSize.base, fontWeight: "700" },
});
