import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import {
  URLForm,
  TextForm,
  EmailForm,
  PhoneForm,
  SMSForm,
  WiFiForm,
  ContactForm,
  LocationForm,
} from "@/types/qr";
import { Radius, FontSize, Spacing, Fonts } from "@/constants/theme";
import { ExpandableField } from "./ExpandableField";
import { useTheme } from "@/context/ThemeContext";

// At top of InputForms.tsx — add explicit interfaces:

interface URLFormProps {
  form: URLForm;
  onChange: (f: URLForm) => void;
  tintColor: string;
}

interface TextFormProps {
  form: TextForm;
  onChange: (f: TextForm) => void;
  tintColor: string;
}

interface EmailFormProps {
  form: EmailForm;
  onChange: (f: EmailForm) => void;
  tintColor: string;
}

interface PhoneFormProps {
  form: PhoneForm;
  onChange: (f: PhoneForm) => void;
  tintColor: string;
}

interface SMSFormProps {
  form: SMSForm;
  onChange: (f: SMSForm) => void;
  tintColor: string;
}

interface WiFiFormProps {
  form: WiFiForm;
  onChange: (f: WiFiForm) => void;
  tintColor: string;
}

interface ContactFormProps {
  form: ContactForm;
  onChange: (f: ContactForm) => void;
  tintColor: string;
}

interface LocationFormProps {
  form: LocationForm;
  onChange: (f: LocationForm) => void;
  tintColor: string;
}

