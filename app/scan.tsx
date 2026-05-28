import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { useTheme } from "@/context/ThemeContext";
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
  FadeInDown,
  FadeIn,
  SlideInDown,
  withSpring,
} from "react-native-reanimated";
import { Fonts, Spacing, Radius, FontSize } from "@/constants/theme";

function detectQRType(data: string): { type: string; parsed: Record<string, string> } {
  if (/^https?:\/\//i.test(data) || /^www\./i.test(data))
    return { type: "url", parsed: { url: data } };
  if (/^mailto:/i.test(data)) {
    const [to, qs] = data.replace(/^mailto:/i, "").split("?");
    const params = Object.fromEntries(new URLSearchParams(qs ?? ""));
    return { type: "email", parsed: { to, subject: params.subject ?? "", body: params.body ?? "" } };
  }
  if (/^tel:/i.test(data))
    return { type: "phone", parsed: { phone: data.replace(/^tel:/i, "") } };
  if (/^sms:/i.test(data)) {
    const [phone, qs] = data.replace(/^sms:/i, "").split("?");
    const params = Object.fromEntries(new URLSearchParams(qs ?? ""));
    return { type: "sms", parsed: { phone, message: params.body ?? "" } };
  }
  if (/^WIFI:/i.test(data)) {
    const ssid     = data.match(/S:([^;]*)/)?.[1] ?? "";
    const password = data.match(/P:([^;]*)/)?.[1] ?? "";
    const enc      = data.match(/T:([^;]*)/)?.[1] ?? "WPA";
    return { type: "wifi", parsed: { ssid, password, encryption: enc } };
  }
  if (/^BEGIN:VCARD/i.test(data)) {
    const name  = data.match(/FN:([^\n]*)/)?.[1]    ?? "";
    const phone = data.match(/TEL:([^\n]*)/)?.[1]   ?? "";
    const email = data.match(/EMAIL:([^\n]*)/)?.[1] ?? "";
    const org   = data.match(/ORG:([^\n]*)/)?.[1]   ?? "";
    return { type: "contact", parsed: { name, phone, email, org } };
  }
  if (/^geo:/i.test(data)) {
    const coords = data.replace(/^geo:/i, "").split(",");
    return { type: "location", parsed: { lat: coords[0] ?? "", lng: coords[1]?.split("?")[0] ?? "", label: "" } };
  }
  return { type: "text", parsed: { text: data } };
}

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch,   setTorch]   = useState(false);
  const [scanned, setScanned] = useState(false);
  const [result,  setResult]  = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();

  // laser sweep animation
  const laserY = useSharedValue(0);
  useEffect(() => {
    laserY.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
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
      const isURL = /^https?:\/\//i.test(result) || /^www\./i.test(result);
      if (isURL) {
        await Linking.openURL(/^www\./i.test(result) ? `https://${result}` : result);
      } else {
        Alert.alert("Scanned Content", result);
      }
    }
  };

  if (!permission) return <View style={styles.screen} />;

  // ── Permission screen ────────────────────────────────────────────────────────
  if (!permission.granted) {
    return (
      <View
        style={[
          styles.screen,
          styles.permScreen,
          {
            backgroundColor: colors.bg,
            paddingTop: insets.top + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.lg,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={12}
          style={[styles.permBack, { top: insets.top + Spacing.md }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Animated.View entering={FadeIn.delay(100).duration(500)} style={[styles.permIconWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="camera" size={52} color={colors.primary} />
        </Animated.View>
        <Animated.Text entering={FadeInDown.delay(200).duration(400)} style={[styles.permTitle, { color: colors.text, fontFamily: Fonts.monoBold }]}>Camera Access Needed</Animated.Text>
        <Animated.Text entering={FadeInDown.delay(300).duration(400)} style={[styles.permSub, { color: colors.textMuted, fontFamily: Fonts.mono }]}>
          Allow camera access to scan QR codes and barcodes.
        </Animated.Text>
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <TouchableOpacity
            onPress={requestPermission}
            style={[styles.permBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
          >
            <Ionicons name="camera-outline" size={18} color="#fff" />
            <Text style={[styles.permBtnLabel, { fontFamily: Fonts.monoBold }]}>Allow Camera</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // ── Camera screen ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      {/* Full-screen camera */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        onBarcodeScanned={onBarcodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      {/* Dark overlay strips */}
      <View style={[styles.overlayTop, { height: insets.top + 64 }]} />
      <View style={[styles.overlayBottom, { paddingBottom: insets.bottom }]} />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Scan QR / Barcode</Text>
        <TouchableOpacity onPress={() => setTorch((t) => !t)} hitSlop={12}>
          <Ionicons
            name={torch ? "flash" : "flash-outline"}
            size={24}
            color={torch ? "#fbbf24" : "#fff"}
          />
        </TouchableOpacity>
      </View>

      {/* Scan frame */}
      <View style={styles.frameArea}>
        <View style={styles.frameOuter}>
          {/* Corner accents */}
          {([
            { top: -2, left:  -2, borderTopWidth:    3, borderLeftWidth:  3 },
            { top: -2, right: -2, borderTopWidth:    3, borderRightWidth: 3 },
            { bottom: -2, left:  -2, borderBottomWidth: 3, borderLeftWidth:  3 },
            { bottom: -2, right: -2, borderBottomWidth: 3, borderRightWidth: 3 },
          ] as const).map((c, i) => (
            <Animated.View
              key={i}
              entering={FadeIn.delay(200 + i * 80).duration(400)}
              style={[styles.corner, c, { borderColor: scanned ? "#4ade80" : "#fff" }]}
            />
          ))}
          {/* Laser sweep — hidden after scan */}
          {!scanned && (
            <Animated.View style={[styles.laser, laserStyle]} />
          )}
        </View>
        <Animated.Text entering={FadeIn.delay(400).duration(400)} style={styles.hint}>
          {scanned ? "Scanned" : "Point at a QR code"}
        </Animated.Text>
      </View>

      {/* Result panel */}
      {scanned && result && (
        <Animated.View
          entering={SlideInDown.springify().damping(18).stiffness(120)}
          style={[styles.resultPanel, { paddingBottom: insets.bottom + Spacing.md }]}
        >
          <View style={styles.resultHandle} />
          <Text style={styles.resultLabel}>Scanned Content</Text>
          <Text style={styles.resultText} numberOfLines={4}>{result}</Text>
          <View style={styles.resultActions}>
            <TouchableOpacity
              onPress={() => handleAction("copy")}
              style={styles.resultBtn}
              activeOpacity={0.75}
            >
              <Ionicons name="copy-outline" size={18} color="#fff" />
              <Text style={styles.resultBtnLabel}>Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleAction("open")}
              style={styles.resultBtn}
              activeOpacity={0.75}
            >
              <Ionicons name="open-outline" size={18} color="#fff" />
              <Text style={styles.resultBtnLabel}>Open</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setScanned(false); setResult(null); }}
              style={styles.resultBtn}
              activeOpacity={0.75}
            >
              <Ionicons name="refresh-outline" size={18} color="#fff" />
              <Text style={styles.resultBtnLabel}>Rescan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (!result) return;
                const { type, parsed } = detectQRType(result);
                router.push({ pathname: "/", params: { loadType: type, loadData: JSON.stringify(parsed) } });
              }}
              style={styles.resultBtnPrimary}
              activeOpacity={0.85}
            >
              <Ionicons name="create-outline" size={18} color="#000" />
              <Text style={styles.resultBtnLabelDark}>Edit</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000" },

  // ── Permission ──
  permScreen: {
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  permBack: {
    position: "absolute",
    left: Spacing.lg,
    padding: Spacing.xs,
  },
  permIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  permTitle: {
    fontSize: FontSize.lg,
    textAlign: "center",
  },
  permSub: {
    fontSize: FontSize.sm,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 22,
  },
  permBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
  },
  permBtnLabel: { color: "#fff", fontSize: FontSize.base },

  // ── Overlays ──
  overlayTop: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    backgroundColor: "rgba(0,0,0,0.60)",
  },
  overlayBottom: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    height: 300,
    backgroundColor: "rgba(0,0,0,0.60)",
  },

  // ── Top bar ──
  topBar: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: "rgba(0,0,0,0.50)",
  },
  topTitle: { color: "#fff", fontSize: FontSize.base, fontWeight: "600" },

  // ── Scan frame ──
  frameArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
    marginTop: 72,
    marginBottom: 220,
  },
  frameOuter: {
    width: 260,
    height: 260,
    position: "relative",
    borderRadius: Radius.lg,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  corner: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  laser: {
    position: "absolute",
    left: 4, right: 4,
    height: 2,
    backgroundColor: "#4ade80",
    borderRadius: 1,
    shadowColor: "#4ade80",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 8,
  },
  hint: {
    color: "rgba(255,255,255,0.82)",
    fontSize: FontSize.sm,
    textAlign: "center",
    fontFamily: Fonts.mono,
  },

  // ── Result panel ──
  resultPanel: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(10,10,10,0.96)",
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.15)",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  resultHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.30)",
    alignSelf: "center",
    marginBottom: Spacing.xs,
  },
  resultLabel: {
    color: "rgba(255,255,255,0.50)",
    fontSize: FontSize.xs,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  resultText: { color: "#fff", fontSize: FontSize.base, lineHeight: 22 },
  resultActions: { flexDirection: "row", gap: Spacing.sm, flexWrap: "wrap" },
  resultBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.15)",
    minWidth: 72,
  },
  resultBtnLabel: { color: "#fff", fontSize: FontSize.sm, fontWeight: "600" },
  resultBtnPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: "#fff",
    minWidth: 72,
  },
  resultBtnLabelDark: { color: "#000", fontSize: FontSize.sm, fontWeight: "700" },
});
