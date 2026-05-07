import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  interpolateColor,
  Easing,
} from "react-native-reanimated";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import * as Haptics from "expo-haptics";
import { captureRef } from "react-native-view-shot";
import { Ionicons } from "@expo/vector-icons";

import { QRCanvas } from "@/components/qr/QRCanvas";
import { TypePill } from "@/components/qr/TypePill";
import { OptionRow } from "@/components/qr/OptionRow";
import { FabBar } from "@/components/qr/FabBar";
import { ColorPalette } from "@/components/qr/ColorPalette";
import {
  EyeShapeSelector,
  PixelShapeSelector,
} from "@/components/qr/ShapeSelector";
import { LogoPicker } from "@/components/qr/LogoPicker";
import {
  URLFormView,
  TextFormView,
  EmailFormView,
  PhoneFormView,
  SMSFormView,
  WiFiFormView,
  ContactFormView,
  LocationFormView,
} from "@/components/qr/InputForms";

import {
  Colors,
  Spacing,
  Radius,
  FontSize,
  QR_COLORS,
} from "@/constants/theme";
import {
  QRType,
  QRStyle,
  DEFAULT_QR_STYLE,
  URLForm,
  TextForm,
  EmailForm,
  PhoneForm,
  SMSForm,
  WiFiForm,
  ContactForm,
  LocationForm,
  ECL,
} from "@/types/qr";

// ─── Encode ───────────────────────────────────────────────────────────────────
interface FormState {
  url: URLForm;
  text: TextForm;
  email: EmailForm;
  phone: PhoneForm;
  sms: SMSForm;
  wifi: WiFiForm;
  contact: ContactForm;
  location: LocationForm;
}

const DEFAULT_FORMS: FormState = {
  url: { url: "" },
  text: { text: "" },
  email: { to: "", subject: "", body: "" },
  phone: { phone: "" },
  sms: { phone: "", message: "" },
  wifi: { ssid: "", password: "", encryption: "WPA" },
  contact: { name: "", phone: "", email: "", org: "" },
  location: { lat: "", lng: "", label: "" },
};

function encodeQR(type: QRType, forms: FormState): string {
  switch (type) {
    case "url": {
      const u = forms.url.url.trim();
      if (!u) return "";
      return u.startsWith("http") ? u : `https://${u}`;
    }
    case "text":
      return forms.text.text.trim();
    case "email": {
      const { to, subject, body } = forms.email;
      if (!to.trim()) return "";
      return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
    case "phone": {
      const p = forms.phone.phone.trim();
      return p ? `tel:${p}` : "";
    }
    case "sms": {
      const { phone, message } = forms.sms;
      if (!phone.trim()) return "";
      return `sms:${phone}${message ? `?body=${encodeURIComponent(message)}` : ""}`;
    }
    case "wifi": {
      const { ssid, password, encryption } = forms.wifi;
      if (!ssid.trim()) return "";
      return `WIFI:T:${encryption};S:${ssid};P:${password};;`;
    }
    case "contact": {
      const { name, phone, email, org } = forms.contact;
      if (!name.trim()) return "";
      return `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${phone}\nEMAIL:${email}\nORG:${org}\nEND:VCARD`;
    }
    case "location": {
      const { lat, lng, label } = forms.location;
      if (!lat.trim() || !lng.trim()) return "";
      return `geo:${lat},${lng}${label ? `?q=${lat},${lng}(${encodeURIComponent(label)})` : ""}`;
    }
    default:
      return "";
  }
}

// ─── Color tint util ──────────────────────────────────────────────────────────
// Turns a hex fg color into a very dark tinted screen bg
function fgToScreenBg(hex: string): string {
  // Take hue from fgColor, return deep dark tint
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const dr = Math.round(r * 0.07)
      .toString(16)
      .padStart(2, "0");
    const dg = Math.round(g * 0.07)
      .toString(16)
      .padStart(2, "0");
    const db = Math.round(b * 0.07)
      .toString(16)
      .padStart(2, "0");
    return `#${dr}${dg}${db}`;
  } catch {
    return Colors.bg;
  }
}

