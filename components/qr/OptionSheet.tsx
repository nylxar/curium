import { ReactNode } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Radius, Spacing, FontSize } from "@/constants/theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  tintColor: string;
  bgColor: string;
  children: ReactNode;
}

export function OptionSheet({
  visible,
  onClose,
  title,
  tintColor,
  bgColor,
  children,
}: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          entering={FadeInDown.delay(80).duration(300)}
          style={[
            styles.sheet,
            {
              backgroundColor: bgColor,
              borderColor: tintColor + "25",
              paddingBottom: insets.bottom + Spacing.lg,
              maxHeight: height * 0.78,
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          {/* Handle */}
          <View
            style={[styles.handle, { backgroundColor: tintColor + "40" }]}
          />

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: tintColor }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons
                name="close-circle"
                size={24}
                color={tintColor + "70"}
              />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.body}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.50)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: Radius.full,
    alignSelf: "center",
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  title: { fontSize: FontSize.lg, fontWeight: "700" },
  body: { gap: Spacing.md, paddingBottom: Spacing.xs },
});
