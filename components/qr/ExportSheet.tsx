import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Asset, requestPermissionsAsync } from "expo-media-library";
import { File } from "expo-file-system";
import * as FileSystemLegacy from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { captureRef } from "react-native-view-shot";
import { Ionicons } from "@expo/vector-icons";
import { OptionSheet } from "./OptionSheet";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/components/ui/Toast";

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
}

export function ExportSheet({ visible, onClose, qrRef, qrValue }: Props) {
  const { colors } = useTheme();
  const toast = useToast();

  const saveToGallery = async () => {
    if (!qrRef.current) return;
    try {
      const { status } = await requestPermissionsAsync(true);
      if (status !== "granted") {
        toast.warning(
          "Permission needed",
          "Allow media access to save QR to gallery.",
        );
        return;
      }
      await new Promise<void>((r) => setTimeout(r, 200));
      const tmpUri = await captureRef(qrRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });
      const dest =
        FileSystemLegacy.documentDirectory + `curium_qr_${Date.now()}.png`;
      const srcFile = new File(tmpUri);
      const destFile = new File(dest);
      await srcFile.copy(destFile);
      await Asset.create(destFile.uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success("Saved!", "QR saved to your gallery.");
      onClose();
    } catch (e) {
      console.error("Save error:", e);
      toast.error("Error", "Could not save to gallery.");
    }
  };

  const saveAsSVG = async () => {
    try {
      const filename = `curium_qr_${Date.now()}.txt`;
      const uri = FileSystemLegacy.cacheDirectory + filename;
      const file = new File(uri);
      await file.write(qrValue);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "text/plain",
          dialogTitle: "Export QR Content",
        });
      }
      onClose();
    } catch (e) {
      console.error("Export error:", e);
      toast.error("Error", "Could not export file.");
    }
  };

  const shareImage = async () => {
    if (!qrRef.current) return;
    try {
      await new Promise<void>((r) => setTimeout(r, 200));
      const tmpUri = await captureRef(qrRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });
      const dest =
        FileSystemLegacy.documentDirectory + `curium_qr_${Date.now()}.png`;
      const srcFile = new File(tmpUri);
      const destFile = new File(dest);
      await srcFile.copy(destFile);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(destFile.uri, { mimeType: "image/png" });
      }
      onClose();
    } catch {
      toast.error("Error", "Could not share.");
    }
  };

  const copyText = async () => {
    await Clipboard.setStringAsync(qrValue);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.success("Copied!", "QR content copied to clipboard.");
    onClose();
  };

  const ACTIONS: ExportAction[] = [
    {
      icon: "image-outline",
      label: "Save to Gallery",
      sub: "PNG · High quality",
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
      iconName="share-outline"
    >
      {ACTIONS.map((action, i) => (
        <TouchableOpacity
          key={i}
          style={[styles.row, { borderBottomColor: colors.border }]}
          onPress={action.onPress}
          activeOpacity={0.7}
        >
          <View
            style={[styles.iconWrap, { backgroundColor: colors.primary + "18" }]}
          >
            <Ionicons name={action.icon} size={20} color={colors.primary} />
          </View>
          <View style={styles.text}>
            <Text style={[styles.label, { color: colors.text }]}>
              {action.label}
            </Text>
            <Text style={[styles.sub, { color: colors.textMuted }]}>
              {action.sub}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
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
  label: {
    fontSize: FontSize.base,
    fontFamily: Fonts.monoMedium,
    fontWeight: "600",
  },
  sub: { fontSize: FontSize.xs, fontFamily: Fonts.mono, marginTop: 2 },
});
