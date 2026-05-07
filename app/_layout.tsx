import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
        <Stack.Screen name="index" />
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
    </>
  );
}
