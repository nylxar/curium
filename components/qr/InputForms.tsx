import { View, Text, TextInput, StyleSheet, Switch } from "react-native";
import {
  URLForm,
  TextForm,
  EmailForm,
  PhoneForm,
  SMSForm,
  WiFiForm,
  ContactForm,
  LocationForm,
  QRType,
} from "@/types/qr";
import { Colors, Radius, FontSize, Spacing } from "@/constants/theme";

// ─── Shared input component ───────────────────────────────────────────────────
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
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: tintColor + "bb" }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMulti,
          { borderColor: tintColor + "35", color: tintColor },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={tintColor + "50"}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

// ─── URL ──────────────────────────────────────────────────────────────────────
export function URLFormView({
  form,
  onChange,
  tintColor,
}: {
  form: URLForm;
  onChange: (f: URLForm) => void;
  tintColor: string;
}) {
  return (
    <Field
      label="URL"
      tintColor={tintColor}
      value={form.url}
      onChange={(v) => onChange({ url: v })}
      placeholder="https://example.com"
      keyboardType="url"
    />
  );
}

// ─── Text ─────────────────────────────────────────────────────────────────────
export function TextFormView({
  form,
  onChange,
  tintColor,
}: {
  form: TextForm;
  onChange: (f: TextForm) => void;
  tintColor: string;
}) {
  return (
    <Field
      label="Text"
      tintColor={tintColor}
      value={form.text}
      onChange={(v) => onChange({ text: v })}
      placeholder="Enter any text..."
      multiline
    />
  );
}

// ─── Email ────────────────────────────────────────────────────────────────────
export function EmailFormView({
  form,
  onChange,
  tintColor,
}: {
  form: EmailForm;
  onChange: (f: EmailForm) => void;
  tintColor: string;
}) {
  return (
    <View style={styles.formGroup}>
      <Field
        label="To"
        tintColor={tintColor}
        value={form.to}
        onChange={(v) => onChange({ ...form, to: v })}
        placeholder="email@example.com"
        keyboardType="email-address"
      />
      <Field
        label="Subject"
        tintColor={tintColor}
        value={form.subject}
        onChange={(v) => onChange({ ...form, subject: v })}
        placeholder="Subject"
      />
      <Field
        label="Body"
        tintColor={tintColor}
        value={form.body}
        onChange={(v) => onChange({ ...form, body: v })}
        placeholder="Message body..."
        multiline
      />
    </View>
  );
}

// ─── Phone ────────────────────────────────────────────────────────────────────
export function PhoneFormView({
  form,
  onChange,
  tintColor,
}: {
  form: PhoneForm;
  onChange: (f: PhoneForm) => void;
  tintColor: string;
}) {
  return (
    <Field
      label="Phone Number"
      tintColor={tintColor}
      value={form.phone}
      onChange={(v) => onChange({ phone: v })}
      placeholder="+91 00000 00000"
      keyboardType="phone-pad"
    />
  );
}

// ─── SMS ──────────────────────────────────────────────────────────────────────
export function SMSFormView({
  form,
  onChange,
  tintColor,
}: {
  form: SMSForm;
  onChange: (f: SMSForm) => void;
  tintColor: string;
}) {
  return (
    <View style={styles.formGroup}>
      <Field
        label="Phone Number"
        tintColor={tintColor}
        value={form.phone}
        onChange={(v) => onChange({ ...form, phone: v })}
        placeholder="+91 00000 00000"
        keyboardType="phone-pad"
      />
      <Field
        label="Message"
        tintColor={tintColor}
        value={form.message}
        onChange={(v) => onChange({ ...form, message: v })}
        placeholder="Pre-filled message..."
        multiline
      />
    </View>
  );
}

// ─── WiFi ─────────────────────────────────────────────────────────────────────
export function WiFiFormView({
  form,
  onChange,
  tintColor,
}: {
  form: WiFiForm;
  onChange: (f: WiFiForm) => void;
  tintColor: string;
}) {
  return (
    <View style={styles.formGroup}>
      <Field
        label="Network Name (SSID)"
        tintColor={tintColor}
        value={form.ssid}
        onChange={(v) => onChange({ ...form, ssid: v })}
        placeholder="MyHomeWiFi"
      />
      <Field
        label="Password"
        tintColor={tintColor}
        value={form.password}
        onChange={(v) => onChange({ ...form, password: v })}
        placeholder="Password"
        secureTextEntry
      />
      <View style={styles.fieldWrap}>
        <Text style={styles.label}>Encryption</Text>
        <View style={styles.segRow}>
          {(["WPA", "WEP", "nopass"] as const).map((enc) => (
            <View
              key={enc}
              style={[styles.seg, form.encryption === enc && styles.segActive]}
            >
              <Text
                onPress={() => onChange({ ...form, encryption: enc })}
                style={[
                  styles.segLabel,
                  form.encryption === enc && styles.segLabelActive,
                ]}
              >
                {enc === "nopass" ? "None" : enc}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Contact ──────────────────────────────────────────────────────────────────
export function ContactFormView({
  form,
  onChange,
  tintColor,
}: {
  form: ContactForm;
  onChange: (f: ContactForm) => void;
  tintColor: string;
}) {
  return (
    <View style={styles.formGroup}>
      <Field
        label="Full Name"
        tintColor={tintColor}
        value={form.name}
        onChange={(v) => onChange({ ...form, name: v })}
        placeholder="John Doe"
      />
      <Field
        label="Phone"
        tintColor={tintColor}
        value={form.phone}
        onChange={(v) => onChange({ ...form, phone: v })}
        placeholder="+91 00000 00000"
        keyboardType="phone-pad"
      />
      <Field
        label="Email"
        tintColor={tintColor}
        value={form.email}
        onChange={(v) => onChange({ ...form, email: v })}
        placeholder="email@example.com"
        keyboardType="email-address"
      />
      <Field
        label="Organisation"
        tintColor={tintColor}
        value={form.org}
        onChange={(v) => onChange({ ...form, org: v })}
        placeholder="Company name"
      />
    </View>
  );
}

// ─── Location ─────────────────────────────────────────────────────────────────
export function LocationFormView({
  form,
  onChange,
  tintColor,
}: {
  form: LocationForm;
  onChange: (f: LocationForm) => void;
  tintColor: string;
}) {
  return (
    <View style={styles.formGroup}>
      <Field
        label="Latitude"
        tintColor={tintColor}
        value={form.lat}
        onChange={(v) => onChange({ ...form, lat: v })}
        placeholder="28.6139"
        keyboardType="decimal-pad"
      />
      <Field
        label="Longitude"
        tintColor={tintColor}
        value={form.lng}
        onChange={(v) => onChange({ ...form, lng: v })}
        placeholder="77.2090"
        keyboardType="decimal-pad"
      />
      <Field
        label="Label (optional)"
        tintColor={tintColor}
        value={form.label}
        onChange={(v) => onChange({ ...form, label: v })}
        placeholder="New Delhi"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  formGroup: { gap: Spacing.sm },
  fieldWrap: { gap: Spacing.xs },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: "500",
    marginLeft: 2,
  },
  input: {
    backgroundColor: Colors.surfaceOffset,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.base,
    color: Colors.text,
  },
  inputMulti: {
    height: 90,
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
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceOffset,
  },
  segActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryBg },
  segLabel: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  segLabelActive: { color: Colors.primary },
});
