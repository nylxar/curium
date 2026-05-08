import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ animation: "none" }} />
          <Stack.Screen
            name="scan"
            options={{ animation: "slide_from_bottom", presentation: "modal" }}
          />
          <Stack.Screen
            name="history"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="settings"
            options={{ animation: "slide_from_right" }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
