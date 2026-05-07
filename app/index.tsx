import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
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
  ECL,
  URLForm,
  TextForm,
  EmailForm,
  PhoneForm,
  SMSForm,
  WiFiForm,
  ContactForm,
  LocationForm,
} from "@/types/qr";

// ─── Form state type ──────────────────────────────────────────────────────────
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

// ─── QR Encoder ──────────────────────────────────────────────────────────────
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

const ECL_OPTIONS: ECL[] = ["L", "M", "Q", "H"];
const RANDOM_STYLES = QR_COLORS.filter((c) => c.id !== "paper");
const EYE_SHAPES = [
  "sharp",
  "soft",
  "round",
  "pill",
  "leaf",
  "diamond",
] as const;
const PIXEL_SHAPES = [
  "sharp",
  "soft",
  "round",
  "dots",
  "liquid",
  "glued",
] as const;

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function CreateScreen() {
  const [qrType, setQrType] = useState<QRType>("url");
  const [forms, setForms] = useState<FormState>(DEFAULT_FORMS);
  const [qrStyle, setQrStyle] = useState<QRStyle>(DEFAULT_QR_STYLE);
  const qrRef = useRef<View>(null);

  const qrValue = encodeQR(qrType, forms);
  const hasQR = qrValue.length > 0;
  const tint = qrStyle.fgColor;

  const updateForm = useCallback(
    <K extends keyof FormState>(key: K, val: FormState[K]) => {
      setForms((p) => ({ ...p, [key]: val }));
    },
    [],
  );

  const handleShuffle = useCallback(() => {
    const r = RANDOM_STYLES[Math.floor(Math.random() * RANDOM_STYLES.length)];
    setQrStyle((p) => ({
      ...p,
      colorId: r.id,
      fgColor: r.fg,
      bgColor: r.bg,
      eyeShape: EYE_SHAPES[Math.floor(Math.random() * EYE_SHAPES.length)],
      pixelShape: PIXEL_SHAPES[Math.floor(Math.random() * PIXEL_SHAPES.length)],
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!hasQR) return;
    await Clipboard.setStringAsync(qrValue);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [qrValue, hasQR]);

  const handleShare = useCallback(async () => {
    if (!hasQR || !qrRef.current) return;
    try {
      const uri = await captureRef(qrRef, { format: "png", quality: 1 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "image/png" });
      }
    } catch {
      Alert.alert("Error", "Could not share QR code.");
    }
  }, [hasQR]);

  const renderForm = () => {
    const props = { tintColor: tint };
    switch (qrType) {
      case "url":
        return (
          <URLFormView
            {...props}
            form={forms.url}
            onChange={(v) => updateForm("url", v)}
          />
        );
      case "text":
        return (
          <TextFormView
            {...props}
            form={forms.text}
            onChange={(v) => updateForm("text", v)}
          />
        );
      case "email":
        return (
          <EmailFormView
            {...props}
            form={forms.email}
            onChange={(v) => updateForm("email", v)}
          />
        );
      case "phone":
        return (
          <PhoneFormView
            {...props}
            form={forms.phone}
            onChange={(v) => updateForm("phone", v)}
          />
        );
      case "sms":
        return (
          <SMSFormView
            {...props}
            form={forms.sms}
            onChange={(v) => updateForm("sms", v)}
          />
        );
      case "wifi":
        return (
          <WiFiFormView
            {...props}
            form={forms.wifi}
            onChange={(v) => updateForm("wifi", v)}
          />
        );
      case "contact":
        return (
          <ContactFormView
            {...props}
            form={forms.contact}
            onChange={(v) => updateForm("contact", v)}
          />
        );
      case "location":
        return (
          <LocationFormView
            {...props}
            form={forms.location}
            onChange={(v) => updateForm("location", v)}
          />
        );
    }
  };

  return (
    // Screen bg = QR background color directly — no animation, no tricks
    <View style={[styles.screen, { backgroundColor: qrStyle.bgColor }]}>
      <StatusBar backgroundColor={qrStyle.bgColor} barStyle="dark-content" />
      <SafeAreaView
        style={[styles.safe, { backgroundColor: qrStyle.bgColor }]}
        edges={["top", "bottom"]}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* QR */}
          <View ref={qrRef} style={styles.canvasWrap} collapsable={false}>
            <QRCanvas value={qrValue} qrStyle={qrStyle} size={270} />
          </View>

          {/* Type selector */}
          <TypePill selected={qrType} tintColor={tint} onChange={setQrType} />

          {/* Input form */}
          <View
            style={[
              styles.card,
              { borderColor: tint + "35", backgroundColor: tint + "10" },
            ]}
          >
            {renderForm()}
          </View>

          {/* Option rows */}
          <View style={styles.options}>
            <OptionRow
              label="Color"
              iconName="color-palette-outline"
              tintColor={tint}
              defaultOpen
              preview={<View style={[styles.dot, { backgroundColor: tint }]} />}
            >
              <ColorPalette
                selectedId={qrStyle.colorId}
                onSelect={(id, fg, bg) =>
                  setQrStyle((p) => ({
                    ...p,
                    colorId: id,
                    fgColor: fg,
                    bgColor: bg,
                  }))
                }
              />
            </OptionRow>

            <OptionRow
              label="Eye Style"
              iconName="eye-outline"
              tintColor={tint}
              preview={
                <Ionicons name="scan-outline" size={15} color={tint + "90"} />
              }
            >
              <EyeShapeSelector
                selected={qrStyle.eyeShape}
                fgColor={tint}
                onChange={(s) => setQrStyle((p) => ({ ...p, eyeShape: s }))}
              />
            </OptionRow>

            <OptionRow
              label="Pixel Style"
              iconName="grid-outline"
              tintColor={tint}
              preview={
                <Ionicons name="apps-outline" size={15} color={tint + "90"} />
              }
            >
              <PixelShapeSelector
                selected={qrStyle.pixelShape}
                fgColor={tint}
                onChange={(s) => setQrStyle((p) => ({ ...p, pixelShape: s }))}
              />
            </OptionRow>

            <OptionRow
              label="Logo"
              iconName="image-outline"
              tintColor={tint}
              preview={
                qrStyle.logoUri ? (
                  <Ionicons name="checkmark-circle" size={15} color={tint} />
                ) : (
                  <Ionicons
                    name="add-circle-outline"
                    size={15}
                    color={tint + "80"}
                  />
                )
              }
            >
              <LogoPicker
                logoUri={qrStyle.logoUri}
                onChange={(uri) => setQrStyle((p) => ({ ...p, logoUri: uri }))}
              />
            </OptionRow>

            <OptionRow
              label="Error Correction"
              iconName="shield-checkmark-outline"
              tintColor={tint}
              preview={
                <Text style={[styles.eclPreview, { color: tint }]}>
                  {qrStyle.ecl}
                </Text>
              }
            >
              <View style={styles.eclRow}>
                {ECL_OPTIONS.map((e) => (
                  <TouchableOpacity
                    key={e}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setQrStyle((p) => ({ ...p, ecl: e }));
                    }}
                    style={[
                      styles.eclBtn,
                      { borderColor: tint + "40" },
                      qrStyle.ecl === e && {
                        backgroundColor: tint + "25",
                        borderColor: tint,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.eclLabel,
                        { color: tint },
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

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Sticky FABs — outside ScrollView, above keyboard */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            style={[
              styles.fabContainer,
              { borderTopColor: tint + "25", backgroundColor: qrStyle.bgColor },
            ]}
          >
            <FabBar
              tintColor={tint}
              bgColor={qrStyle.bgColor}
              disabled={!hasQR}
              onCopy={handleCopy}
              onShuffle={handleShuffle}
              onShare={handleShare}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingTop: Spacing.lg },

  canvasWrap: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.base,
  },

  card: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.base,
  },

  options: {
    marginHorizontal: Spacing.base,
    gap: Spacing.sm,
  },

  dot: { width: 16, height: 16, borderRadius: 8 },
  eclPreview: { fontSize: FontSize.sm, fontWeight: "700" },
  eclRow: { flexDirection: "row", gap: Spacing.sm },
  eclBtn: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  eclLabel: { fontSize: FontSize.sm },

  fabContainer: {
    borderTopWidth: 0.5,
    paddingBottom: Platform.OS === "ios" ? Spacing.lg : Spacing.sm,
  },
});
