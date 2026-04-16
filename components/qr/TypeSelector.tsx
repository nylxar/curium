import { useEffect } from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { PressableScale } from "@/components/ui/PressableScale";
import { QRType } from "@/types/qr";
import { Colors, Radius, FontSize, Spacing } from "@/constants/theme";

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

function TypeChip({
  item,
  selected,
  onPress,
}: {
  item: (typeof TYPES)[0];
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(selected ? 1 : 0);
  const bgOpacity = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(selected ? 1 : 0, { damping: 14, stiffness: 200 });
    bgOpacity.value = withSpring(selected ? 1 : 0, {
      damping: 14,
      stiffness: 200,
    });
  }, [selected]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
    transform: [{ scale: 0.92 + scale.value * 0.08 }],
  }));

  return (
    <PressableScale onPress={onPress} style={styles.chipWrap}>
      <Animated.View
        style={[
          styles.chip,
          { borderColor: selected ? Colors.primary : Colors.border },
          pillStyle,
        ]}
      >
        <Ionicons
          name={item.icon}
          size={15}
          color={selected ? Colors.primary : Colors.textMuted}
        />
        <Text
          style={[
            styles.chipLabel,
            { color: selected ? Colors.primary : Colors.textMuted },
          ]}
        >
          {item.label}
        </Text>
      </Animated.View>
    </PressableScale>
  );
}

interface Props {
  selected: QRType;
  onChange: (t: QRType) => void;
}

export function TypeSelector({ selected, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {TYPES.map((item) => (
        <TypeChip
          key={item.type}
          item={item}
          selected={selected === item.type}
          onPress={() => onChange(item.type)}
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
  chipWrap: {},
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm - 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    backgroundColor: Colors.surface,
  },
  chipLabel: { fontSize: FontSize.sm, fontWeight: "500" },
});
