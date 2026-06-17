import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, StyleSheet, TextInput, Keyboard } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";
import {
  Template,
  loadTemplates,
  saveTemplate,
  deleteTemplate,
} from "@/services/templates";
import { QRStyle } from "@/types/qr";
import { useToast } from "@/components/ui/Toast";

interface Props {
  currentStyle: QRStyle;
  onLoad: (style: QRStyle) => void;
}

export function TemplateSelector({ currentStyle, onLoad }: Props) {
  const { colors } = useTheme();
  const toast = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [saving, setSaving] = useState(false);
  const nameRef = useRef("");

  useEffect(() => {
    loadTemplates().then(setTemplates);
  }, []);

  const handleSave = useCallback(() => {
    const name = nameRef.current.trim();
    if (!name) return;
    nameRef.current = "";
    Keyboard.dismiss();

    let didHide = false;
    const sub = Keyboard.addListener("keyboardDidHide", () => {
      didHide = true;
      setSaving(false);
      sub.remove();
    });

    // Fallback in case keyboard is already hidden or listener fails
    setTimeout(() => {
      if (!didHide) {
        setSaving(false);
        sub.remove();
      }
    }, 250);

    saveTemplate(name, currentStyle).then((updated) => {
      setTemplates(updated);
      toast.success("Saved", "Template saved.");
    });
  }, [currentStyle]);

  const handleDelete = useCallback((id: string, name: string) => {
    toast.confirm(
      "Delete template",
      `Delete "${name}"?`,
      async () => {
        const updated = await deleteTemplate(id);
        setTemplates(updated);
      },
      "Delete",
      true,
    );
  }, []);

  return (
    <View>
      {/* Save current style */}
      {saving ? (
        <View style={[styles.saveRow]}>
          <TextInput
            style={[
              styles.nameInput,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              },
            ]}
            placeholder="Template name..."
            placeholderTextColor={colors.textFaint}
            defaultValue=""
            onChangeText={(t) => {
              nameRef.current = t;
            }}
            autoFocus
            blurOnSubmit={false}
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.6}
            onPress={handleSave}
          >
            <Text style={[styles.saveBtnText, { color: colors.bg }]}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: colors.border }]}
            onPress={() => {
              nameRef.current = "";
              Keyboard.dismiss();
              let didHide = false;
              const sub = Keyboard.addListener("keyboardDidHide", () => {
                didHide = true;
                setSaving(false);
                sub.remove();
              });
              setTimeout(() => {
                if (!didHide) {
                  setSaving(false);
                  sub.remove();
                }
              }, 250);
            }}
          >
            <Ionicons name="close" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.addRow, { borderColor: colors.border }]}
          onPress={() => setSaving(true)}
        >
          <Ionicons
            name="add-circle-outline"
            size={18}
            color={colors.primary}
          />
          <Text style={[styles.addRowText, { color: colors.primary }]}>
            Save current style as template
          </Text>
        </TouchableOpacity>
      )}

      {/* Template list */}
      {templates.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.textFaint }]}>
            No templates saved yet
          </Text>
        </View>
      ) : (
        templates.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.templateRow, { borderBottomColor: colors.border }]}
            onPress={() => onLoad(t.qrStyle)}
            onLongPress={() => handleDelete(t.id, t.name)}
          >
            <View style={styles.templateInfo}>
              <View style={styles.colorPreview}>
                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: t.qrStyle.fgColor },
                  ]}
                />
                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: t.qrStyle.bgColor },
                  ]}
                />
              </View>
              <View>
                <Text
                  style={[styles.templateName, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {t.name}
                </Text>
                <Text
                  style={[styles.templateMeta, { color: colors.textFaint }]}
                >
                  {t.qrStyle.eyeShape} eye · {t.qrStyle.pixelShape} pixel
                </Text>
              </View>
            </View>
            <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
    borderStyle: "dashed",
    marginBottom: Spacing.sm,
  },
  addRowText: {
    fontSize: FontSize.sm,
    fontFamily: Fonts.mono,
  },
  saveRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderWidth: 0,
    borderRadius: Radius.md,
  },
  nameInput: {
    flex: 1,
    fontSize: FontSize.sm,
    fontFamily: Fonts.mono,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.sm,
  },
  saveBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  saveBtnText: {
    fontSize: FontSize.sm,
    fontFamily: Fonts.monoBold,
  },
  cancelBtn: {
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  templateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  templateInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  colorPreview: {
    flexDirection: "row",
    gap: 2,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#00000018",
  },
  templateName: {
    fontSize: FontSize.sm,
    fontFamily: Fonts.monoMedium,
  },
  templateMeta: {
    fontSize: FontSize.xs,
    fontFamily: Fonts.mono,
    marginTop: 2,
  },
  empty: {
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  emptyText: {
    fontSize: FontSize.xs,
    fontFamily: Fonts.mono,
  },
});
