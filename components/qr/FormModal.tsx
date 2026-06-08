import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";
import { AnimatedSheet } from "@/components/ui/AnimatedSheet";
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

const TYPE_META: Record<
  QRType,
  { label: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  url: { label: "URL", icon: "link-outline" },
  text: { label: "Text", icon: "text-outline" },
  email: { label: "Email", icon: "mail-outline" },
  phone: { label: "Phone", icon: "call-outline" },
  sms: { label: "SMS", icon: "chatbubble-outline" },
  wifi: { label: "Wi-Fi", icon: "wifi-outline" },
  contact: { label: "Contact", icon: "person-outline" },
  location: { label: "Location", icon: "location-outline" },
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  tintColor,
  keyboardType = "default",
  secureTextEntry = false,
  multiline = false,
  autoFocus = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  tintColor: string;
  keyboardType?:
    | "default"
    | "email-address"
    | "phone-pad"
    | "decimal-pad"
    | "url";
  secureTextEntry?: boolean;
  multiline?: boolean;
  autoFocus?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={fStyles.wrap}>
      <Text
        style={[
          fStyles.label,
          { color: colors.textMuted, fontFamily: Fonts.mono },
        ]}
      >
        {label}
      </Text>
      <TextInput
        style={[
          fStyles.input,
          {
            backgroundColor: colors.surfaceOffset,
            borderColor: colors.border,
            color: colors.text,
            fontFamily: Fonts.mono,
            height: multiline ? 88 : 48,
          },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        textAlignVertical={multiline ? "top" : "center"}
        selectionColor={tintColor}
      />
    </View>
  );
}

const fStyles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: FontSize.xs, marginLeft: 2 },
  input: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.base,
    paddingTop: Spacing.sm,
  },
});