// ─── Shared Field ─────────────────────────────────────────────────────────────
function Field({
  label,
  tintColor,
  value,
  onChange,
  placeholder,
  keyboardType = "default",
  secureTextEntry = false,
  multiline = false,
}: {
  label: string;
  tintColor: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?:
    | "default"
    | "email-address"
    | "phone-pad"
    | "decimal-pad"
    | "url";
  secureTextEntry?: boolean;
  multiline?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.fieldWrap}>
      <Text
        style={[
          styles.label,
          { color: colors.textMuted, fontFamily: Fonts.mono },
        ]}
      >
        {label}
      </Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMulti,
          {
            backgroundColor: colors.surfaceOffset,
            borderColor: colors.border,
            color: colors.text,
            fontFamily: Fonts.mono,
          },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

// components/qr/InputForms.tsx — ALL forms use ExpandableField only

// Single-field forms — one ExpandableField:
export function URLFormView({ form, onChange, tintColor }: URLFormProps) {
  return (
    <ExpandableField
      label="URL"
      tintColor={tintColor}
      value={form.url}
      onChange={(v: string) => onChange({ url: v })}
      placeholder="https://example.com"
      keyboardType="url"
    />
  );
}

export function TextFormView({ form, onChange, tintColor }: TextFormProps) {
  return (
    <ExpandableField
      label="Text"
      tintColor={tintColor}
      value={form.text}
      onChange={(v: string) => onChange({ text: v })}
      placeholder="Enter any text..."
      multiline
    />
  );
}

export function PhoneFormView({ form, onChange, tintColor }: PhoneFormProps) {
  return (
    <ExpandableField
      label="Phone Number"
      tintColor={tintColor}
      value={form.phone}
      onChange={(v: string) => onChange({ phone: v })}
      placeholder="+91 00000 00000"
      keyboardType="phone-pad"
    />
  );
}

// Multi-field forms — one ExpandableField per field, stacked:
export function EmailFormView({ form, onChange, tintColor }: EmailFormProps) {
  return (
    <View style={{ gap: Spacing.sm }}>
      <ExpandableField
        label="To"
        tintColor={tintColor}
        value={form.to}
        onChange={(v: string) => onChange({ ...form, to: v })}
        placeholder="email@example.com"
        keyboardType="email-address"
      />
      <ExpandableField
        label="Subject"
        tintColor={tintColor}
        value={form.subject}
        onChange={(v: string) => onChange({ ...form, subject: v })}
        placeholder="Subject line"
      />
      <ExpandableField
        label="Message"
        tintColor={tintColor}
        value={form.body}
        onChange={(v: string) => onChange({ ...form, body: v })}
        placeholder="Message body..."
        multiline
      />
    </View>
  );
}

export function SMSFormView({ form, onChange, tintColor }: SMSFormProps) {
  return (
    <View style={{ gap: Spacing.sm }}>
      <ExpandableField
        label="Phone"
        tintColor={tintColor}
        value={form.phone}
        onChange={(v: string) => onChange({ ...form, phone: v })}
        placeholder="+91 00000 00000"
        keyboardType="phone-pad"
      />
      <ExpandableField
        label="Message"
        tintColor={tintColor}
        value={form.message}
        onChange={(v: string) => onChange({ ...form, message: v })}
        placeholder="Pre-filled message..."
        multiline
      />
    </View>
  );
}

export function WiFiFormView({ form, onChange, tintColor }: WiFiFormProps) {
  return (
    <View style={{ gap: Spacing.sm }}>
      <ExpandableField
        label="Network Name (SSID)"
        tintColor={tintColor}
        value={form.ssid}
        onChange={(v: string) => onChange({ ...form, ssid: v })}
        placeholder="MyHomeWiFi"
      />
      <ExpandableField
        label="Password"
        tintColor={tintColor}
        value={form.password}
        onChange={(v: string) => onChange({ ...form, password: v })}
        placeholder="Wi-Fi password"
        secureTextEntry
      />
      {/* Encryption — segmented control, not expandable */}
      <View style={{ flexDirection: "row", gap: Spacing.sm }}>
        {(["WPA", "WEP", "nopass"] as const).map((enc) => {
          const active = form.encryption === enc;
          return (
            <TouchableOpacity
              key={enc}
              onPress={() => onChange({ ...form, encryption: enc })}
              style={{
                flex: 1,
                paddingVertical: Spacing.sm,
                alignItems: "center",
                borderRadius: Radius.md,
                borderWidth: 1,
                backgroundColor: active ? tintColor + "20" : "transparent",
                borderColor: active ? tintColor : "#ccc",
              }}
            >
              <Text
                style={{
                  fontSize: FontSize.sm,
                  fontFamily: Fonts.mono,
                  color: active ? tintColor : "#888",
                }}
              >
                {enc === "nopass" ? "None" : enc}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export function ContactFormView({
  form,
  onChange,
  tintColor,
}: ContactFormProps) {
  return (
    <View style={{ gap: Spacing.sm }}>
      <ExpandableField
        label="Full Name"
        tintColor={tintColor}
        value={form.name}
        onChange={(v: string) => onChange({ ...form, name: v })}
        placeholder="John Doe"
      />
      <ExpandableField
        label="Phone"
        tintColor={tintColor}
        value={form.phone}
        onChange={(v: string) => onChange({ ...form, phone: v })}
        placeholder="+91 00000 00000"
        keyboardType="phone-pad"
      />
      <ExpandableField
        label="Email"
        tintColor={tintColor}
        value={form.email}
        onChange={(v: string) => onChange({ ...form, email: v })}
        placeholder="email@example.com"
        keyboardType="email-address"
      />
      <ExpandableField
        label="Organization"
        tintColor={tintColor}
        value={form.org}
        onChange={(v: string) => onChange({ ...form, org: v })}
        placeholder="Company name"
      />
    </View>
  );
}

export function LocationFormView({
  form,
  onChange,
  tintColor,
}: LocationFormProps) {
  return (
    <View style={{ gap: Spacing.sm }}>
      <ExpandableField
        label="Latitude"
        tintColor={tintColor}
        value={form.lat}
        onChange={(v: string) => onChange({ ...form, lat: v })}
        placeholder="28.6139"
        keyboardType="decimal-pad"
      />
      <ExpandableField
        label="Longitude"
        tintColor={tintColor}
        value={form.lng}
        onChange={(v: string) => onChange({ ...form, lng: v })}
        placeholder="77.2090"
        keyboardType="decimal-pad"
      />
      <ExpandableField
        label="Label (optional)"
        tintColor={tintColor}
        value={form.label}
        onChange={(v: string) => onChange({ ...form, label: v })}
        placeholder="New Delhi"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  formGroup: { gap: Spacing.sm },
  fieldWrap: { gap: Spacing.xs },
  label: { fontSize: FontSize.xs, marginLeft: 2 },
  input: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.sm,
  },
  inputMulti: {
    height: 88,
    textAlignVertical: "top",
    paddingTop: Spacing.sm + 2,
  },
  segRow: { flexDirection: "row", gap: Spacing.sm },
  seg: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  segLabel: { fontSize: FontSize.sm },
});
