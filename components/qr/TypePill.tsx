import { useEffect } from "react";
import { ScrollView, Text, StyleSheet, TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { QRType } from "@/types/qr";
import { FontSize, Spacing, Radius } from "@/constants/theme";
import * as Haptics from "expo-haptics";

const TYPES: {
  type: QRType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { type: "url", label: "URL", icon: "link-outline" },
  { type: "text", label: "Text", icon: "text-outline" },
  { type: "wifi", label: "WiFi", icon: "wifi-outline" },
  { type: "email", label: "Email", icon: "mail-outline" },
  { type: "phone", label: "Phone", icon: "call-outline" },
  { type: "sms", label: "SMS", icon: "chatbubble-outline" },
  { type: "contact", label: "Contact", icon: "person-outline" },
  { type: "location", label: "Location", icon: "location-outline" },
];

function Chip({
  item,
  selected,
  tintColor,
  onPress,
}: {
  item: (typeof TYPES)[0];
  selected: boolean;
  tintColor: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(selected ? 1.05 : 1, {
      damping: 14,
      stiffness: 240,
    });
  }, [selected]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Animated.View
        style={[
          styles.chip,
          animStyle,
          selected
            ? { backgroundColor: tintColor, borderColor: tintColor }
            : {
                backgroundColor: tintColor + "18",
                borderColor: tintColor + "35",
              },
        ]}
      >
        <Ionicons
          name={item.icon}
          size={13}
          color={selected ? "#080810" : tintColor}
        />
        <Text
          style={[
            styles.chipLabel,
            { color: selected ? "#080810" : tintColor },
            selected && { fontWeight: "700" },
          ]}
        >
          {item.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

interface Props {
  selected: QRType;
  tintColor: string;
  onChange: (t: QRType) => void;
}

export function TypePill({ selected, tintColor, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {TYPES.map((item) => (
        <Chip
          key={item.type}
          item={item}
          selected={selected === item.type}
          tintColor={tintColor}
          onPress={() => {
            Haptics.selectionAsync();
            onChange(item.type);
          }}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm - 1,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipLabel: { fontSize: FontSize.sm },
});
