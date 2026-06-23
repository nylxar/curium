import { useState, useCallback, useEffect, useRef, useMemo, useLayoutEffect } from "react";
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { saveToHistory } from "@/services/history";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { captureRef } from "react-native-view-shot";
import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

import { QRCanvas } from "@/components/qr/QRCanvas";
import { TypePill } from "@/components/qr/TypePill";
import { OptionRow } from "@/components/qr/OptionRow";
import { FabBar } from "@/components/qr/FabBar";
import { FormModal } from "@/components/qr/FormModal";
import { useTheme } from "@/context/ThemeContext";
import { ColorPalette } from "@/components/qr/ColorPalette";
import {
  EyeShapeSelector,
  PupilShapeSelector,
  PixelShapeSelector,
} from "@/components/qr/ShapeSelector";
import { FrameSelector } from "@/components/qr/FrameSelector";
import { GradientPicker } from "@/components/qr/GradientPicker";
import { LogoStyleSelector } from "@/components/qr/LogoStyleSelector";
import { CornerSelector } from "@/components/qr/CornerSelector";
import { LogoPicker } from "@/components/qr/LogoPicker";
import { TypeSelector } from "@/components/qr/TypeSelector";
import { ColorPicker } from "@/components/qr/ColorPicker";
import { useToast } from "@/components/ui/Toast";
import { ExportSheet } from "@/components/qr/ExportSheet";
import { TemplateSelector } from "@/components/qr/TemplateSelector";
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
import { mixHex } from "@/constants/colorUtils";
import { GlowPulse } from "@/components/qr/ColorTransitionCurtain";
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
  | "pupil"
  | "pixel"
  | "frame"
  | "corners"
  | "gradient"
  | "logo"
  | "logoStyle"
  | "ecl"
  | "templates"
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
  "dot",
  "shield",
  "hexagon",
  "octagon",
];
const PUPIL_SHAPES: QRStyle["pupilShape"][] = [
  "dot",
  "square",
  "diamond",
  "cross",
  "hexagon",
  "octagon",
  "shield",
  "star",
  "heart",
  "blob",
  "dome",
  "oval",
  "pentagon",
  "scallop",
  "cloud",
  "droplet",
  "pixel",
  "none",
];

// Eye↔Pupil compatibility map for the shuffle.
// Single-path pupils fill the full 3×3 center — all work with all eyes.
// "pixel" uses per-module grid — also works with all eyes.
// Only "none" is banned.
type Compat = "preferred" | "acceptable" | "banned";
const EYE_PUPIL_COMPAT: Record<
  QRStyle["eyeShape"],
  Record<QRStyle["pupilShape"], Compat>
> = {
  sharp: {}, soft: {}, round: {}, pill: {}, dot: {},
  shield: {}, hexagon: {}, octagon: {},
} as any;
for (const eye of ["sharp","soft","round","pill","dot","shield","hexagon","octagon"] as const) {
  for (const pupil of PUPIL_SHAPES) {
    (EYE_PUPIL_COMPAT as any)[eye][pupil] = pupil === "none" ? "banned" : "preferred";
  }
}

