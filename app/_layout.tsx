import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/components/ui/Toast";
import { OverlayProvider, OverlayHost } from "@/components/ui/Overlay";

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
      <OverlayProvider>
        <ThemeProvider>
          <ToastProvider>
            <SafeAreaProvider>
              <StatusBar style="auto" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: "fade",
                  animationDuration: 180,
                }}
              >
                <Stack.Screen
                  name="index"
                  options={{ animation: "fade", animationDuration: 180 }}
                />
                <Stack.Screen
                  name="scan"
                  options={{
                    animation: "slide_from_bottom",
                    animationDuration: 280,
                    presentation: "modal",
                  }}
                />
                <Stack.Screen
                  name="history"
                  options={{
                    animation: "simple_push",
                    animationDuration: 200,
                  }}
                />
                <Stack.Screen
                  name="settings"
                  options={{
                    animation: "simple_push",
                    animationDuration: 200,
                  }}
                />
                <Stack.Screen
                  name="qr-detail"
                  options={{
                    animation: "slide_from_bottom",
                    animationDuration: 280,
                  }}
                />
                <Stack.Screen
                  name="about"
                  options={{
                    animation: "simple_push",
                    animationDuration: 200,
                  }}
                />
              </Stack>
            </SafeAreaProvider>
            {/* OverlayHost is inside OverlayProvider + ToastProvider + ThemeProvider — always on top */}
            <OverlayHost />
          </ToastProvider>
        </ThemeProvider>
      </OverlayProvider>
    </GestureHandlerRootView>
  );
}
