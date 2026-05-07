import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
  Platform,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Radius, Spacing, FontSize } from "@/constants/theme";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const NAV_ITEMS = [
  { route: "/", label: "Create", icon: "add-circle-outline" },
  { route: "/scan", label: "Scan", icon: "scan-outline" },
  { route: "/history", label: "History", icon: "albums-outline" },
  { route: "/settings", label: "Settings", icon: "settings-outline" },
] as const;

interface Props {
  tintColor: string; // adapts to current QR color
  bgColor: string;
}

export function NavMenu({ tintColor, bgColor }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const openMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOpen(true);
  };

  const navigate = (route: string) => {
    setOpen(false);
    setTimeout(() => router.push(route as any), 80);
    Haptics.selectionAsync();
  };

  return (
    <>
      {/* Floating pill button — sits above FABs */}
      <TouchableOpacity
        style={[
          styles.pill,
          { backgroundColor: tintColor, shadowColor: tintColor },
        ]}
        onPress={openMenu}
        activeOpacity={0.85}
      >
        <Ionicons name="menu" size={20} color={bgColor} />
        <Text style={[styles.pillLabel, { color: bgColor }]}>Menu</Text>
      </TouchableOpacity>

      {/* Full-screen modal backdrop + menu card */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          {/* Menu card — bottom anchored */}
          <Pressable
            style={[
              styles.menuCard,
              {
                backgroundColor: bgColor,
                borderColor: tintColor + "30",
                paddingBottom: insets.bottom + Spacing.base,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <View
              style={[styles.handle, { backgroundColor: tintColor + "40" }]}
            />

            {NAV_ITEMS.map((item, i) => (
              <TouchableOpacity
                key={item.route}
                style={[
                  styles.navItem,
                  i < NAV_ITEMS.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: tintColor + "18",
                  },
                ]}
                onPress={() => navigate(item.route)}
                activeOpacity={0.7}
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
                  color={tintColor + "50"}
                />
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  pillLabel: {
    fontSize: FontSize.sm,
    fontWeight: "700",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  menuCard: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.base,
    gap: Spacing.xs,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: Radius.full,
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  navIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: "600",
  },
});
