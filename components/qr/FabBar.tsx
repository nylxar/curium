import { useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Radius, Spacing, FontSize } from "@/constants/theme";
import { PressableScale } from "@/components/ui/PressableScale";

const NAV_ITEMS = [
  { route: "/", label: "Create", icon: "add-circle-outline" },
  { route: "/scan", label: "Scan", icon: "scan-outline" },
  { route: "/history", label: "History", icon: "albums-outline" },
  { route: "/settings", label: "Settings", icon: "settings-outline" },
] as const;

interface BtnProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  primary?: boolean;
  tintColor: string;
  bgColor: string;
  disabled?: boolean;
}

function Btn({
  icon,
  label,
  onPress,
  primary,
  tintColor,
  bgColor,
  disabled,
}: BtnProps) {
  return (
    <PressableScale
      onPress={() => {
        if (!disabled) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }
      }}
      disabled={disabled}
      style={styles.btnWrap}
      pressedScale={0.92}
    >
      <View
        style={[
          styles.btnCircle,
          primary
            ? { backgroundColor: tintColor }
            : {
                backgroundColor: tintColor + "20",
                borderWidth: 1,
                borderColor: tintColor + "35",
              },
        ]}
      >
        <Ionicons name={icon} size={21} color={primary ? bgColor : tintColor} />
      </View>
      <Text style={[styles.btnLabel, { color: tintColor + "cc" }]}>
        {label}
      </Text>
    </PressableScale>
  );
}

interface Props {
  tintColor: string;
  bgColor: string;
  disabled: boolean;
  onCopy: () => void;
  onShuffle: () => void;
  onShare: () => void;
}

export function FabBar({
  tintColor,
  bgColor,
  disabled,
  onCopy,
  onShuffle,
  onShare,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const go = (route: string) => {
    setMenuOpen(false);
    setTimeout(() => router.push(route as any), 60);
    Haptics.selectionAsync();
  };

  return (
    <>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: bgColor + "f2",
            paddingBottom: insets.bottom + Spacing.sm,
            borderTopColor: tintColor + "20",
          },
        ]}
      >
        {/* Single row — Copy | Random | Share | Menu */}
        <View style={styles.row}>
          <Btn
            icon="copy-outline"
            label="Copy"
            tintColor={tintColor}
            bgColor={bgColor}
            onPress={onCopy}
            disabled={disabled}
          />
          <Btn
            icon="shuffle"
            label="Random"
            tintColor={tintColor}
            bgColor={bgColor}
            onPress={onShuffle}
            disabled={disabled}
            primary
          />
          <Btn
            icon="share-outline"
            label="Share"
            tintColor={tintColor}
            bgColor={bgColor}
            onPress={onShare}
            disabled={disabled}
          />
          <Btn
            icon="menu"
            label="Menu"
            tintColor={tintColor}
            bgColor={bgColor}
            onPress={() => setMenuOpen(true)}
          />
        </View>
      </View>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <Animated.View
            entering={FadeInUp.duration(220).springify().damping(18)}
            style={[
              styles.sheet,
              {
                backgroundColor: bgColor,
                borderColor: tintColor + "25",
                paddingBottom: insets.bottom + Spacing.lg,
              },
            ]}
          >
            <Pressable
              style={styles.sheetContent}
              onPress={(e) => e.stopPropagation()}
            >
              <View
                style={[styles.handle, { backgroundColor: tintColor + "40" }]}
              />

              {NAV_ITEMS.map((item, i) => (
                <PressableScale
                  key={item.route}
                  style={[
                    styles.navRow,
                    i < NAV_ITEMS.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: tintColor + "20",
                    },
                  ]}
                  onPress={() => go(item.route)}
                  pressedScale={0.98}
                >
                  <View
                    style={[
                      styles.navIcon,
                      { backgroundColor: tintColor + "18" },
                    ]}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={tintColor}
                    />
                  </View>
                  <Text style={[styles.navLabel, { color: tintColor }]}>
                    {item.label}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={tintColor + "40"}
                  />
                </PressableScale>
              ))}
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-start",
    paddingHorizontal: Spacing.md,
  },
  btnWrap: { alignItems: "center", gap: Spacing.xs, minWidth: 64 },
  btnCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  btnLabel: { fontSize: FontSize.xs, fontWeight: "600" },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.48)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  sheetContent: { width: "100%" },
  handle: {
    width: 36,
    height: 4,
    borderRadius: Radius.full,
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    minHeight: 56,
    paddingVertical: Spacing.md,
  },
  navIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: { flex: 1, fontSize: FontSize.base, fontWeight: "600" },
});
