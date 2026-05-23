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

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Constants ────────────────────────────────────────────────────────────────
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
  "sharp", "soft", "round", "pill", "leaf", "diamond",
];
const PIXEL_SHAPES: QRStyle["pixelShape"][] = [
  "sharp", "soft", "round", "dots", "liquid", "glued",
];

const QR_TYPES: { id: QRType; label: string; icon: string }[] = [
  { id: "url",      label: "URL",      icon: "link-outline" },
  { id: "text",     label: "Text",     icon: "text-outline" },
  { id: "wifi",     label: "WiFi",     icon: "wifi-outline" },
  { id: "email",    label: "Email",    icon: "mail-outline" },
  { id: "phone",    label: "Phone",    icon: "call-outline" },
  { id: "sms",      label: "SMS",      icon: "chatbubble-outline" },
  { id: "contact",  label: "Contact",  icon: "person-outline" },
  { id: "location", label: "Location", icon: "location-outline" },
];

// ─── Encoder ──────────────────────────────────────────────────────────────────
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
  // useWindowDimensions MUST be inside the component (Rules of Hooks)
  const { width } = useWindowDimensions();
  const QR_SIZE = Math.min(Math.floor(width) - Spacing.base * 2, 320);

  // all hooks at top, unconditionally, same order every render
  const [activeType, setActiveType]       = useState<QRType>("url");
  const [forms, setForms]                 = useState<FormState>(DEFAULT_FORMS);
  const [qrStyle, setQrStyle]             = useState<QRStyle>(DEFAULT_QR_STYLE);
  const [activeSheet, setActiveSheet]     = useState<SheetId>(null);
  const [exportOpen, setExportOpen]       = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [colorTarget, setColorTarget]     = useState<"fg" | "bg" | null>(null);
  const qrRef                             = useRef<View>(null);
  const qrStyleRef                        = useRef(qrStyle);
  const lastSaved                         = useRef("");

  const { colors, setQRColors } = useTheme();
  const { show: showToast }     = useToast();
  const params = useLocalSearchParams<{ loadType?: string; loadData?: string }>();

  useEffect(() => { qrStyleRef.current = qrStyle; }, [qrStyle]);

  useEffect(() => {
    setQRColors(DEFAULT_QR_STYLE.fgColor, DEFAULT_QR_STYLE.bgColor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!params.loadType || !params.loadData) return;
    try {
      const parsed = JSON.parse(params.loadData);
      setActiveType(params.loadType as QRType);
      setForms((p) => ({ ...p, [params.loadType!]: parsed }));
    } catch {}
  }, [params.loadType, params.loadData]);

  const qrValue = useMemo(() => encodeQR(activeType, forms), [activeType, forms]);

  useEffect(() => {
    if (!qrValue) return;
    const t = setTimeout(() => {
      if (qrValue === lastSaved.current) return;
      lastSaved.current = qrValue;
      saveToHistory({ type: activeType, value: qrValue, qrStyle: qrStyleRef.current });
    }, 2500);
    return () => clearTimeout(t);
  }, [qrValue, activeType]);

  useEffect(() => { lastSaved.current = ""; }, [activeType]);

  const hasQR = qrValue.length > 0;
  const tint  = qrStyle.fgColor;

  const openSheet  = useCallback((id: SheetId) => setActiveSheet(id), []);
  const closeSheet = useCallback(() => setActiveSheet(null), []);

  const updateForm = useCallback(
    <K extends keyof FormState>(key: K, val: FormState[K]) =>
      setForms((p) => ({ ...p, [key]: val })),
    [],
  );

  const handleShuffle = useCallback(() => {
    const r     = RANDOM_STYLES[Math.floor(Math.random() * RANDOM_STYLES.length)];
    const eye   = EYE_SHAPES[Math.floor(Math.random() * EYE_SHAPES.length)];
    const pixel = PIXEL_SHAPES[Math.floor(Math.random() * PIXEL_SHAPES.length)];
    setQrStyle((p) => ({ ...p, colorId: r.id, fgColor: r.fg, bgColor: r.bg, eyeShape: eye, pixelShape: pixel }));
    setQRColors(r.fg, r.bg);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [setQRColors]);

  const handleCopy = useCallback(async () => {
    if (!hasQR) return;
    await Clipboard.setStringAsync(qrValue);
    showToast("Copied to clipboard", "success");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [qrValue, hasQR, showToast]);

  const handleShare = useCallback(() => {
    if (!hasQR) return;
    setExportOpen(true);
  }, [hasQR]);

  const handlePickLogo = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    await new Promise((r) => setTimeout(r, 150));
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0])
        setQrStyle((p: QRStyle) => ({ ...p, logoUri: result.assets[0].uri }));
    } catch (err) {
      console.warn(err);
    }
  }, []);

  const activeTypeMeta = QR_TYPES.find((t) => t.id === activeType);

  // renderForm uses `form=` (matching InputForms props interface)
  const renderForm = () => {
    switch (activeType) {
      case "url":      return <URLFormView      form={forms.url}      onChange={(v) => updateForm("url",      v)} tintColor={tint} />;
      case "text":     return <TextFormView     form={forms.text}     onChange={(v) => updateForm("text",     v)} tintColor={tint} />;
      case "email":    return <EmailFormView    form={forms.email}    onChange={(v) => updateForm("email",    v)} tintColor={tint} />;
      case "phone":    return <PhoneFormView    form={forms.phone}    onChange={(v) => updateForm("phone",    v)} tintColor={tint} />;
      case "sms":      return <SMSFormView      form={forms.sms}      onChange={(v) => updateForm("sms",      v)} tintColor={tint} />;
      case "wifi":     return <WiFiFormView     form={forms.wifi}     onChange={(v) => updateForm("wifi",     v)} tintColor={tint} />;
      case "contact":  return <ContactFormView  form={forms.contact}  onChange={(v) => updateForm("contact",  v)} tintColor={tint} />;
      case "location": return <LocationFormView form={forms.location} onChange={(v) => updateForm("location", v)} tintColor={tint} />;
      default:         return null;
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* ── App bar ── */}
        <View style={[styles.appBar, { borderBottomColor: colors.border, backgroundColor: colors.bg }]}>
          <Text style={[styles.appTitle, { color: colors.text, fontFamily: Fonts.monoBold }]}>
            Curium
          </Text>
          <View style={styles.appBarRight}>
            <TouchableOpacity
              onPress={handleCopy}
              hitSlop={12}
              disabled={!hasQR}
              style={[styles.appBarBtn, { opacity: hasQR ? 1 : 0.35 }]}
            >
              <Ionicons name="copy-outline" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── QR canvas ── */}
        <View style={styles.canvasWrap}>
          <View
            ref={qrRef}
            collapsable={false}
            style={[
              styles.qrCard,
              { width: QR_SIZE, height: QR_SIZE, backgroundColor: qrStyle.bgColor, borderColor: colors.border },
            ]}
          >
            <QRCanvas
              value={qrValue || "https://curium.app"}
              style={qrStyle}
              size={QR_SIZE - 16}
            />
            {qrStyle.logoUri && (
              <LogoOverlay
                uri={qrStyle.logoUri}
                size={QR_SIZE * 0.22}
                onRemove={() => setQrStyle((p: QRStyle) => ({ ...p, logoUri: undefined }))}
              />
            )}
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Type selector — uses selected/tintColor/onChange ── */}
          <TypeSelector
            selected={activeType}
            tintColor={tint}
            onChange={(t) => {
              setActiveType(t);
              lastSaved.current = "";
            }}
          />

          {/* ── Form trigger card ── */}
          <TouchableOpacity
            onPress={() => setFormModalOpen(true)}
            activeOpacity={0.75}
            style={[styles.formTrigger, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={[styles.formTriggerIcon, { backgroundColor: tint + "18" }]}>
              <Ionicons name={activeTypeMeta?.icon as any} size={18} color={tint} />
            </View>
            <View style={styles.formTriggerText}>
              <Text style={[styles.formTriggerLabel, { color: colors.textMuted, fontFamily: Fonts.mono }]}>
                {activeTypeMeta?.label}
              </Text>
              <Text
                style={[styles.formTriggerValue, { color: qrValue ? colors.text : colors.textFaint, fontFamily: Fonts.mono }]}
                numberOfLines={1}
              >
                {qrValue || "Tap to enter data…"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
          </TouchableOpacity>

          {/* ── Style options ── */}
          <View style={styles.options}>

            {/* Color preset */}
            <OptionRow
              label="Color Preset"
              iconName="color-palette-outline"
              tintColor={tint}
              onOpen={() => openSheet("color")}
              onClose={closeSheet}
              preview={<View style={[styles.dot, { backgroundColor: tint }]} />}
            >
              <ColorPalette
                selectedId={qrStyle.colorId}
                onSelect={(id, fg, bg) => {
                  setQrStyle((p) => ({ ...p, colorId: id, fgColor: fg, bgColor: bg }));
                  setQRColors(fg, bg);
                }}
              />
              <View style={styles.customColorRow}>
                <TouchableOpacity
                  onPress={() => setColorTarget("fg")}
                  style={[styles.customBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                >
                  <View style={[styles.colorDot, { backgroundColor: qrStyle.fgColor }]} />
                  <Text style={[styles.customBtnText, { color: colors.textMuted, fontFamily: Fonts.mono }]}>FG</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setColorTarget("bg")}
                  style={[styles.customBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                >
                  <View style={[styles.colorDot, { backgroundColor: qrStyle.bgColor }]} />
                  <Text style={[styles.customBtnText, { color: colors.textMuted, fontFamily: Fonts.mono }]}>BG</Text>
                </TouchableOpacity>
              </View>
            </OptionRow>

            {/* Eye shape */}
            <OptionRow
              label="Eye Shape"
              iconName="eye-outline"
              tintColor={tint}
              onOpen={() => openSheet("eye")}
              onClose={closeSheet}
              preview={
                <Text style={[styles.previewText, { color: tint, fontFamily: Fonts.mono }]}>
                  {qrStyle.eyeShape}
                </Text>
              }
            >
              <EyeShapeSelector
                selected={qrStyle.eyeShape}
                tintColor={tint}
                onSelect={(s) => { setQrStyle((p) => ({ ...p, eyeShape: s })); closeSheet(); }}
              />
            </OptionRow>

            {/* Pixel shape */}
            <OptionRow
              label="Pixel Shape"
              iconName="grid-outline"
              tintColor={tint}
              onOpen={() => openSheet("pixel")}
              onClose={closeSheet}
              preview={
                <Text style={[styles.previewText, { color: tint, fontFamily: Fonts.mono }]}>
                  {qrStyle.pixelShape}
                </Text>
              }
            >
              <PixelShapeSelector
                selected={qrStyle.pixelShape}
                tintColor={tint}
                onSelect={(s) => { setQrStyle((p) => ({ ...p, pixelShape: s })); closeSheet(); }}
              />
            </OptionRow>

            {/* Logo */}
            <OptionRow
              label="Logo"
              iconName="image-outline"
              tintColor={tint}
              onOpen={() => openSheet("logo")}
              onClose={closeSheet}
              preview={
                qrStyle.logoUri
                  ? <Ionicons name="checkmark-circle" size={18} color={tint} />
                  : <Ionicons name="add-circle-outline" size={18} color={colors.textFaint} />
              }
            >
              <LogoPicker
                currentUri={qrStyle.logoUri}
                tintColor={tint}
                onSelect={(uri) => { setQrStyle((p) => ({ ...p, logoUri: uri })); closeSheet(); }}
              />
            </OptionRow>

            {/* Error correction */}
            <OptionRow
              label="Error Correction"
              iconName="shield-checkmark-outline"
              tintColor={tint}
              onOpen={() => openSheet("ecl")}
              onClose={closeSheet}
              preview={
                <Text style={[styles.eclPreview, { color: tint, fontFamily: Fonts.monoBold }]}>
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
                      { borderColor: colors.border },
                      qrStyle.ecl === e && { backgroundColor: tint + "20", borderColor: tint },
                    ]}
                  >
                    <Text
                      style={[
                        styles.eclLabel,
                        { color: qrStyle.ecl === e ? tint : colors.textMuted, fontFamily: Fonts.monoBold },
                      ]}
                    >
                      {e}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </OptionRow>
          </View>

          <View style={{ height: 48 }} />
        </ScrollView>

        {/* ── FAB bar ── */}
        <FabBar
          tintColor={tint}
          bgColor={qrStyle.bgColor}
          disabled={!hasQR}
          onCopy={handleCopy}
          onShuffle={handleShuffle}
          onShare={handleShare}
        />

        {/* ── Sheets / modals ── */}
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
          initialColor={colorTarget === "fg" ? qrStyle.fgColor : qrStyle.bgColor}
          title={colorTarget === "fg" ? "Foreground Color" : "Background Color"}
          onConfirm={(hex) => {
            setQrStyle((p: QRStyle) =>
              colorTarget === "fg"
                ? { ...p, colorId: "custom", fgColor: hex }
                : { ...p, colorId: "custom", bgColor: hex },
            );
          }}
          onClose={() => setColorTarget(null)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1 },
  flex:  { flex: 1 },

  appBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  appTitle:    { fontSize: FontSize.lg },
  appBarRight: { flexDirection: "row", gap: Spacing.sm },
  appBarBtn:   { padding: Spacing.xs },

  canvasWrap: {
    alignItems: "center",
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  qrCard: {
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },

  scroll:        { flex: 1 },
  scrollContent: { paddingBottom: Spacing.xl, gap: Spacing.sm },

  formTrigger: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.base,
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
  formTriggerText:  { flex: 1, gap: 2 },
  formTriggerLabel: { fontSize: FontSize.xs },
  formTriggerValue: { fontSize: FontSize.sm },

  options:        { marginHorizontal: Spacing.base, gap: Spacing.sm },
  dot:            { width: 16, height: 16, borderRadius: 8 },
  previewText:    { fontSize: FontSize.xs, textTransform: "capitalize" },
  eclPreview:     { fontSize: FontSize.sm },
  eclRow:         { flexDirection: "row", gap: Spacing.sm },
  eclBtn: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  eclLabel:       { fontSize: FontSize.sm },
  customColorRow: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.sm },
  customBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  customBtnText:  { fontSize: FontSize.xs },
  colorDot:       { width: 20, height: 20, borderRadius: 10 },
});
