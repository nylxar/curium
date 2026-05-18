import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";
import {
  QRType,
  URLForm,
  TextForm,
  EmailForm,
  PhoneForm,
  SMSForm,
  WiFiForm,
  ContactForm,
  LocationForm,
} from "@/types/qr";
import { ExpandableField } from "./ExpandableField";

type FormState = {
  url: URLForm;
  text: TextForm;
  email: EmailForm;
  phone: PhoneForm;
  sms: SMSForm;
  wifi: WiFiForm;
  contact: ContactForm;
  location: LocationForm;
};

interface Props {
  visible: boolean;
  onClose: () => void;
  activeType: QRType;
  forms: FormState;
  onUpdateForm: <K extends keyof FormState>(key: K, val: FormState[K]) => void;
  tintColor: string;
}

const TYPE_LABELS: Record<QRType, string> = {
  url: "URL",
  text: "Text",
  email: "Email",
  phone: "Phone",
  sms: "SMS",
  wifi: "Wi-Fi",
  contact: "Contact",
  location: "Location",
};

const TYPE_ICONS: Record<QRType, keyof typeof Ionicons.glyphMap> = {
  url: "link-outline",
  text: "text-outline",
  email: "mail-outline",
  phone: "call-outline",
  sms: "chatbubble-outline",
  wifi: "wifi-outline",
  contact: "person-outline",
  location: "location-outline",
};