export function FormModal({
  visible,
  onClose,
  activeType,
  forms,
  onUpdateForm,
  tintColor,
}: Props) {
  const { colors } = useTheme();
  const meta = TYPE_META[activeType];

  const handleDone = () => {
    // Wait for the keyboard to fully dismiss before closing the sheet,
    // so the two animations don't fight each other and cause a shutter.
    const sub = Keyboard.addListener("keyboardDidHide", () => {
      sub.remove();
      onClose();
    });
    Keyboard.dismiss();
  };

  const renderFields = () => {
    switch (activeType) {
      case "url":
        return (
          <Field
            label="URL"
            value={forms.url.url}
            tintColor={tintColor}
            onChange={(v) => onUpdateForm("url", { url: v })}
            placeholder="https://example.com"
            keyboardType="url"
            autoFocus
          />
        );
      case "text":
        return (
          <Field
            label="Text"
            value={forms.text.text}
            tintColor={tintColor}
            onChange={(v) => onUpdateForm("text", { text: v })}
            placeholder="Enter any text..."
            multiline
            autoFocus
          />
        );
      case "phone":
        return (
          <Field
            label="Phone Number"
            value={forms.phone.phone}
            tintColor={tintColor}
            onChange={(v) => onUpdateForm("phone", { phone: v })}
            placeholder="+91 00000 00000"
            keyboardType="phone-pad"
            autoFocus
          />
        );
      case "email":
        return (
          <View style={{ gap: Spacing.sm }}>
            <Field
              label="To"
              value={forms.email.to}
              tintColor={tintColor}
              onChange={(v) => onUpdateForm("email", { ...forms.email, to: v })}
              placeholder="email@example.com"
              keyboardType="email-address"
              autoFocus
            />
            <Field
              label="Subject"
              value={forms.email.subject}
              tintColor={tintColor}
              onChange={(v) =>
                onUpdateForm("email", { ...forms.email, subject: v })
              }
              placeholder="Subject line"
            />
            <Field
              label="Message"
              value={forms.email.body}
              tintColor={tintColor}
              onChange={(v) =>
                onUpdateForm("email", { ...forms.email, body: v })
              }
              placeholder="Message body..."
              multiline
            />
          </View>
        );
      case "sms":
        return (
          <View style={{ gap: Spacing.sm }}>
            <Field
              label="Phone"
              value={forms.sms.phone}
              tintColor={tintColor}
              onChange={(v) => onUpdateForm("sms", { ...forms.sms, phone: v })}
              placeholder="+91 00000 00000"
              keyboardType="phone-pad"
              autoFocus
            />
            <Field
              label="Message"
              value={forms.sms.message}
              tintColor={tintColor}
              onChange={(v) =>
                onUpdateForm("sms", { ...forms.sms, message: v })
              }
              placeholder="Pre-filled message..."
              multiline
            />
          </View>
        );
      case "wifi":
        return (
          <View style={{ gap: Spacing.sm }}>
            <Field
              label="Network Name (SSID)"
              value={forms.wifi.ssid}
              tintColor={tintColor}
              onChange={(v) => onUpdateForm("wifi", { ...forms.wifi, ssid: v })}
              placeholder="MyHomeWiFi"
              autoFocus
            />
            <Field
              label="Password"
              value={forms.wifi.password}
              tintColor={tintColor}
              onChange={(v) =>
                onUpdateForm("wifi", { ...forms.wifi, password: v })
              }
              placeholder="Wi-Fi password"
              secureTextEntry
            />
            <View style={{ gap: 6 }}>
              <Text
                style={[
                  fStyles.label,
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
                        mStyles.segBtn,
                        {
                          flex: 1,
                          backgroundColor: active
                            ? tintColor + "20"
                            : colors.surfaceOffset,
                          borderColor: active ? tintColor : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          mStyles.segText,
                          {
                            color: active ? tintColor : colors.textMuted,
                            fontFamily: Fonts.mono,
                            fontWeight: active ? "700" : "400",
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
            <Field
              label="Full Name"
              value={forms.contact.name}
              tintColor={tintColor}
              onChange={(v) =>
                onUpdateForm("contact", { ...forms.contact, name: v })
              }
              placeholder="John Doe"
              autoFocus
            />
            <Field
              label="Phone"
              value={forms.contact.phone}
              tintColor={tintColor}
              onChange={(v) =>
                onUpdateForm("contact", { ...forms.contact, phone: v })
              }
              placeholder="+91 00000 00000"
              keyboardType="phone-pad"
            />
            <Field
              label="Email"
              value={forms.contact.email}
              tintColor={tintColor}
              onChange={(v) =>
                onUpdateForm("contact", { ...forms.contact, email: v })
              }
              placeholder="email@example.com"
              keyboardType="email-address"
            />
            <Field
              label="Organization"
              value={forms.contact.org}
              tintColor={tintColor}
              onChange={(v) =>
                onUpdateForm("contact", { ...forms.contact, org: v })
              }
              placeholder="Company name"
            />
          </View>
        );
      case "location":
        return (
          <View style={{ gap: Spacing.sm }}>
            <View style={{ flexDirection: "row", gap: Spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Field
                  label="Latitude"
                  value={forms.location.lat}
                  tintColor={tintColor}
                  onChange={(v) =>
                    onUpdateForm("location", { ...forms.location, lat: v })
                  }
                  placeholder="28.6139"
                  keyboardType="decimal-pad"
                  autoFocus
                />
              </View>
              <View style={{ flex: 1 }}>
                <Field
                  label="Longitude"
                  value={forms.location.lng}
                  tintColor={tintColor}
                  onChange={(v) =>
                    onUpdateForm("location", { ...forms.location, lng: v })
                  }
                  placeholder="77.2090"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            <Field
              label="Label (optional)"
              value={forms.location.label}
              tintColor={tintColor}
              onChange={(v) =>
                onUpdateForm("location", { ...forms.location, label: v })
              }
              placeholder="New Delhi"
            />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <AnimatedSheet
      visible={visible}
      onClose={onClose}
      bgColor={colors.surface}
      borderColor={colors.border}
      disableSwipeDown
    >
      <View style={mStyles.header}>
        <View style={[mStyles.iconBox, { backgroundColor: tintColor + "18" }]}>
          <Ionicons name={meta.icon} size={18} color={tintColor} />
        </View>
        <Text
          style={[
            mStyles.title,
            { color: colors.text, fontFamily: Fonts.monoBold },
          ]}
        >
          {meta.label}
        </Text>
        <TouchableOpacity
          onPress={handleDone}
          style={[mStyles.doneBtn, { backgroundColor: tintColor }]}
          activeOpacity={0.7}
        >
          <Text
            style={[mStyles.doneBtnText, { fontFamily: Fonts.monoBold }]}
          >
            Done
          </Text>
        </TouchableOpacity>
      </View>
      <View style={{ gap: Spacing.sm }}>{renderFields()}</View>
    </AnimatedSheet>
  );
}

const mStyles = StyleSheet.create({
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
    paddingHorizontal: Spacing.md + 4,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  doneBtnText: { fontSize: FontSize.sm, color: "#fff" },
  segBtn: {
    paddingVertical: Spacing.sm + 2,
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  segText: { fontSize: FontSize.sm },
});
