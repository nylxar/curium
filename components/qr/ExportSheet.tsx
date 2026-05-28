import { useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import * as MediaLibrary from "expo-media-library";
import { File } from "expo-file-system";
import * as FileSystemLegacy from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { captureRef } from "react-native-view-shot";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { OptionSheet } from "./OptionSheet";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";

interface ExportAction {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub: string;
  onPress: () => void;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  qrRef: React.RefObject<View | null>;
  qrValue: string;
  tintColor: string;
  bgColor: string;
}

export function ExportSheet({
  visible,
  onClose,
  qrRef,
  qrValue,
  tintColor,
  bgColor,
}: Props) {
  const saveToGallery = async () => {
    if (!qrRef.current) return;
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Allow media access to save QR to gallery.",
        );
        return;
      }
      const uri = await captureRef(qrRef, { format: "png", quality: 1 });
      await MediaLibrary.saveToLibraryAsync(uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Saved!", "QR saved to your gallery.");
      onClose();
    } catch {
      Alert.alert("Error", "Could not save to gallery.");
    }
  };

  const saveAsSVG = async () => {
    try {
      const filename = `curium_qr_${Date.now()}.txt`;
      const uri = FileSystemLegacy.cacheDirectory + filename; // get URI from legacy
      const file = new File(uri); // create File from URI
      await file.write(qrValue);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "text/plain",
          dialogTitle: "Export QR Content",
        });
      }
      onClose();
    } catch (e) {
      console.error("Export error:", e); // now you'll see the real error
      Alert.alert("Error", "Could not export file.");
    }
  };

  const shareImage = async () => {
    if (!qrRef.current) return;
    try {
      const uri = await captureRef(qrRef, { format: "png", quality: 1 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "image/png" });
      }
      onClose();
    } catch {
      Alert.alert("Error", "Could not share.");
    }
  };

  const copyText = async () => {
    await Clipboard.setStringAsync(qrValue);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Copied!", "QR content copied to clipboard.");
    onClose();
  };

  const ACTIONS: ExportAction[] = [
    {
      icon: "image-outline",
      label: "Save to Gallery",
      sub: "PNG \u00b7 High quality",
      onPress: saveToGallery,
    },
    {
      icon: "share-outline",
      label: "Share Image",
      sub: "Share via any app",
      onPress: shareImage,
    },
    {
      icon: "copy-outline",
      label: "Copy Content",
      sub: "Copy QR text to clipboard",
      onPress: copyText,
    },
    {
      icon: "document-text-outline",
      label: "Export Data",
      sub: "Save QR content as file",
      onPress: saveAsSVG,
    },
  ];

  return (
    <OptionSheet
      visible={visible}
      onClose={onClose}
      title="Export QR"
      tintColor={tintColor}
      bgColor={bgColor}
    >
      {ACTIONS.map((action, i) => (
        <Animated.View
          key={i}
          entering={FadeInDown.delay(i * 60 + 100).duration(300)}
        >
          <TouchableOpacity
            style={[styles.row, { borderColor: tintColor + "20" }]}
            onPress={action.onPress}
            activeOpacity={0.7}
          >
            <View
              style={[styles.iconWrap, { backgroundColor: tintColor + "18" }]}
            >
              <Ionicons name={action.icon} size={20} color={tintColor} />
            </View>
            <View style={styles.text}>
              <Text style={[styles.label, { color: tintColor, fontFamily: Fonts.mono }]}>
                {action.label}
              </Text>
              <Text style={[styles.sub, { color: tintColor + "70", fontFamily: Fonts.mono }]}>
                {action.sub}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={tintColor + "40"} />
          </TouchableOpacity>
        </Animated.View>
      ))}
    </OptionSheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1 },
  label: { fontSize: FontSize.base, fontWeight: "600" },
  sub: { fontSize: FontSize.xs, marginTop: 2 },
});
