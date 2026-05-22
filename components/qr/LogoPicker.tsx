import React, { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";

interface LogoPickerProps {
  currentUri?: string;
  tintColor:   string;
  onSelect:    (uri: string | undefined) => void;
}

export function LogoPicker({ currentUri, tintColor, onSelect }: LogoPickerProps) {
  const { colors } = useTheme();

  const pickLogo = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo library access to pick a logo.");
      return;
    }
    await new Promise((r) => setTimeout(r, 150));
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSelect(result.assets[0].uri);
      }
    } catch (err) {
      console.warn(err);
    }
  }, [onSelect]);

  const removeLogo = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(undefined);
  }, [onSelect]);

  if (currentUri) {
    return (
      <View style={styles.previewRow}>
        <Image
          source={{ uri: currentUri }}
          style={[styles.preview, { borderColor: colors.border }]}
          resizeMode="cover"
        />
        <View style={styles.previewActions}>
          <TouchableOpacity
            onPress={pickLogo}
            style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.bg }]}
            activeOpacity={0.75}
          >
            <Ionicons name="repeat-outline" size={16} color={colors.text} />
            <Text style={[styles.actionBtnLabel, { color: colors.text, fontFamily: Fonts.mono }]}>
              Change
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={removeLogo}
            style={[styles.actionBtn, styles.actionBtnDestructive, { borderColor: "#f87171" }]}
            activeOpacity={0.75}
          >
            <Ionicons name="trash-outline" size={16} color="#f87171" />
            <Text style={[styles.actionBtnLabel, { color: "#f87171", fontFamily: Fonts.mono }]}>
              Remove
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={pickLogo}
      activeOpacity={0.75}
      style={[
        styles.pickBtn,
        {
          borderColor: tintColor + "55",
          backgroundColor: tintColor + "0D",
        },
      ]}
    >
      <Ionicons name="image-outline" size={24} color={tintColor} />
      <View style={styles.pickBtnText}>
        <Text style={[styles.pickBtnTitle, { color: colors.text, fontFamily: Fonts.mono }]}>
          Add Logo
        </Text>
        <Text style={[styles.pickBtnSub, { color: colors.textMuted, fontFamily: Fonts.mono }]}>
          Square image recommended
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Preview state
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  preview: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  previewActions: {
    flex: 1,
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  actionBtnDestructive: {},
  actionBtnLabel: { fontSize: FontSize.sm, fontWeight: "600" },

  // Empty state
  pickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  pickBtnText:  { flex: 1, gap: 2 },
  pickBtnTitle: { fontSize: FontSize.sm, fontWeight: "600" },
  pickBtnSub:   { fontSize: FontSize.xs },
});
