import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "@/context/ThemeContext";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    "IBMPlexMono-Text": require("../assets/fonts/IBMPlexMono-Text.otf"),
    "IBMPlexMono-Light": require("../assets/fonts/IBMPlexMono-Light.otf"),
    "IBMPlexMono-Regular": require("../assets/fonts/IBMPlexMono-Regular.otf"),
    "IBMPlexMono-Medium": require("../assets/fonts/IBMPlexMono-Medium.otf"),
    "IBMPlexMono-SemiBold": require("../assets/fonts/IBMPlexMono-SemiBold.otf"),
    "IBMPlexMono-Bold": require("../assets/fonts/IBMPlexMono-Bold.otf"),
    "IBMPlexMono-Italic": require("../assets/fonts/IBMPlexMono-Italic.otf"),
  });
  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);
  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ animation: "none" }} />
            <Stack.Screen
              name="scan"
              options={{
                animation: "slide_from_bottom",
                presentation: "modal",
              }}
            />
            <Stack.Screen
              name="history"
              options={{ animation: "slide_from_right" }}
            />
            <Stack.Screen
              name="settings"
              options={{ animation: "slide_from_right" }}
            />
            <Stack.Screen
              name="qr-detail"
              options={{ animation: "slide_from_bottom" }}
            />
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
