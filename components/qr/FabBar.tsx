import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Radius, Spacing, FontSize, Fonts } from "@/constants/theme";
import { AnimatedSheet } from "@/components/ui/AnimatedSheet";

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
    <View style={[styles.btnWrap, { opacity: disabled ? 0.4 : 1 }]}>
      <TouchableOpacity
        onPress={() => {
          if (!disabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress();
          }
        }}
        activeOpacity={0.6}
        disabled={disabled}
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
      </TouchableOpacity>
      <Text style={[styles.btnLabel, { color: tintColor + "cc" }]}>
        {label}
      </Text>
    </View>
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
    setTimeout(() => router.push(route as any), 80);
  };

  return (
    <>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: bgColor,
            paddingBottom: insets.bottom + Spacing.sm,
            borderTopColor: tintColor + "20",
          },
        ]}
      >
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

      <AnimatedSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        bgColor={bgColor}
        borderColor={tintColor + "25"}
      >
        {NAV_ITEMS.map((item, i) => (
          <TouchableOpacity
            key={item.route}
            style={[
              styles.navRow,
              i < NAV_ITEMS.length - 1 && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: tintColor + "20",
              },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              go(item.route);
            }}
            activeOpacity={0.6}
          >
            <View style={[styles.navIcon, { backgroundColor: tintColor + "18" }]}>
              <Ionicons name={item.icon as any} size={20} color={tintColor} />
            </View>
            <Text style={[styles.navLabel, { color: tintColor }]}>
              {item.label}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={tintColor + "40"} />
          </TouchableOpacity>
        ))}
      </AnimatedSheet>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-start",
    paddingHorizontal: Spacing.md,
  },
  btnWrap: { alignItems: "center", gap: Spacing.xs },
  btnCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  btnLabel: { fontSize: FontSize.xs, fontFamily: Fonts.monoMedium, fontWeight: "600" },

  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md + 2,
  },
  navIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: { flex: 1, fontSize: FontSize.md ?? 15, fontFamily: Fonts.monoMedium, fontWeight: "600" },
});
