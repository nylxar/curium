import { useEffect, useState } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { ToastProvider } from "@/components/ui/Toast";
import { OverlayProvider, OverlayHost } from "@/components/ui/Overlay";
import { CustomSplash } from "@/components/ui/CustomSplash";

SplashScreen.preventAutoHideAsync();

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? "light" : "dark"} />;
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

  const appOp = useSharedValue(0);
  const appStyle = useAnimatedStyle(() => ({ opacity: appOp.value }));

  const [splashHidden, setSplashHidden] = useState(false);

  // Start app fade-in the instant fonts are ready — same moment the splash
  // begins its fade-out.  Both animations run in parallel so there is no
  // frame where the root View background is visible between them.
  useEffect(() => {
    if (fontsReady) {
      appOp.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [fontsReady]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0d0d0f" }}>
      <View style={{ flex: 1, backgroundColor: "#0d0d0f" }}>
        {/* App tree — always rendered so it's fully laid out behind the splash */}
        <Animated.View style={[{ flex: 1 }, appStyle]}>
          <OverlayProvider>
            <ThemeProvider>
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
                      options={{ animation: "simple_push", animationDuration: 200 }}
                    />
                    <Stack.Screen
                      name="settings"
                      options={{ animation: "simple_push", animationDuration: 160 }}
                    />
                    <Stack.Screen
                      name="qr-detail"
                      options={{ animation: "simple_push", animationDuration: 200 }}
                    />
                    <Stack.Screen
                      name="about"
                      options={{ animation: "simple_push", animationDuration: 200 }}
                    />
                  </Stack>
                </SafeAreaProvider>
                <OverlayHost />
              </ToastProvider>
            </ThemeProvider>
          </OverlayProvider>
        </Animated.View>
        {/* Splash overlay — custom splash controls its own lifecycle and
            calls SplashScreen.hideAsync() directly. */}
        {!splashHidden && (
          <CustomSplash
            ready={fontsReady}
            onHidden={() => setSplashHidden(true)}
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
}