// `pupil === "none"` is the "no pupil" case — which produces a
// fully hollow eye.  The shuffle's `none` weight is intentionally
// low so we don't end up with "no center dot" most of the time.
const NONE_PROBABILITY = 0.1;
const PIXEL_SHAPES: QRStyle["pixelShape"][] = [
  "sharp",
  "soft",
  "round",
  "dots",
  "liquid",
  "glued",
  "smooth",
  "flow",
  "blob",
  "diamond",
  "cross",
  "star",
  "triangle",
  "hexagon",
  "plus",
  "heart",
  "sparkle",
  "pinched-square",
  "circuit-board",
  "hashtag",
  "vertical-line",
  "horizontal-line",
];
// Note: FRAME_STYLES, gradient, qrCorners, and logoStyle are intentionally
// not in the shuffle pool — see handleShuffle for the rationale.  Their
// selectors (FrameSelector, GradientPicker, CornerSelector, LogoStyleSelector)
// still offer the full lists.

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

  // ─── Animated Form Trigger ────────────────────────────────────────────────────
  // Matches OptionRow's visual treatment (tinted bg, same border, same icon
  // box) but stacks a label + value inside a single column to read as an
  // "input field" rather than a settings row.  Bg is theme-driven (same
  // as OptionRow) so the input field doesn't swing with palette swaps.
  function AnimatedFormTrigger({
    tint,
    colors,
    activeType,
    qrValue,
    onPress,
  }: {
    tint: string;
    colors: any;
    activeType: QRType;
    qrValue: string;
    onPress: () => void;
  }) {
    const rowBg = colors.surface;

    const currentType = QR_TYPES.find((t) => t.id === activeType);

    return (
      <Pressable
        onPress={onPress}
        style={() => [{}]}
      >
        <View
          style={[
            styles.formTrigger,
            { backgroundColor: rowBg, borderColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.formTriggerIcon,
              // Theme-driven icon-box bg + theme text icon.  Tinted bg
              // would disappear on light-fg palettes (ink), so we use
              // `colors.surfaceOffset` for the same reason as OptionRow.
              { backgroundColor: colors.surfaceOffset },
            ]}
          >
            <Ionicons
              name={(currentType?.icon as any) ?? "create-outline"}
              size={18}
              color={colors.text}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.formTriggerLabel,
                { color: colors.textMuted, fontFamily: Fonts.mono },
              ]}
              numberOfLines={1}
            >
              {currentType?.label}
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
          <View
            style={[
              styles.formTriggerChevron,
              { backgroundColor: colors.surfaceOffset },
            ]}
          >
            <Ionicons
              name="chevron-forward"
              size={14}
              color={colors.textMuted}
            />
          </View>
        </View>
      </Pressable>
    );
  }

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
  const { width: screenWidth } = useWindowDimensions();
  const QR_SIZE = Math.floor(screenWidth) - 32;
  const [activeType, setActiveType] = useState<QRType>("url");
  const [forms, setForms] = useState<FormState>(DEFAULT_FORMS);
  // Initial QR style follows the theme: paper/ink in light mode,
  // paper-dark/ink (inverted) in dark mode.  Users can still override
  // via the Color palette and that override persists in qrStyle state.
  const { setQRColors, defaultQRStyleForTheme, theme } = useTheme();
  const [qrStyle, setQrStyle] = useState<QRStyle>(defaultQRStyleForTheme);
  const [activeSheet, setActiveSheet] = useState<SheetId>(null);
  const qrRef = useRef<View>(null);
  const [exportOpen, setExportOpen] = useState(false);
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
  const qrValue = useMemo(
    () => encodeQR(activeType, forms),
    [activeType, forms],
  );
  const lastSaved = useRef<string>("");

  useEffect(() => {
    if (!qrValue) return;
    // Capture the latest style in the effect's closure.  Reading
    // `qrStyle` directly (rather than going through a ref) is the
    // most reliable pattern: refs are a known foot-gun for "stale
    // read inside a scheduled callback" because they don't trigger
    // re-runs.  Since the effect re-fires on every `qrStyle` change,
    // the closure always has the freshest value.
    const styleNow = qrStyle;
    const t = setTimeout(() => {
      // We compare against the last-saved *signature*: value + style
      // fingerprint.  Without the style fingerprint, the user could add a
      // logo (or any other style change) and the save would not fire
      // because qrValue didn't change.  The fingerprint is a small JSON
      // string of the style fields that affect the saved render.
      const sig =
        qrValue +
        "::" +
        JSON.stringify({
          colorId: styleNow.colorId,
          fgColor: styleNow.fgColor,
          bgColor: styleNow.bgColor,
          eyeColor: styleNow.eyeColor,
          eyeShape: styleNow.eyeShape,
          pupilShape: styleNow.pupilShape,
          pixelShape: styleNow.pixelShape,
          frame: styleNow.frame,
          qrCorners: styleNow.qrCorners,
          logoStyle: styleNow.logoStyle,
          logoUri: styleNow.logoUri,
          logoPosition: styleNow.logoPosition,
          gradient: styleNow.gradient,
        });
      if (sig === lastSaved.current) return;
      lastSaved.current = sig;
      saveToHistory({
        type: activeType,
        value: qrValue,
        qrStyle: styleNow,
      });
    }, 2500);

    return () => clearTimeout(t);
  }, [qrValue, activeType, qrStyle]);

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
    // Pick a pupil from the curated pool for the picked eye.  80%
    // chance of "preferred" pairings (clean), 20% of "acceptable"
    // (a bit busier).  "banned" pupils are never picked.  See
    // EYE_PUPIL_COMPAT for the per-eye map.
    const compat = EYE_PUPIL_COMPAT[eye];
    const preferred = PUPIL_SHAPES.filter((p) => compat[p] === "preferred");
    const acceptable = PUPIL_SHAPES.filter((p) => compat[p] === "acceptable");
    const pool =
      preferred.length > 0 && Math.random() < 0.8
        ? preferred
        : acceptable.length > 0
          ? acceptable
          : preferred;
    // `none` is a valid pupil shape but visually rare.  Down-weight
    // it so we don't end up with hollow eyes most of the time.
    const weightedPool =
      pool.length > 1 && Math.random() < NONE_PROBABILITY
        ? pool.filter((p) => p === "none")
        : pool.filter((p) => p !== "none");
    const pupil =
      weightedPool[Math.floor(Math.random() * weightedPool.length)] ??
      PUPIL_SHAPES[0];
    const pixel = PIXEL_SHAPES[Math.floor(Math.random() * PIXEL_SHAPES.length)];
    // Note: frame, gradient, and qrCorners are intentionally NOT
    // randomized.  These are more deliberate choices that can clash
    // with each other or with the palette, and shuffling them feels
    // jarring.  The user can still change them manually via their
    // respective option rows.
    setQrStyle((p) => ({
      ...p,
      colorId: r.id,
      fgColor: r.fg,
      bgColor: r.bg,
      eyeColor: r.fg,
      eyeShape: eye,
      pupilShape: pupil,
      pixelShape: pixel,
    }));
    setQRColors(r.fg, r.bg);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  //On mount
  useEffect(() => {
    setQRColors(
      defaultQRStyleForTheme.fgColor,
      defaultQRStyleForTheme.bgColor,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Paper default follows the theme ──
  // `colorId === "paper"` is the "follow the brand default" marker.  While
  // the user is on paper, swapping themes (or the system theme resolving
  // from null → dark after AsyncStorage hydration) should automatically
  // flip the QR's fg/bg/eye.  Once the user picks a named palette
  // (colorId !== "paper"), we leave their choice alone.
  useEffect(() => {
    setQrStyle((prev) => {
      if (prev.colorId !== "paper") return prev;
      return {
        ...prev,
        fgColor: defaultQRStyleForTheme.fgColor,
        bgColor: defaultQRStyleForTheme.bgColor,
        eyeColor: defaultQRStyleForTheme.eyeColor,
        gradient: defaultQRStyleForTheme.gradient,
      };
    });
  }, [
    defaultQRStyleForTheme.fgColor,
    defaultQRStyleForTheme.bgColor,
    defaultQRStyleForTheme.eyeColor,
    defaultQRStyleForTheme.gradient,
  ]);
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

  // 3-tier color hierarchy:
  //   • QR canvas  = original color (most saturated)
  //   • Option row = theme surface (independent of palette)
  //   • Screen bg  = theme bg blended 8% with QR bg
  //
  // Option rows are theme-driven (not palette-driven) so the chrome
  // stays consistent across palettes and themes.  Only the screen bg
  // picks up the QR hue at 8% — a subtle paper-tint that signals
  // which palette is active without making the chrome feel like part
  // of the QR.
  //
  // The screen bg blends a small amount (8%) of the QR bg into the
  // theme bg so the screen picks up the active palette's hue without
  // washing out to near-white (which was the slate issue with
  // tierVariant(bg, 0.18) — that mixed 18% of the QR bg toward white
  // or black depending on luminance, producing a cold look in light
  // mode).  At 8%, the screen still reads as "paper" or "ink" but
  // shifts subtly with palette swaps.
  const screenBgTarget = useMemo(
    () => mixHex(colors.bg, qrStyle.bgColor, 0.08),
    [colors.bg, qrStyle.bgColor],
  );
  const screenBg = useSharedValue(screenBgTarget);
  const prevScreenBg = useRef(screenBgTarget);
  useLayoutEffect(() => {
    if (screenBgTarget !== prevScreenBg.current) {
      const old = prevScreenBg.current;
      prevScreenBg.current = screenBgTarget;
      if (theme === "dynamic") {
        screenBg.value = screenBgTarget;
      } else {
        screenBg.value = old;
        screenBg.value = withTiming(screenBgTarget, {
          duration: 420,
          easing: Easing.out(Easing.cubic),
        });
      }
    }
  }, [screenBgTarget, theme]);
  const screenBgStyle = useAnimatedStyle(() => ({
    backgroundColor: screenBg.value,
  }));

  return (
    <Animated.View style={[styles.screen, screenBgStyle]}>
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
              <QRCanvas
                value={qrValue}
                qrStyle={qrStyle}
                size={QR_SIZE}
                logoUri={qrStyle.logoUri}
                logoSize={60}
                logoStyle={qrStyle.logoStyle}
                logoBgColor={qrStyle.bgColor}
                logoPosition={qrStyle.logoPosition}
                onLogoPositionChange={(pos) =>
                  setQrStyle((p) => ({ ...p, logoPosition: pos }))
                }
              />
            </View>
          </View>

          {/* Input form */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.formWrap}
          ></KeyboardAvoidingView>
          <AnimatedFormTrigger
            tint={tint}
            colors={colors}
            activeType={activeType}
            qrValue={qrValue}
            onPress={() => setFormModalOpen(true)}
          />
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
            bgColor={qrStyle.bgColor}
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
            bgColor={colors.surface}
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
            label="Templates"
            iconName="bookmark-outline"
            tintColor={tint}
            bgColor={colors.surface}
            sheetOpen={activeSheet === "templates"}
            onOpen={() => openSheet("templates")}
            onClose={closeSheet}
            preview={
              <Ionicons name="bookmark-outline" size={15} color={tint + "90"} />
            }
          >
            <TemplateSelector
              currentStyle={qrStyle}
              onLoad={(style) => {
                setQrStyle((p) => ({ ...p, ...style }));
                if (style.colorId !== "custom") {
                  setQRColors(style.fgColor, style.bgColor);
                }
                closeSheet();
              }}
            />
          </OptionRow>

          <OptionRow
            label="Eye Style"
            iconName="eye-outline"
            tintColor={tint}
            bgColor={colors.surface}
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
              }}
            />
          </OptionRow>

          <OptionRow
            label="Pupil"
            iconName="radio-button-on-outline"
            tintColor={tint}
            bgColor={colors.surface}
            sheetOpen={activeSheet === "pupil"}
            onOpen={() => openSheet("pupil")}
            onClose={closeSheet}
            preview={
              <Ionicons
                name="ellipse-outline"
                size={15}
                color={tint + "90"}
              />
            }
          >
            <PupilShapeSelector
              selected={qrStyle.pupilShape}
              fgColor={tint}
              onChange={(s) => {
                setQrStyle((p) => ({ ...p, pupilShape: s }));
              }}
            />
          </OptionRow>

          <OptionRow
            label="Pixel Style"
            iconName="grid-outline"
            tintColor={tint}
            bgColor={colors.surface}
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
              }}
            />
          </OptionRow>

          <OptionRow
            label="Frame"
            iconName="square-outline"
            tintColor={tint}
            bgColor={colors.surface}
            sheetOpen={activeSheet === "frame"}
            onOpen={() => openSheet("frame")}
            onClose={closeSheet}
            preview={
              <Ionicons
                name="crop-outline"
                size={15}
                color={tint + "90"}
              />
            }
          >
            <FrameSelector
              selected={qrStyle.frame}
              fgColor={tint}
              onChange={(f) => {
                setQrStyle((p) => ({ ...p, frame: f }));
              }}
            />
          </OptionRow>

          <OptionRow
            label="QR Corners"
            iconName="scan-circle-outline"
            tintColor={tint}
            bgColor={colors.surface}
            sheetOpen={activeSheet === "corners"}
            onOpen={() => openSheet("corners")}
            onClose={closeSheet}
            preview={
              <Ionicons
                name="square-outline"
                size={15}
                color={tint + "90"}
              />
            }
          >
            <CornerSelector
              selected={qrStyle.qrCorners}
              fgColor={tint}
              onChange={(c) => {
                setQrStyle((p) => ({ ...p, qrCorners: c }));
              }}
            />
          </OptionRow>

          <OptionRow
            label="Gradient"
            iconName="color-filter-outline"
            tintColor={tint}
            bgColor={colors.surface}
            sheetOpen={activeSheet === "gradient"}
            onOpen={() => openSheet("gradient")}
            onClose={closeSheet}
            preview={
              <Ionicons
                name={
                  qrStyle.gradient.enabled
                    ? "color-filter"
                    : "color-filter-outline"
                }
                size={15}
                color={tint + "90"}
              />
            }
          >
            <GradientPicker
              value={qrStyle.gradient}
              fgColor={tint}
              bgColor={colors.surface}
              onChange={(g) => {
                setQrStyle((p) => ({ ...p, gradient: g }));
              }}
            />
          </OptionRow>

          <OptionRow
            label="Logo"
            iconName="image-outline"
            tintColor={tint}
            bgColor={colors.surface}
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
            label="Logo Style"
            iconName="aperture-outline"
            tintColor={tint}
            bgColor={colors.surface}
            sheetOpen={activeSheet === "logoStyle"}
            onOpen={() => openSheet("logoStyle")}
            onClose={closeSheet}
            preview={
              <Ionicons
                name="shapes-outline"
                size={15}
                color={tint + "90"}
              />
            }
          >
            <LogoStyleSelector
              value={qrStyle.logoStyle}
              fgColor={tint}
              bgColor={colors.surface}
              onChange={(s) => {
                setQrStyle((p) => ({ ...p, logoStyle: s }));
              }}
            />
          </OptionRow>

          <OptionRow
            label="Error Correction"
            iconName="shield-checkmark-outline"
            tintColor={tint}
            bgColor={colors.surface}
            sheetOpen={activeSheet === "ecl"}
            onOpen={() => openSheet("ecl")}
            onClose={closeSheet}
            preview={
              // Use the theme text color so the preview stays readable for
              // ANY QR palette (a light tint would otherwise disappear on
              // the tinted row bg).
              <Text
                style={[styles.eclPreview, { color: colors.text }]}
              >
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
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                    },
                    qrStyle.ecl === e && {
                      backgroundColor: tint,
                      borderColor: tint,
                    },
                  ]}
                >
                  {qrStyle.ecl === e && (
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color={colors.bg}
                      style={{ marginRight: 4 }}
                    />
                  )}
                  <Text
                    style={[
                      styles.eclLabel,
                      // Theme text color for the unselected state so the
                      // letter is always readable.  Selected state uses
                      // the inverted bg color (paper/ink) for high contrast
                      // on the solid tint fill.
                      {
                        color:
                          qrStyle.ecl === e ? colors.bg : colors.text,
                        fontFamily:
                          qrStyle.ecl === e
                            ? Fonts.monoBold
                            : Fonts.monoMedium,
                      },
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
          qrStyle={qrStyle}
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
      <GlowPulse
        fgColor={qrStyle.fgColor}
        bgColor={qrStyle.bgColor}
        eyeColor={qrStyle.eyeColor}
      />
    </Animated.View>
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
  eclPreview: { fontSize: FontSize.sm, fontFamily: Fonts.monoBold, fontWeight: "700" },
  eclRow: { flexDirection: "row", gap: Spacing.sm },
  eclBtn: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  eclLabel: { fontSize: FontSize.sm, fontFamily: Fonts.mono },
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
  formTriggerChevron: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  formTriggerLabel: {
    fontSize: FontSize.xs,
    marginBottom: 1,
  },
  formTriggerValue: {
    fontSize: FontSize.base,
    fontFamily: Fonts.monoMedium,
  },
});
