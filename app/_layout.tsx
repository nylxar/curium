import { useEffect } from "react";
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
  runOnJS,
} from "react-native-reanimated";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/components/ui/Toast";
import { OverlayProvider, OverlayHost } from "@/components/ui/Overlay";
import { CustomSplash } from "@/components/ui/CustomSplash";

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
  const ready = loaded || error;

  const appOp = useSharedValue(0);
  const splashOp = useSharedValue(1);

  const appStyle = useAnimatedStyle(() => ({ opacity: appOp.value }));

  useEffect(() => {
    if (ready) {
      appOp.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
      splashOp.value = withTiming(0, { duration: 350, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(SplashScreen.hideAsync)();
      });
    }
  }, [ready]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {/* App tree — always rendered so it's fully laid out behind the splash */}
        <Animated.View style={[{ flex: 1 }, appStyle]}>
          <OverlayProvider>
            <ThemeProvider>
              <ToastProvider>
                <SafeAreaProvider>
                  <StatusBar style="auto" />
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
        {/* Splash overlay on top — fades out when fonts are ready */}
        <CustomSplash splashOpacity={splashOp} />
      </View>
    </GestureHandlerRootView>
  );
}