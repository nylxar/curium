import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { Camera, CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  withDelay,
  useAnimatedStyle,
  Easing,
} from "react-native-reanimated";
import { Fonts, Spacing, Radius, FontSize } from "@/constants/theme";
import { useToast } from "@/components/ui/Toast";

function detectQRType(data: string): {
  type: string;
  parsed: Record<string, string>;
} {
  if (/^https?:\/\//i.test(data) || /^www\./i.test(data))
    return { type: "url", parsed: { url: data } };

  if (/^mailto:/i.test(data)) {
    const [to, qs] = data.replace(/^mailto:/i, "").split("?");
    const params = Object.fromEntries(new URLSearchParams(qs ?? ""));
    return {
      type: "email",
      parsed: { to, subject: params.subject ?? "", body: params.body ?? "" },
    };
  }

  if (/^tel:/i.test(data))
    return { type: "phone", parsed: { phone: data.replace(/^tel:/i, "") } };

  if (/^sms:/i.test(data)) {
    const [phone, qs] = data.replace(/^sms:/i, "").split("?");
    const params = Object.fromEntries(new URLSearchParams(qs ?? ""));
    return {
      type: "sms",
      parsed: { phone, message: params.body ?? "" },
    };
  }

  if (/^WIFI:/i.test(data)) {
    const ssid = data.match(/S:([^;]*)/)?.[1] ?? "";
    const password = data.match(/P:([^;]*)/)?.[1] ?? "";
    const enc = data.match(/T:([^;]*)/)?.[1] ?? "WPA";
    return { type: "wifi", parsed: { ssid, password, encryption: enc } };
  }

  if (/^BEGIN:VCARD/i.test(data)) {
    const name = data.match(/FN:([^\n]*)/)?.[1] ?? "";
    const phone = data.match(/TEL:([^\n]*)/)?.[1] ?? "";
    const email = data.match(/EMAIL:([^\n]*)/)?.[1] ?? "";
    const org = data.match(/ORG:([^\n]*)/)?.[1] ?? "";
    return {
      type: "contact",
      parsed: { name, phone, email, org },
    };
  }

  if (/^geo:/i.test(data)) {
    const coords = data.replace(/^geo:/i, "").split(",");
    return {
      type: "location",
      parsed: {
        lat: coords[0] ?? "",
        lng: coords[1]?.split("?")[0] ?? "",
        label: "",
      },
    };
  }

  return { type: "text", parsed: { text: data } };
}

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const toast = useToast();

  // Corner breathing animation
  const breathe = useSharedValue(0.4);
  useEffect(() => {
    if (scanned) return;
    breathe.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [scanned]);
  const breatheStyle = useAnimatedStyle(() => ({
    opacity: scanned ? 1 : breathe.value,
  }));

  // Result panel slide-in
  const panelProgress = useSharedValue(0);
  useEffect(() => {
    if (scanned) {
      panelProgress.value = 0;
      panelProgress.value = withDelay(
        60,
        withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) }),
      );
    } else {
      panelProgress.value = 0;
    }
  }, [scanned]);
  const panelStyle = useAnimatedStyle(() => ({
    opacity: panelProgress.value,
    transform: [{ translateY: (1 - panelProgress.value) * 40 }],
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

  const handleGalleryScan = useCallback(async () => {
    if (galleryLoading) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      toast.info("Permission needed", "Allow photo access to scan from gallery.");
      return;
    }
    const picker = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });
    if (picker.canceled || !picker.assets?.[0]?.uri) return;
    setGalleryLoading(true);
    try {
      const results = await Camera.scanFromURLAsync(picker.assets[0].uri, [
        "qr",
        "ean13",
        "ean8",
        "code128",
        "code39",
        "pdf417",
        "aztec",
        "datamatrix",
      ]);
      if (results.length > 0) {
        onBarcodeScanned({ data: results[0].data });
      } else {
        toast.info("No code found", "No QR code or barcode detected in image.");
      }
    } catch {
      toast.info("Scan failed", "Could not read code from image.");
    } finally {
      setGalleryLoading(false);
    }
  }, [galleryLoading, onBarcodeScanned, toast]);

  const handleAction = async (action: "open" | "copy") => {
    if (!result) return;
    if (action === "copy") {
      await Clipboard.setStringAsync(result);
      toast.success("Copied!", "Content copied to clipboard.");
    } else {
      const isURL = result.startsWith("http") || result.startsWith("www");
      if (isURL) {
        await Linking.openURL(
          result.startsWith("www") ? `https://${result}` : result,
        );
      } else {
        toast.info("Scanned Content", result);
      }
    }
  };

  if (!permission) return <View style={styles.screen} />;

  if (!permission.granted) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: colors.bg }]}>
        <View
          style={[
            styles.permIconWrap,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons name="camera-outline" size={36} color={colors.primary} />
        </View>
        <Text
          style={[
            styles.permTitle,
            { color: colors.text, fontFamily: Fonts.monoBold },
          ]}
        >
          Camera Access Needed
        </Text>
        <Text
          style={[
            styles.permSub,
            { color: colors.textMuted, fontFamily: Fonts.mono },
          ]}
        >
          Allow camera to scan QR codes and barcodes
        </Text>
        <TouchableOpacity
          style={[styles.permBtn, { backgroundColor: colors.primary }]}
          onPress={requestPermission}
        >
          <Text
            style={[
              styles.permBtnLabel,
              { color: colors.bg, fontFamily: Fonts.monoBold },
            ]}
          >
            Allow Camera
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={styles.permBack}>
          <Text
            style={[
              styles.permBackLabel,
              { color: colors.textMuted, fontFamily: Fonts.mono },
            ]}
          >
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

      {/* Dim overlay so the camera feed is not blindingly bright */}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.25)" }]}
      />

      <View style={styles.overlay}>
        {/* Top bar */}
        <View
          style={[
            styles.topBar,
            {
              paddingTop: insets.top + Spacing.sm,
              backgroundColor: "rgba(0,0,0,0.5)",
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.topBtn}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text
            style={[
              styles.topTitle,
              { color: "#fff", fontFamily: Fonts.monoMedium },
            ]}
          >
            Scan QR / Barcode
          </Text>
          <View style={{ flexDirection: "row", gap: Spacing.xs }}>
            <TouchableOpacity
              onPress={handleGalleryScan}
              hitSlop={12}
              style={styles.topBtn}
              disabled={galleryLoading}
            >
              {galleryLoading ? (
                <ActivityIndicator size={20} color="#fff" />
              ) : (
                <Ionicons name="images-outline" size={22} color="#fff" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTorch((t) => !t)}
              hitSlop={12}
              style={styles.topBtn}
            >
              <Ionicons
                name={torch ? "flash" : "flash-outline"}
                size={22}
                color={torch ? "#facc15" : "#fff"}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        {/* Scan frame */}
        <View style={styles.frameWrap}>
          <View style={styles.frame}>
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
              <Animated.View
                key={i}
                style={[
                  styles.corner,
                  c,
                  { borderColor: scanned ? colors.primary : "#fff" },
                  !scanned && breatheStyle,
                ]}
              />
            ))}
          </View>
          {/* Hint pill — always shows the instruction; the "Scanned"
              indicator lives in the result panel below.  We don't duplicate
              the text here, only the corner accents + frame flash indicate
              capture visually. */}
          <View style={[styles.hintPill, { backgroundColor: "rgba(0,0,0,0.55)" }]}>
            <Ionicons name="scan-outline" size={14} color="#fff" />
            <Text
              style={[
                styles.hintText,
                { color: "#fff", fontFamily: Fonts.monoMedium },
              ]}
            >
              Point at any QR code or barcode
            </Text>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        {/* Result panel */}
        {scanned && result && (
          <Animated.View
            style={[
              styles.resultPanel,
              {
                paddingBottom: insets.bottom + Spacing.lg,
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
              },
              panelStyle,
            ]}
          >
            <View style={styles.dragHandleWrap}>
              <View
                style={[styles.dragHandle, { backgroundColor: colors.border }]}
              />
            </View>
            <View style={styles.resultHeader}>
              <View
                style={[
                  styles.resultBadge,
                  { backgroundColor: colors.primary + "20" },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={colors.primary}
                />
                <Text
                  style={[
                    styles.resultBadgeText,
                    { color: colors.primary, fontFamily: Fonts.monoBold },
                  ]}
                >
                  SCANNED
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.resultTextBox,
                { backgroundColor: colors.bg, borderColor: colors.border },
              ]}
            >
              <Text
                style={[
                  styles.resultText,
                  { color: colors.text, fontFamily: Fonts.mono },
                ]}
                numberOfLines={3}
              >
                {result}
              </Text>
            </View>
            <View style={styles.resultActions}>
              <TouchableOpacity
                style={[
                  styles.resultBtn,
                  {
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleAction("copy")}
              >
                <Ionicons
                  name="copy-outline"
                  size={16}
                  color={colors.text}
                />
                <Text
                  style={[
                    styles.resultBtnLabel,
                    { color: colors.text, fontFamily: Fonts.monoMedium },
                  ]}
                >
                  Copy
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.resultBtn,
                  {
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleAction("open")}
              >
                <Ionicons
                  name="open-outline"
                  size={16}
                  color={colors.text}
                />
                <Text
                  style={[
                    styles.resultBtnLabel,
                    { color: colors.text, fontFamily: Fonts.monoMedium },
                  ]}
                >
                  Open
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.resultBtn,
                  {
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  setScanned(false);
                  setResult(null);
                }}
              >
                <Ionicons
                  name="refresh-outline"
                  size={16}
                  color={colors.text}
                />
                <Text
                  style={[
                    styles.resultBtnLabel,
                    { color: colors.text, fontFamily: Fonts.monoMedium },
                  ]}
                >
                  Rescan
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[
                styles.resultPrimary,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => {
                if (!result) return;
                const { type, parsed } = detectQRType(result);
                router.push({
                  pathname: "/",
                  params: {
                    loadType: type,
                    loadData: JSON.stringify(parsed),
                  },
                });
              }}
            >
              <Ionicons
                name="create-outline"
                size={17}
                color={isDark ? "#000" : "#fff"}
              />
              <Text
                style={[
                  styles.resultPrimaryLabel,
                  {
                    color: isDark ? "#000" : "#fff",
                    fontFamily: Fonts.monoBold,
                  },
                ]}
              >
                Load into Generator
              </Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color={isDark ? "#000" : "#fff"}
              />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const FRAME_SIZE = 260;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000" },
  center: {
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    padding: Spacing.xl,
  },

  overlay: { ...StyleSheet.absoluteFill, justifyContent: "center" },

  // Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  topBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontSize: FontSize.base,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  // Frame
  frameWrap: { alignItems: "center", gap: Spacing.lg },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    backgroundColor: "transparent",
    overflow: "hidden",
    borderRadius: Radius.lg,
  },
  corner: { position: "absolute", width: 26, height: 26, borderRadius: 4 },
  hintPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
  },
  hintText: { fontSize: FontSize.xs, letterSpacing: 0.3 },

  // Result panel
  resultPanel: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  dragHandleWrap: {
    alignItems: "center",
    marginTop: -Spacing.sm,
    marginBottom: -Spacing.xs,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  resultHeader: { flexDirection: "row", alignItems: "center" },
  resultBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  resultBadgeText: { fontSize: 9, letterSpacing: 1.2 },
  resultTextBox: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
  },
  resultText: {
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  resultActions: { flexDirection: "row", gap: Spacing.sm },
  resultBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  resultBtnLabel: { fontSize: FontSize.xs, fontWeight: "600" },
  resultPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  resultPrimaryLabel: {
    fontSize: FontSize.base,
    letterSpacing: 0.2,
  },

  // Permission screen
  permIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  permTitle: {
    fontSize: FontSize.lg,
    textAlign: "center",
  },
  permSub: {
    fontSize: FontSize.sm,
    textAlign: "center",
    maxWidth: 280,
  },
  permBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
  },
  permBtnLabel: { fontSize: FontSize.base },
  permBack: { marginTop: Spacing.sm, padding: Spacing.sm },
  permBackLabel: { fontSize: FontSize.sm },
});
