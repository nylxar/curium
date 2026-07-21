import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { captureRef } from "react-native-view-shot";
import { File } from "expo-file-system";
import * as FileSystemLegacy from "expo-file-system/legacy";
import { Icon, type IconName } from "@/components/ui/Icon";
import { QRCanvas } from "@/components/qr/QRCanvas";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/components/ui/Toast";
import { Spacing, Radius, FontSize, Fonts } from "@/constants/theme";
import { DEFAULT_QR_STYLE } from "@/types/qr";
import type { SharedContent } from "@/hooks/useShareIntent";

interface Props {
  content: SharedContent;
  onDismiss: () => void;
}

export function ShareOverlay({ content, onDismiss }: Props) {
  const { colors, isDark } = useTheme();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<View>(null);

  const qrSize = Math.min(screenW - 64, 320);
  const qrValue = content.value;

  const qrStyle = useMemo(
    () => ({
      ...DEFAULT_QR_STYLE,
      fgColor: isDark ? "#fafaf9" : "#1c1917",
      bgColor: isDark ? "#1a1a1e" : "#ffffff",
      eyeColor: isDark ? "#e4e4e7" : "#1c1917",
      pupilColor: isDark ? "#fafaf9" : "#1c1917",
    }),
    [isDark],
  );

  // Entry animation
  const progress = useSharedValue(0);
  const bgOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.92);

  useEffect(() => {
    bgOpacity.value = withTiming(1, {
      duration: 240,
      easing: Easing.out(Easing.cubic),
    });
    cardScale.value = withSpring(1, {
      damping: 18,
      stiffness: 260,
    });
    progress.value = withTiming(1, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  const dismiss = useCallback(() => {
    bgOpacity.value = withTiming(0, { duration: 180 });
    cardScale.value = withTiming(0.94, { duration: 160 });
    progress.value = withTiming(0, { duration: 160 }, () => {
      "worklet";
      onDismiss();
    });
  }, [onDismiss]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: cardScale.value }],
  }));

  const copyValue = useCallback(async () => {
    const Clipboard = await import("expo-clipboard");
    await Clipboard.setStringAsync(qrValue);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    toast.success("Copied!", "Content copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  }, [qrValue, toast]);

  const shareQR = useCallback(async () => {
    if (!qrRef.current) return;
    try {
      await new Promise<void>((r) => setTimeout(r, 200));
      const tmpUri = await captureRef(qrRef.current, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });
      const dest =
        FileSystemLegacy.documentDirectory + `curium_share_${Date.now()}.png`;
      const srcFile = new File(tmpUri);
      const destFile = new File(dest);
      await srcFile.copy(destFile);
      const Sharing = await import("expo-sharing");
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(destFile.uri, { mimeType: "image/png" });
      }
    } catch {
      toast.error("Error", "Could not share QR code.");
    }
  }, [toast]);

  const typeIcon: IconName =
    content.type === "url"
      ? "link-outline"
      : content.type === "image"
        ? "image-outline"
        : "text-outline";

  return (
    <Animated.View style={[styles.backdrop, backdropStyle]}>
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={dismiss}
      />
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
          cardStyle,
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.typeChip,
                { backgroundColor: colors.primary + "15" },
              ]}
            >
              <Icon name={typeIcon} size={13} color={colors.primary} />
              <Text
                style={[
                  styles.typeLabel,
                  { color: colors.primary, fontFamily: Fonts.monoBold },
                ]}
              >
                {content.type.toUpperCase()}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={dismiss} hitSlop={10}>
            <Icon name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* QR Code */}
        <View
          ref={qrRef}
          collapsable={false}
          style={[
            styles.qrWrap,
            {
              width: qrSize,
              height: qrSize,
              backgroundColor: qrStyle.bgColor,
              borderRadius: qrStyle.qrCorners,
            },
          ]}
        >
          <QRCanvas
            value={qrValue}
            size={qrSize}
            qrStyle={qrStyle}
            skipAnimation
            logoUri={qrStyle.logoUri}
            logoSize={48}
            logoStyle={qrStyle.logoStyle}
            logoBgColor={qrStyle.bgColor}
            logoPosition={qrStyle.logoPosition}
          />
        </View>

        {/* Shared content preview */}
        <View
          style={[
            styles.preview,
            { backgroundColor: colors.bg, borderColor: colors.border },
          ]}
        >
          <Text
            style={[
              styles.previewText,
              { color: colors.textMuted, fontFamily: Fonts.mono },
            ]}
            numberOfLines={2}
          >
            {qrValue}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={copyValue}
            style={[
              styles.actionBtn,
              {
                backgroundColor: copied
                  ? colors.success + "18"
                  : colors.surfaceOffset,
                borderColor: copied ? colors.success + "50" : colors.border,
              },
            ]}
            activeOpacity={0.7}
          >
            <Icon
              name={copied ? "checkmark" : "copy-outline"}
              size={16}
              color={copied ? colors.success : colors.text}
            />
            <Text
              style={[
                styles.actionLabel,
                {
                  color: copied ? colors.success : colors.text,
                  fontFamily: Fonts.monoBold,
                },
              ]}
            >
              {copied ? "Copied" : "Copy"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={shareQR}
            style={[
              styles.actionBtn,
              { backgroundColor: colors.surfaceOffset, borderColor: colors.border },
            ]}
            activeOpacity={0.7}
          >
            <Icon name="share-social-outline" size={16} color={colors.text} />
            <Text
              style={[
                styles.actionLabel,
                { color: colors.text, fontFamily: Fonts.monoBold },
              ]}
            >
              Share QR
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
    gap: Spacing.md,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  typeLabel: { fontSize: 10, letterSpacing: 1.2 },
  qrWrap: { overflow: "hidden" },
  preview: {
    width: "100%",
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  previewText: { fontSize: FontSize.xs, lineHeight: 18 },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
    width: "100%",
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionLabel: { fontSize: FontSize.xs },
});