const ECL_OPTIONS: ECL[] = ["L", "M", "Q", "H"];
const RANDOM_STYLE_POOL = QR_COLORS.filter((c) => c.id !== "paper");

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CreateScreen() {
  const [qrType, setQrType] = useState<QRType>("url");
  const [forms, setForms] = useState<FormState>(DEFAULT_FORMS);
  const [qrStyle, setQrStyle] = useState<QRStyle>(DEFAULT_QR_STYLE);
  const qrRef = useRef<View>(null);

  const qrValue = encodeQR(qrType, forms);
  const hasQR = qrValue.length > 0;

  // ── Animated background tint ──────────────────────────────────────────────
  // We use a numeric progress 0→1 and interpolateColor between two colors.
  // Both target colors are stored as refs so we can update them before toggling.
  const tintProgress = useSharedValue(0);
  const fromBg = useRef(fgToScreenBg(DEFAULT_QR_STYLE.fgColor));
  const toBg = useRef(fgToScreenBg(DEFAULT_QR_STYLE.fgColor));
  const currentBg = useRef(fgToScreenBg(DEFAULT_QR_STYLE.fgColor));
  const isForward = useRef(true);

  const screenStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      tintProgress.value,
      [0, 1],
      [fromBg.current, toBg.current],
    ),
  }));

  const applyStyle = useCallback((newStyle: QRStyle) => {
    const newBg = fgToScreenBg(newStyle.fgColor);
    if (newBg === currentBg.current) {
      setQrStyle(newStyle);
      return;
    }

    // Toggle direction each time so interpolateColor always goes from→to
    if (isForward.current) {
      fromBg.current = currentBg.current;
      toBg.current = newBg;
      tintProgress.value = 0;
      tintProgress.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      fromBg.current = newBg;
      toBg.current = currentBg.current;
      tintProgress.value = 1;
      tintProgress.value = withTiming(0, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      });
    }
    isForward.current = !isForward.current;
    currentBg.current = newBg;
    setQrStyle(newStyle);
  }, []);

  const updateForm = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForms((p) => ({ ...p, [key]: value }));
    },
    [],
  );

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleCopy = useCallback(async () => {
    if (!hasQR) return;
    await Clipboard.setStringAsync(qrValue);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [qrValue, hasQR]);

  const handleShuffle = useCallback(() => {
    const pool = RANDOM_STYLE_POOL;
    const rand = pool[Math.floor(Math.random() * pool.length)];
    const eyeShapes = [
      "sharp",
      "soft",
      "round",
      "pill",
      "leaf",
      "diamond",
    ] as const;
    const pixelShapes = [
      "sharp",
      "soft",
      "round",
      "dots",
      "liquid",
      "glued",
    ] as const;
    applyStyle({
      ...qrStyle,
      colorId: rand.id,
      fgColor: rand.fg,
      bgColor: rand.bg,
      eyeShape: eyeShapes[Math.floor(Math.random() * eyeShapes.length)],
      pixelShape: pixelShapes[Math.floor(Math.random() * pixelShapes.length)],
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [qrStyle, applyStyle]);

  const handleShare = useCallback(async () => {
    if (!hasQR || !qrRef.current) return;
    try {
      const uri = await captureRef(qrRef, { format: "png", quality: 1 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "Share QR Code",
        });
      }
    } catch (e) {
      Alert.alert("Error", "Could not share QR code.");
    }
  }, [hasQR]);

  // ── Form rendering ────────────────────────────────────────────────────────
  const renderForm = () => {
    switch (qrType) {
      case "url":
        return (
          <URLFormView
            form={forms.url}
            onChange={(v) => updateForm("url", v)}
            tintColor={qrStyle.fgColor}
          />
        );
      case "text":
        return (
          <TextFormView
            form={forms.text}
            onChange={(v) => updateForm("text", v)}
            tintColor={qrStyle.fgColor}
          />
        );
      case "email":
        return (
          <EmailFormView
            form={forms.email}
            onChange={(v) => updateForm("email", v)}
            tintColor={qrStyle.fgColor}
          />
        );
      case "phone":
        return (
          <PhoneFormView
            form={forms.phone}
            onChange={(v) => updateForm("phone", v)}
            tintColor={qrStyle.fgColor}
          />
        );
      case "sms":
        return (
          <SMSFormView
            form={forms.sms}
            onChange={(v) => updateForm("sms", v)}
            tintColor={qrStyle.fgColor}
          />
        );
      case "wifi":
        return (
          <WiFiFormView
            form={forms.wifi}
            onChange={(v) => updateForm("wifi", v)}
            tintColor={qrStyle.fgColor}
          />
        );
      case "contact":
        return (
          <ContactFormView
            form={forms.contact}
            onChange={(v) => updateForm("contact", v)}
            tintColor={qrStyle.fgColor}
          />
        );
      case "location":
        return (
          <LocationFormView
            form={forms.location}
            onChange={(v) => updateForm("location", v)}
            tintColor={qrStyle.fgColor}
          />
        );
    }
  };

  // ── Color dot preview ─────────────────────────────────────────────────────
  const colorDot = (
    <View style={[styles.dotPreview, { backgroundColor: qrStyle.fgColor }]} />
  );

  // ── ECL preview ───────────────────────────────────────────────────────────
  const eclPreview = (
    <Text style={[styles.previewText, { color: qrStyle.fgColor }]}>
      {qrStyle.ecl}
    </Text>
  );

  return (
    <Animated.View style={[styles.screen, screenStyle]}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── QR Canvas ── */}
            <View ref={qrRef} style={styles.canvasWrap} collapsable={false}>
              <QRCanvas value={qrValue} qrStyle={qrStyle} size={260} />
            </View>

            {/* ── Type selector ── */}
            <TypePill
              selected={qrType}
              tintColor={qrStyle.fgColor}
              onChange={setQrType}
            />

            {/* ── Input ── */}
            <View
              style={[
                styles.inputWrap,
                {
                  borderColor: qrStyle.fgColor + "40",
                  backgroundColor: qrStyle.fgColor + "0d",
                },
              ]}
            >
              {renderForm()}
            </View>

            {/* ── Options ── */}
            <View style={styles.options}>
              <OptionRow
                label="Color"
                iconName="color-palette-outline"
                preview={colorDot}
                tintColor={qrStyle.fgColor}
                defaultOpen
              >
                <ColorPalette
                  selectedId={qrStyle.colorId}
                  onSelect={(id, fg, bg) =>
                    applyStyle({
                      ...qrStyle,
                      colorId: id,
                      fgColor: fg,
                      bgColor: bg,
                    })
                  }
                />
              </OptionRow>

              <OptionRow
                label="Eye Style"
                iconName="eye-outline"
                tintColor={qrStyle.fgColor}
                preview={
                  <Ionicons
                    name="scan-outline"
                    size={16}
                    color={qrStyle.fgColor + "90"}
                  />
                }
              >
                <EyeShapeSelector
                  selected={qrStyle.eyeShape}
                  fgColor={qrStyle.fgColor}
                  onChange={(s) => applyStyle({ ...qrStyle, eyeShape: s })}
                />
              </OptionRow>

              <OptionRow
                label="Pixel Style"
                iconName="grid-outline"
                tintColor={qrStyle.fgColor}
                preview={
                  <Ionicons
                    name="apps-outline"
                    size={16}
                    color={qrStyle.fgColor + "90"}
                  />
                }
              >
                <PixelShapeSelector
                  selected={qrStyle.pixelShape}
                  fgColor={qrStyle.fgColor}
                  onChange={(s) => applyStyle({ ...qrStyle, pixelShape: s })}
                />
              </OptionRow>

              <OptionRow
                label="Logo"
                iconName="image-outline"
                tintColor={qrStyle.fgColor}
                preview={
                  qrStyle.logoUri ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={qrStyle.fgColor}
                    />
                  ) : (
                    <Ionicons
                      name="add-circle-outline"
                      size={16}
                      color={qrStyle.fgColor + "90"}
                    />
                  )
                }
              >
                <LogoPicker
                  logoUri={qrStyle.logoUri}
                  onChange={(uri) => applyStyle({ ...qrStyle, logoUri: uri })}
                />
              </OptionRow>

              <OptionRow
                label="Error Correction"
                iconName="shield-checkmark-outline"
                preview={eclPreview}
                tintColor={qrStyle.fgColor}
              >
                <View style={styles.eclRow}>
                  {ECL_OPTIONS.map((e) => (
                    <TouchableOpacity
                      key={e}
                      onPress={() => {
                        Haptics.selectionAsync();
                        applyStyle({ ...qrStyle, ecl: e });
                      }}
                      style={[
                        styles.eclBtn,
                        { borderColor: qrStyle.fgColor + "40" },
                        qrStyle.ecl === e && {
                          backgroundColor: qrStyle.fgColor + "25",
                          borderColor: qrStyle.fgColor,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.eclLabel,
                          { color: qrStyle.fgColor },
                          qrStyle.ecl === e && { fontWeight: "700" },
                        ]}
                      >
                        {e}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </OptionRow>
            </View>

            <View style={{ height: Spacing["4xl"] }} />
          </ScrollView>

          {/* ── Sticky FABs ── */}
          <View
            style={[
              styles.fabContainer,
              {
                borderTopColor: qrStyle.fgColor + "20",
                backgroundColor: fgToScreenBg(qrStyle.fgColor) + "ee",
              },
            ]}
          >
            <FabBar
              tintColor={qrStyle.fgColor}
              disabled={!hasQR}
              onCopy={handleCopy}
              onShuffle={handleShuffle}
              onShare={handleShare}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingTop: Spacing.lg, gap: Spacing.md },

  canvasWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },

  inputWrap: {
    marginHorizontal: Spacing.base,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    gap: Spacing.md,
  },

  options: {
    marginHorizontal: Spacing.base,
    gap: Spacing.sm,
  },

  eclRow: { flexDirection: "row", gap: Spacing.sm, paddingTop: Spacing.xs },
  eclBtn: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  eclLabel: { fontSize: FontSize.sm },

  dotPreview: { width: 18, height: 18, borderRadius: 9 },
  previewText: { fontSize: FontSize.sm, fontWeight: "700" },

  fabContainer: {
    borderTopWidth: 0.5,
    paddingBottom: Platform.OS === "ios" ? Spacing.lg : Spacing.md,
  },
});
