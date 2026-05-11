import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { saveToHistory } from "@/services/history";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import { useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { captureRef } from "react-native-view-shot";
import { Ionicons } from "@expo/vector-icons";

import { QRCanvas } from "@/components/qr/QRCanvas";
import { TypePill } from "@/components/qr/TypePill";
import { OptionRow } from "@/components/qr/OptionRow";
import { FabBar } from "@/components/qr/FabBar";
import { useTheme } from "@/context/ThemeContext";
import { ColorPalette } from "@/components/qr/ColorPalette";
import {
  EyeShapeSelector,
  PixelShapeSelector,
} from "@/components/qr/ShapeSelector";
import { LogoPicker } from "@/components/qr/LogoPicker";
import { ExportSheet } from "@/components/qr/ExportSheet";
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

import { Fonts, Spacing, Radius, FontSize, QR_COLORS } from "@/constants/theme";
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

// ─── Types — module level (NO hooks here) ────────────────────────────────────
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

type SheetId = "color" | "eye" | "pixel" | "logo" | "ecl" | null;

// ─── Constants — module level (NO hooks here) ────────────────────────────────
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

const ECL_OPTIONS: ECL[] = ["L", "M", "Q", "H"];
const RANDOM_STYLES = QR_COLORS.filter((c) => c.id !== "paper");

const EYE_SHAPES: QRStyle["eyeShape"][] = [
  "sharp",
  "soft",
  "round",
  "pill",
  "leaf",
  "diamond",
];
const PIXEL_SHAPES: QRStyle["pixelShape"][] = [
  "sharp",
  "soft",
  "round",
  "dots",
  "liquid",
  "glued",
];

const QR_TYPES: { id: QRType; label: string; icon: string }[] = [
  { id: "url", label: "URL", icon: "link-outline" },
  { id: "text", label: "Text", icon: "text-outline" },
  { id: "wifi", label: "WiFi", icon: "wifi-outline" },
  { id: "email", label: "Email", icon: "mail-outline" },
  { id: "phone", label: "Phone", icon: "call-outline" },
  { id: "sms", label: "SMS", icon: "chatbubble-outline" },
  { id: "contact", label: "Contact", icon: "person-outline" },
  { id: "location", label: "Location", icon: "location-outline" },
];

// ─── Encoder — module level pure function ────────────────────────────────────
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

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function CreateScreen() {
  // ALL hooks at top, unconditionally, always same order
  const { width } = useWindowDimensions();
  const [activeType, setActiveType] = useState<QRType>("url");
  const [forms, setForms] = useState<FormState>(DEFAULT_FORMS);
  const [qrStyle, setQrStyle] = useState<QRStyle>(DEFAULT_QR_STYLE);
  const [activeSheet, setActiveSheet] = useState<SheetId>(null);
  const qrRef = useRef<View>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const { setQRColors } = useTheme();
  const params = useLocalSearchParams<{
    loadType?: string;
    loadData?: string;
  }>();

  // Derived — no hooks
  const QR_SIZE = Math.floor(width * 0.85);
  const qrValue = useMemo(
    () => encodeQR(activeType, forms),
    [activeType, forms],
  );
  const lastSaved = useRef<string>("");

  useEffect(() => {
    if (!qrValue) return;
    const t = setTimeout(() => {
      if (qrValue === lastSaved.current) return; // ← don't save duplicates
      lastSaved.current = qrValue;
      saveToHistory({ type: activeType, value: qrValue, qrStyle });
    }, 2000); // ← 2s debounce
    return () => clearTimeout(t);
  }, [qrValue]);

  useEffect(() => {
    lastSaved.current = "";
  }, [activeType]);

  const hasQR = qrValue.length > 0;
  const tint = qrStyle.fgColor;

  const openSheet = useCallback((id: SheetId) => setActiveSheet(id), []);
  const closeSheet = useCallback(() => setActiveSheet(null), []);

  const updateForm = useCallback(
    <K extends keyof FormState>(key: K, val: FormState[K]) => {
      setForms((p) => ({ ...p, [key]: val }));
    },
    [],
  );

  const handleShuffle = useCallback(() => {
    const r = RANDOM_STYLES[Math.floor(Math.random() * RANDOM_STYLES.length)];
    const eye = EYE_SHAPES[Math.floor(Math.random() * EYE_SHAPES.length)];
    const pixel = PIXEL_SHAPES[Math.floor(Math.random() * PIXEL_SHAPES.length)];
    setQrStyle((p) => ({
      ...p,
      colorId: r.id,
      fgColor: r.fg,
      bgColor: r.bg,
      eyeShape: eye,
      pixelShape: pixel,
    }));
    setQRColors(r.fg, r.bg);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  //On mount
  useEffect(() => {
    setQRColors(DEFAULT_QR_STYLE.fgColor, DEFAULT_QR_STYLE.bgColor);
  }, []);
  useEffect(() => {
    if (!params.loadType || !params.loadData) return;
    try {
      const parsed = JSON.parse(params.loadData);
      setActiveType(params.loadType as QRType);
      setForms((p) => ({ ...p, [params.loadType!]: parsed }));
    } catch {}
  }, [params.loadType, params.loadData]);

  const handleCopy = useCallback(async () => {
    if (!hasQR) return;
    await Clipboard.setStringAsync(qrValue);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [qrValue, hasQR]);

  const handleShare = useCallback(() => {
    if (!hasQR) return;
    setExportOpen(true);
  }, [hasQR]);

  const renderForm = () => {
    switch (activeType) {
      case "url":
        return (
          <URLFormView
            tintColor={tint}
            form={forms.url}
            onChange={(v) => updateForm("url", v)}
          />
        );
      case "text":
        return (
          <TextFormView
            tintColor={tint}
            form={forms.text}
            onChange={(v) => updateForm("text", v)}
          />
        );
      case "email":
        return (
          <EmailFormView
            tintColor={tint}
            form={forms.email}
            onChange={(v) => updateForm("email", v)}
          />
        );
      case "phone":
        return (
          <PhoneFormView
            tintColor={tint}
            form={forms.phone}
            onChange={(v) => updateForm("phone", v)}
          />
        );
      case "sms":
        return (
          <SMSFormView
            tintColor={tint}
            form={forms.sms}
            onChange={(v) => updateForm("sms", v)}
          />
        );
      case "wifi":
        return (
          <WiFiFormView
            tintColor={tint}
            form={forms.wifi}
            onChange={(v) => updateForm("wifi", v)}
          />
        );
      case "contact":
        return (
          <ContactFormView
            tintColor={tint}
            form={forms.contact}
            onChange={(v) => updateForm("contact", v)}
          />
        );
      case "location":
        return (
          <LocationFormView
            tintColor={tint}
            form={forms.location}
            onChange={(v) => updateForm("location", v)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: qrStyle.bgColor }]}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* QR Canvas */}
            <View style={styles.canvasWrap}>
              <View
                ref={qrRef}
                collapsable={false}
                style={{ width: QR_SIZE, height: QR_SIZE }}
              >
                <QRCanvas value={qrValue} qrStyle={qrStyle} size={QR_SIZE} />
              </View>
            </View>

            {/* Type pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pills}
            >
              <TypePill
                selected={activeType}
                tintColor={tint}
                onChange={(t) => setActiveType(t)}
              />
            </ScrollView>

            {/* Input form */}
            <View
              style={[
                styles.card,
                {
                  borderColor: tint + "25",
                  backgroundColor: tint + "10",
                },
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
                bgColor={qrStyle.bgColor}
                sheetOpen={activeSheet === "color"}
                onOpen={() => openSheet("color")}
                onClose={closeSheet}
                preview={
                  <View style={[styles.dot, { backgroundColor: tint }]} />
                }
              >
                <ColorPalette
                  selectedId={qrStyle.colorId}
                  onSelect={(id, fg, bg) => {
                    setQrStyle((p) => ({
                      ...p,
                      colorId: id,
                      fgColor: fg,
                      bgColor: bg,
                    }));
                    setQRColors(fg, bg);
                  }}
                />
              </OptionRow>

              <OptionRow
                label="Eye Style"
                iconName="eye-outline"
                tintColor={tint}
                bgColor={qrStyle.bgColor}
                sheetOpen={activeSheet === "eye"}
                onOpen={() => openSheet("eye")}
                onClose={closeSheet}
                preview={
                  <Ionicons name="scan-outline" size={15} color={tint + "90"} />
                }
              >
                <EyeShapeSelector
                  selected={qrStyle.eyeShape}
                  fgColor={tint}
                  onChange={(s) => {
                    setQrStyle((p) => ({ ...p, eyeShape: s }));
                    closeSheet();
                  }}
                />
              </OptionRow>

              <OptionRow
                label="Pixel Style"
                iconName="grid-outline"
                tintColor={tint}
                bgColor={qrStyle.bgColor}
                sheetOpen={activeSheet === "pixel"}
                onOpen={() => openSheet("pixel")}
                onClose={closeSheet}
                preview={
                  <Ionicons name="apps-outline" size={15} color={tint + "90"} />
                }
              >
                <PixelShapeSelector
                  selected={qrStyle.pixelShape}
                  fgColor={tint}
                  onChange={(s) => {
                    setQrStyle((p) => ({ ...p, pixelShape: s }));
                    closeSheet();
                  }}
                />
              </OptionRow>

              <OptionRow
                label="Logo"
                iconName="image-outline"
                tintColor={tint}
                bgColor={qrStyle.bgColor}
                sheetOpen={activeSheet === "logo"}
                onOpen={() => openSheet("logo")}
                onClose={closeSheet}
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
                  onChange={(uri) => {
                    setQrStyle((p) => ({ ...p, logoUri: uri }));
                    closeSheet();
                  }}
                />
              </OptionRow>

              <OptionRow
                label="Error Correction"
                iconName="shield-checkmark-outline"
                tintColor={tint}
                bgColor={qrStyle.bgColor}
                sheetOpen={activeSheet === "ecl"}
                onOpen={() => openSheet("ecl")}
                onClose={closeSheet}
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
                        closeSheet();
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
            <View style={{ height: Spacing.xl }} />
          </ScrollView>

          <FabBar
            tintColor={tint}
            bgColor={qrStyle.bgColor}
            disabled={!hasQR}
            onCopy={handleCopy}
            onShuffle={handleShuffle}
            onShare={handleShare}
          />
          <ExportSheet
            visible={exportOpen}
            onClose={() => setExportOpen(false)}
            qrRef={qrRef}
            qrValue={qrValue}
            tintColor={tint}
            bgColor={qrStyle.bgColor}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingTop: Spacing.md },

  canvasWrap: {
    alignItems: "center",
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.lg,
  },

  pills: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },

  card: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.base,
  },

  options: { marginHorizontal: Spacing.base, gap: Spacing.sm },
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
});
