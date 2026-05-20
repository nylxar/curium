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
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { captureRef } from "react-native-view-shot";
import { Ionicons } from "@expo/vector-icons";

import { QRCanvas } from "@/components/qr/QRCanvas";
import { TypePill } from "@/components/qr/TypePill";
import { OptionRow } from "@/components/qr/OptionRow";
import { FabBar } from "@/components/qr/FabBar";
import { FormModal } from "@/components/qr/FormModal";
import { useTheme } from "@/context/ThemeContext";
import { LogoOverlay } from "@/components/qr/LogoOverlay";
import { ColorPalette } from "@/components/qr/ColorPalette";
import {
  EyeShapeSelector,
  PixelShapeSelector,
} from "@/components/qr/ShapeSelector";
import { LogoPicker } from "@/components/qr/LogoPicker";
import { TypeSelector } from "@/components/qr/TypeSelector";
import { ColorPicker } from "@/components/qr/ColorPicker";
import { useToast } from "@/components/ui/Toast";
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

type SheetId =
  | "color"
  | "fgColor"
  | "bgColor"
  | "eye"
  | "pixel"
  | "logo"
  | "ecl"
  | null;

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

const { width } = useWindowDimensions();
const QR_SIZE = Math.floor(width) - 32;

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
  const [activeType, setActiveType] = useState<QRType>("url");
  const [forms, setForms] = useState<FormState>(DEFAULT_FORMS);
  const [qrStyle, setQrStyle] = useState<QRStyle>(DEFAULT_QR_STYLE);
  const [activeSheet, setActiveSheet] = useState<SheetId>(null);
  const qrRef = useRef<View>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const { setQRColors } = useTheme();
  const [colorTarget, setColorTarget] = useState<"fg" | "bg" | null>(null);
  const params = useLocalSearchParams<{
    loadType?: string;
    loadData?: string;
  }>();
  const [colorPickerTarget, setColorPickerTarget] = useState<
    "fg" | "bg" | null
  >(null);
  const { colors } = useTheme();
  const [formModalOpen, setFormModalOpen] = useState(false);
  const { show: showToast } = useToast();

  // Derived — no hooks
  const qrStyleRef = useRef(qrStyle);
  useEffect(() => {
    qrStyleRef.current = qrStyle;
  }, [qrStyle]);
  const qrValue = useMemo(
    () => encodeQR(activeType, forms),
    [activeType, forms],
  );
  const lastSaved = useRef<string>("");

  useEffect(() => {
    if (!qrValue) return;
    const t = setTimeout(() => {
      if (qrValue === lastSaved.current) return;
      lastSaved.current = qrValue;
      // Read qrStyle from ref, not closure
      saveToHistory({
        type: activeType,
        value: qrValue,
        qrStyle: qrStyleRef.current,
      });
    }, 2500);

    return () => clearTimeout(t);
  }, [qrValue, activeType]);

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
  const handlePickLogo = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    await new Promise<void>((r) => setTimeout(r, 150));
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setQrStyle((p: QRStyle) => ({ ...p, logoUri: result.assets[0].uri }));
      }
    } catch (err) {
      console.warn(err);
    }
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: qrStyle.bgColor }]}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        {/* ── STATIC TOP SECTION ── */}
        <View style={styles.staticTop}>
          {/* QR canvas — always visible */}
          <View style={styles.canvasWrap}>
            <View
              ref={qrRef}
              collapsable={false}
              style={{ width: QR_SIZE, height: QR_SIZE }}
            >
              <QRCanvas value={qrValue} qrStyle={qrStyle} size={QR_SIZE} />
              {qrStyle.logoUri && (
                <LogoOverlay
                  uri={qrStyle.logoUri}
                  containerSize={QR_SIZE}
                  onRemove={() =>
                    setQrStyle((p: QRStyle) => ({ ...p, logoUri: undefined }))
                  }
                />
              )}
            </View>
          </View>

          {/* Input form */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.formWrap}
          ></KeyboardAvoidingView>
          <TouchableOpacity
            style={[
              styles.formTrigger,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setFormModalOpen(true)}
            activeOpacity={0.7}
          >
            <View
              style={[styles.formTriggerIcon, { backgroundColor: tint + "18" }]}
            >
              <Ionicons
                name={QR_TYPES.find((t) => t.id === activeType)?.icon as any}
                size={18}
                color={tint}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.formTriggerLabel,
                  { color: colors.textMuted, fontFamily: Fonts.mono },
                ]}
              >
                {QR_TYPES.find((t) => t.id === activeType)?.label}
              </Text>
              <Text
                style={[
                  styles.formTriggerValue,
                  {
                    color: qrValue ? colors.text : colors.textFaint,
                    fontFamily: Fonts.mono,
                  },
                ]}
                numberOfLines={1}
              >
                {qrValue || "Tap to enter data..."}
              </Text>
            </View>
            <Ionicons name="create-outline" size={16} color={tint} />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Spacing.xxxl + 72 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TypeSelector
            selected={activeType}
            tintColor={tint}
            onChange={(t) => {
              setActiveType(t);
              lastSaved.current = "";
            }}
          />

          {/* Option rows */}
          <OptionRow
            label="Color"
            iconName="color-palette-outline"
            tintColor={tint}
            bgColor={qrStyle.bgColor}
            sheetOpen={activeSheet === "color"}
            onOpen={() => openSheet("color")}
            onClose={closeSheet}
            preview={<View style={[styles.dot, { backgroundColor: tint }]} />}
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
            <View
              style={{
                flexDirection: "row",
                gap: Spacing.sm,
                marginTop: Spacing.sm,
              }}
            >
              <TouchableOpacity
                style={[
                  styles.customBtn,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceOffset,
                  },
                ]}
                onPress={() => setColorTarget("fg")}
              >
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: qrStyle.fgColor,
                  }}
                />
                <Text
                  style={[
                    styles.customBtnText,
                    { color: colors.textMuted, fontFamily: Fonts.mono },
                  ]}
                >
                  Custom FG
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.customBtn,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceOffset,
                  },
                ]}
                onPress={() => setColorTarget("bg")}
              >
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: qrStyle.bgColor,
                  }}
                />
                <Text
                  style={[
                    styles.customBtnText,
                    { color: colors.textMuted, fontFamily: Fonts.mono },
                  ]}
                >
                  Custom BG
                </Text>
              </TouchableOpacity>
            </View>
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
        <FormModal
          visible={formModalOpen}
          onClose={() => setFormModalOpen(false)}
          activeType={activeType as QRType}
          forms={forms}
          onUpdateForm={updateForm}
          tintColor={tint}
        />
        <ColorPicker
          visible={colorTarget !== null}
          initialColor={
            colorTarget === "fg" ? qrStyle.fgColor : qrStyle.bgColor
          }
          title={colorTarget === "fg" ? "Foreground Color" : "Background Color"}
          onConfirm={(hex: string) => {
            setQrStyle((p: QRStyle) =>
              colorTarget === "fg"
                ? { ...p, colorId: "custom", fgColor: hex }
                : { ...p, colorId: "custom", bgColor: hex },
            );
          }}
          onClose={() => setColorTarget(null)}
        />
      </SafeAreaView>
      <ColorPicker
        visible={activeSheet === "fgColor"}
        initialColor={qrStyle.fgColor}
        title="Foreground Color"
        onConfirm={(c) =>
          setQrStyle((p) => ({ ...p, fgColor: c, colorId: "custom" }))
        }
        onClose={closeSheet}
      />
      <ColorPicker
        visible={activeSheet === "bgColor"}
        initialColor={qrStyle.bgColor}
        title="Background Color"
        onConfirm={(c) =>
          setQrStyle((p) => ({ ...p, bgColor: c, colorId: "custom" }))
        }
        onClose={closeSheet}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingTop: Spacing.md },

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
  staticTop: {
    // no flex — sizes to content
  },
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  appTitle: { fontSize: FontSize.xl },
  canvasWrap: {
    alignItems: "center",
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  formWrap: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.md },
  formCard: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.base,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.base, gap: Spacing.sm },
  customColorRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  customColorBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  customBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  customBtnText: { fontSize: FontSize.xs },
  colorDot: { width: 20, height: 20, borderRadius: 10 },
  customColorLabel: { fontSize: FontSize.xs },
  formTrigger: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  formTriggerIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  formTriggerLabel: { fontSize: FontSize.xs },
  formTriggerValue: { fontSize: FontSize.sm },
});
