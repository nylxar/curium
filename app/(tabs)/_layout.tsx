import { useEffect } from "react";
import { Tabs } from "expo-router";
import { View, Text, StyleSheet, Platform } from "react-native";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
  interpolate,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, FontSize } from "@/constants/theme";

type TabIconProps = {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  label: string;
};

function TabIcon({ name, focused, label }: TabIconProps) {
  // Initial value matches focused prop — no reads during render
  const scale = useSharedValue(focused ? 1 : 0);

  // useEffect is the correct place to react to prop changes
  useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0, {
      damping: 14,
      stiffness: 180,
    });
  }, [focused]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: scale.value }],
    opacity: interpolate(scale.value, [0, 1], [0, 1]),
  }));

  return (
    <View style={styles.tabItem}>
      <Animated.View style={[styles.activePill, pillStyle]} />
      <Ionicons
        name={name}
        size={23}
        color={focused ? Colors.tabActive : Colors.tabInactive}
      />
      <Text
        style={[
          styles.tabLabel,
          { color: focused ? Colors.tabActive : Colors.tabInactive },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? "add-circle" : "add-circle-outline"}
              focused={focused}
              label="Create"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? "scan" : "scan-outline"}
              focused={focused}
              label="Scan"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? "grid" : "grid-outline"}
              focused={focused}
              label="History"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? "settings" : "settings-outline"}
              focused={focused}
              label="Settings"
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.tabBg,
    borderTopColor: Colors.border,
    borderTopWidth: 0.5,
    height: Platform.OS === "ios" ? 84 : 64,
    paddingBottom: Platform.OS === "ios" ? 24 : 8,
    paddingTop: 8,
    elevation: 0,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    width: 64,
    gap: 4,
  },
  activePill: {
    position: "absolute",
    top: -6,
    width: 40,
    height: 3,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  tabLabel: {
    fontSize: FontSize.xs,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
});
