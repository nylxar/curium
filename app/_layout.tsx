import { useEffect } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { ToastProvider } from "@/components/ui/Toast";
import { OverlayProvider, OverlayHost } from "@/components/ui/Overlay";

SplashScreen.preventAutoHideAsync();

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? "light" : "dark"} />;
}

function ThemedBackground({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>{children}</View>
  );
}

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
  const fontsReady = !!(loaded || error);

  function SplashReady() {
    const { ready } = useTheme();
    useEffect(() => {
      if (fontsReady && ready) {
        SplashScreen.hideAsync();
      }
    }, [fontsReady, ready]);
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0d0d0f" }}>
      <View style={{ flex: 1, backgroundColor: "#0d0d0f" }}>
        <OverlayProvider>
          <ThemeProvider>
            <SplashReady />
            <ThemedBackground>
              <ToastProvider>
                <SafeAreaProvider>
                  <ThemedStatusBar />
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      animation: "none",
                    }}
                  >
                    <Stack.Screen name="index" options={{ animation: "none" }} />
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
                        animationDuration: 160,
                      }}
                    />
                    <Stack.Screen
                      name="qr-detail"
                      options={{
                        animation: "simple_push",
                        animationDuration: 200,
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
                <OverlayHost />
              </ToastProvider>
            </ThemedBackground>
          </ThemeProvider>
        </OverlayProvider>
      </View>
    </GestureHandlerRootView>
  );
}