export function FormModal({
  visible,
  onClose,
  activeType,
  forms,
  onUpdateForm,
  tintColor,
}: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const renderFields = () => {
    switch (activeType) {
      case "url":
        return (
          <ExpandableField
            label="URL"
            value={forms.url.url}
            onChange={(v: string) => onUpdateForm("url", { url: v })}
            placeholder="https://example.com"
            tintColor={tintColor}
            keyboardType="url"
          />
        );
      case "text":
        return (
          <ExpandableField
            label="Text"
            value={forms.text.text}
            onChange={(v: string) => onUpdateForm("text", { text: v })}
            placeholder="Enter any text..."
            tintColor={tintColor}
            multiline
          />
        );
      case "phone":
        return (
          <ExpandableField
            label="Phone Number"
            value={forms.phone.phone}
            onChange={(v: string) => onUpdateForm("phone", { phone: v })}
            placeholder="+91 00000 00000"
            tintColor={tintColor}
            keyboardType="phone-pad"
          />
        );
      case "email":
        return (
          <View style={{ gap: Spacing.sm }}>
            <ExpandableField
              label="To"
              value={forms.email.to}
              onChange={(v: string) =>
                onUpdateForm("email", { ...forms.email, to: v })
              }
              placeholder="email@example.com"
              tintColor={tintColor}
              keyboardType="email-address"
            />
            <ExpandableField
              label="Subject"
              value={forms.email.subject}
              onChange={(v: string) =>
                onUpdateForm("email", { ...forms.email, subject: v })
              }
              placeholder="Subject line"
              tintColor={tintColor}
            />
            <ExpandableField
              label="Message"
              value={forms.email.body}
              onChange={(v: string) =>
                onUpdateForm("email", { ...forms.email, body: v })
              }
              placeholder="Message body..."
              tintColor={tintColor}
              multiline
            />
          </View>
        );
      case "sms":
        return (
          <View style={{ gap: Spacing.sm }}>
            <ExpandableField
              label="Phone"
              value={forms.sms.phone}
              onChange={(v: string) =>
                onUpdateForm("sms", { ...forms.sms, phone: v })
              }
              placeholder="+91 00000 00000"
              tintColor={tintColor}
              keyboardType="phone-pad"
            />
            <ExpandableField
              label="Message"
              value={forms.sms.message}
              onChange={(v: string) =>
                onUpdateForm("sms", { ...forms.sms, message: v })
              }
              placeholder="Pre-filled message..."
              tintColor={tintColor}
              multiline
            />
          </View>
        );
      case "wifi":
        return (
          <View style={{ gap: Spacing.sm }}>
            <ExpandableField
              label="Network Name (SSID)"
              value={forms.wifi.ssid}
              onChange={(v: string) =>
                onUpdateForm("wifi", { ...forms.wifi, ssid: v })
              }
              placeholder="MyHomeWiFi"
              tintColor={tintColor}
            />
            <ExpandableField
              label="Password"
              value={forms.wifi.password}
              onChange={(v: string) =>
                onUpdateForm("wifi", { ...forms.wifi, password: v })
              }
              placeholder="Wi-Fi password"
              tintColor={tintColor}
              secureTextEntry
            />
            <View style={{ gap: Spacing.xs }}>
              <Text
                style={[
                  styles.segLabel,
                  { color: colors.textMuted, fontFamily: Fonts.mono },
                ]}
              >
                Encryption
              </Text>
              <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                {(["WPA", "WEP", "nopass"] as const).map((enc) => {
                  const active = forms.wifi.encryption === enc;
                  return (
                    <TouchableOpacity
                      key={enc}
                      onPress={() =>
                        onUpdateForm("wifi", { ...forms.wifi, encryption: enc })
                      }
                      style={[
                        styles.segBtn,
                        {
                          flex: 1,
                          backgroundColor: active
                            ? tintColor + "20"
                            : "transparent",
                          borderColor: active ? tintColor : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.segText,
                          {
                            color: active ? tintColor : colors.textMuted,
                            fontFamily: Fonts.mono,
                          },
                        ]}
                      >
                        {enc === "nopass" ? "None" : enc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        );
      case "contact":
        return (
          <View style={{ gap: Spacing.sm }}>
            <ExpandableField
              label="Full Name"
              value={forms.contact.name}
              onChange={(v: string) =>
                onUpdateForm("contact", { ...forms.contact, name: v })
              }
              placeholder="John Doe"
              tintColor={tintColor}
            />
            <ExpandableField
              label="Phone"
              value={forms.contact.phone}
              onChange={(v: string) =>
                onUpdateForm("contact", { ...forms.contact, phone: v })
              }
              placeholder="+91 00000 00000"
              tintColor={tintColor}
              keyboardType="phone-pad"
            />
            <ExpandableField
              label="Email"
              value={forms.contact.email}
              onChange={(v: string) =>
                onUpdateForm("contact", { ...forms.contact, email: v })
              }
              placeholder="email@example.com"
              tintColor={tintColor}
              keyboardType="email-address"
            />
            <ExpandableField
              label="Organization"
              value={forms.contact.org}
              onChange={(v: string) =>
                onUpdateForm("contact", { ...forms.contact, org: v })
              }
              placeholder="Company name"
              tintColor={tintColor}
            />
          </View>
        );
      case "location":
        return (
          <View style={{ gap: Spacing.sm }}>
            <ExpandableField
              label="Latitude"
              value={forms.location.lat}
              onChange={(v: string) =>
                onUpdateForm("location", { ...forms.location, lat: v })
              }
              placeholder="28.6139"
              tintColor={tintColor}
              keyboardType="decimal-pad"
            />
            <ExpandableField
              label="Longitude"
              value={forms.location.lng}
              onChange={(v: string) =>
                onUpdateForm("location", { ...forms.location, lng: v })
              }
              placeholder="77.2090"
              tintColor={tintColor}
              keyboardType="decimal-pad"
            />
            <ExpandableField
              label="Label (optional)"
              value={forms.location.label}
              onChange={(v: string) =>
                onUpdateForm("location", { ...forms.location, label: v })
              }
              placeholder="New Delhi"
              tintColor={tintColor}
            />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: insets.bottom + Spacing.lg,
              borderTopColor: colors.border,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <View style={styles.header}>
            <View
              style={[styles.iconBox, { backgroundColor: tintColor + "18" }]}
            >
              <Ionicons
                name={TYPE_ICONS[activeType]}
                size={18}
                color={tintColor}
              />
            </View>
            <Text
              style={[
                styles.title,
                { color: colors.text, fontFamily: Fonts.monoBold },
              ]}
            >
              {TYPE_LABELS[activeType]}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.doneBtn, { backgroundColor: tintColor }]}
            >
              <Text
                style={[styles.doneBtnText, { fontFamily: Fonts.monoBold }]}
              >
                Done
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ gap: Spacing.sm, paddingBottom: Spacing.lg }}>
              {renderFields()}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "#00000066" },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
    gap: Spacing.md,
    maxHeight: "90%",
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center" },
  header: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { flex: 1, fontSize: FontSize.md },
  doneBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  doneBtnText: { fontSize: FontSize.sm, color: "#fff" },
  segLabel: { fontSize: FontSize.xs },
  segBtn: {
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  segText: { fontSize: FontSize.sm },
});
