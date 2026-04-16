import { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeInDown,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import { TypeSelector } from "@/components/qr/TypeSelector";
import { QRPreview } from "@/components/qr/QRPreview";
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
import { CustomizeSheet } from "@/components/qr/CustomizeSheet";
import { PressableScale } from "@/components/ui/PressableScale";

import { Colors, Spacing, Radius, FontSize } from "@/constants/theme";
import {
  QRType,
  ECL,
  URLForm,
  TextForm,
  EmailForm,
  PhoneForm,
  SMSForm,
  WiFiForm,
  ContactForm,
  LocationForm,
  QRStyle,
  DEFAULT_QR_STYLE,
} from "@/types/qr";

// ─── Encode each form type into QR string ─────────────────────────────────────
function encodeQR(type: QRType, forms: FormState): string {
  switch (type) {
    case "url": {
      const url = forms.url.url.trim();
      if (!url) return "";
      return url.startsWith("http") ? url : `https://${url}`;
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

// ─── Default form states ───────────────────────────────────────────────────────
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

const defaultForms: FormState = {
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

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CreateScreen() {
  const [qrType, setQrType] = useState<QRType>("url");
  const [forms, setForms] = useState<FormState>(defaultForms);
  const [ecl, setEcl] = useState<ECL>("M");
  const [qrStyle, setQrStyle] = useState<QRStyle>(DEFAULT_QR_STYLE);
  const [showCustomize, setShowCustomize] = useState(false);
  const [showEcl, setShowEcl] = useState(false);
  const svgRef = useRef<any>(null);

  const qrValue = encodeQR(qrType, forms);

  const handleTypeChange = useCallback((t: QRType) => {
    Haptics.selectionAsync();
    setQrType(t);
  }, []);

  const updateForm = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForms((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const eclBtnScale = useSharedValue(1);
  const eclPanelHeight = useSharedValue(0);
  const eclPanelOpacity = useSharedValue(0);

  const eclPanelStyle = useAnimatedStyle(() => ({
    height: eclPanelHeight.value,
    opacity: eclPanelOpacity.value,
    overflow: "hidden",
  }));

  const toggleEcl = () => {
    const next = !showEcl;
    setShowEcl(next);
    eclPanelHeight.value = withSpring(next ? 52 : 0, {
      damping: 16,
      stiffness: 200,
    });
    eclPanelOpacity.value = withTiming(next ? 1 : 0, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
    Haptics.selectionAsync();
  };

  const renderForm = () => {
    switch (qrType) {
      case "url":
        return (
          <URLFormView
            form={forms.url}
            onChange={(v) => updateForm("url", v)}
          />
        );
      case "text":
        return (
          <TextFormView
            form={forms.text}
            onChange={(v) => updateForm("text", v)}
          />
        );
      case "email":
        return (
          <EmailFormView
            form={forms.email}
            onChange={(v) => updateForm("email", v)}
          />
        );
      case "phone":
        return (
          <PhoneFormView
            form={forms.phone}
            onChange={(v) => updateForm("phone", v)}
          />
        );
      case "sms":
        return (
          <SMSFormView
            form={forms.sms}
            onChange={(v) => updateForm("sms", v)}
          />
        );
      case "wifi":
        return (
          <WiFiFormView
            form={forms.wifi}
            onChange={(v) => updateForm("wifi", v)}
          />
        );
      case "contact":
        return (
          <ContactFormView
            form={forms.contact}
            onChange={(v) => updateForm("contact", v)}
          />
        );
      case "location":
        return (
          <LocationFormView
            form={forms.location}
            onChange={(v) => updateForm("location", v)}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View
            entering={FadeInDown.duration(400).springify()}
            style={styles.header}
          >
            <Text style={styles.appTitle}>Curium</Text>
            <Text style={styles.appSub}>QR Generator</Text>
          </Animated.View>

          {/* QR Preview */}
          <Animated.View
            entering={FadeInDown.delay(80).duration(400).springify()}
            style={styles.previewWrap}
          >
            <QRPreview
              value={qrValue}
              qrStyle={qrStyle}
              size={200}
              svgRef={svgRef}
            />
            {qrValue.length > 0 && (
              <Text style={styles.qrHint}>
                {qrValue.length} chars · ECL {ecl}
              </Text>
            )}
          </Animated.View>
          <PressableScale
            onPress={() => {
              Haptics.selectionAsync();
              setShowCustomize(true);
            }}
            style={styles.customizeBtn}
          >
            <Ionicons
              name="color-palette-outline"
              size={16}
              color={Colors.primary}
            />
            <Text style={styles.customizeBtnLabel}>Customise</Text>
          </PressableScale>

          {/* Type Selector */}
          <Animated.View
            entering={FadeInDown.delay(140).duration(400).springify()}
          >
            <Text style={styles.sectionLabel}>Type</Text>
            <TypeSelector selected={qrType} onChange={handleTypeChange} />
          </Animated.View>

          {/* Input Form */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(400).springify()}
            style={styles.formCard}
          >
            {renderForm()}
          </Animated.View>

          {/* ECL toggle */}
          <Animated.View
            entering={FadeInDown.delay(240).duration(400).springify()}
            style={styles.eclWrap}
          >
            <TouchableOpacity
              onPress={toggleEcl}
              style={styles.eclToggle}
              activeOpacity={0.7}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={15}
                color={Colors.textMuted}
              />
              <Text style={styles.eclToggleLabel}>Error Correction</Text>
              <Ionicons
                name={showEcl ? "chevron-up" : "chevron-down"}
                size={14}
                color={Colors.textFaint}
              />
            </TouchableOpacity>
            <Animated.View style={eclPanelStyle}>
              <View style={styles.eclRow}>
                {ECL_OPTIONS.map((e) => (
                  <PressableScale
                    key={e}
                    onPress={() => {
                      setQrStyle((prev) => ({ ...prev, ecl: e }));
                      Haptics.selectionAsync();
                    }}
                    style={[styles.eclBtn, ecl === e && styles.eclBtnActive]}
                  >
                    <Text
                      style={[
                        styles.eclBtnLabel,
                        ecl === e && styles.eclBtnLabelActive,
                      ]}
                    >
                      {e}
                    </Text>
                  </PressableScale>
                ))}
              </View>
            </Animated.View>
          </Animated.View>

          {/* Save placeholder — Phase 4 */}
          <Animated.View
            entering={FadeInDown.delay(280).duration(400).springify()}
          >
            <PressableScale
              onPress={() =>
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                )
              }
              style={[styles.saveBtn, !qrValue && styles.saveBtnDisabled]}
              disabled={!qrValue}
            >
              <Ionicons
                name="download-outline"
                size={18}
                color={qrValue ? Colors.textInverse : Colors.textFaint}
              />
              <Text
                style={[
                  styles.saveBtnLabel,
                  !qrValue && { color: Colors.textFaint },
                ]}
              >
                Save QR Code
              </Text>
            </PressableScale>
          </Animated.View>

          <View style={{ height: Spacing["3xl"] }} />
        </ScrollView>
      </KeyboardAvoidingView>
      <CustomizeSheet
        visible={showCustomize}
        style={qrStyle}
        onStyleChange={setQrStyle}
        onClose={() => setShowCustomize(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { paddingTop: Spacing.lg, gap: Spacing.lg },

  header: { paddingHorizontal: Spacing.xl },
  appTitle: {
    fontSize: FontSize["2xl"],
    fontWeight: "800",
    color: Colors.primary,
    letterSpacing: -1,
  },
  appSub: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },

  previewWrap: { alignItems: "center", paddingVertical: Spacing.sm },
  qrHint: {
    marginTop: Spacing.sm,
    fontSize: FontSize.xs,
    color: Colors.textFaint,
    letterSpacing: 0.4,
  },

  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.textFaint,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginLeft: Spacing.xl,
    marginBottom: -Spacing.xs,
  },

  formCard: {
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: Spacing.base,
    gap: Spacing.md,
  },

  eclWrap: {
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  eclToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  eclToggleLabel: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  eclRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
  },
  eclBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceOffset,
  },
  eclBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  eclBtnLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  eclBtnLabelActive: { color: Colors.primary },

  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md + 2,
  },
  saveBtnDisabled: { backgroundColor: Colors.surfaceOffset },
  saveBtnLabel: {
    fontSize: FontSize.base,
    fontWeight: "700",
    color: Colors.textInverse,
  },
  customizeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    alignSelf: "center",
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primaryBg,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary + "60",
  },
  customizeBtnLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.primary,
  },
});
