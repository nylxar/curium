import { useEffect, useState, useRef } from "react";
import { View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

const LAST_SEEN_KEY = "curium_last_seen_version";

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ fade: false, duration: 0 });

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
  const router = useRouter();

  const appOp = useSharedValue(0);
  const appStyle = useAnimatedStyle(() => ({ opacity: appOp.value }));

  const [splashHidden, setSplashHidden] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      SplashScreen.hideAsync();
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (fontsReady) {
      appOp.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [fontsReady]);

  // First-launch welcome redirect + what's-new on update
  const seenWelcomeRef = useRef(false);
  useEffect(() => {
    if (!fontsReady) return;
    AsyncStorage.getItem("curium_onboarded").then((v) => {
      if (!v) {
        seenWelcomeRef.current = true;
        router.replace("/welcome");
      } else {
        // Check if app was updated since last launch
        const version = require("../app.json").expo.version;
        AsyncStorage.getItem(LAST_SEEN_KEY).then((lastSeen) => {
          if (lastSeen !== version && !seenWelcomeRef.current) {
            seenWelcomeRef.current = true;
            router.push({ pathname: "/whats-new", params: { forced: "false" } });
          }
        });
      }
    });
  }, [fontsReady]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0d0d0f" }}>
      <View style={{ flex: 1, backgroundColor: "#0d0d0f" }}>
        <Animated.View style={[{ flex: 1 }, appStyle]}>
          <OverlayProvider>
            <ThemeProvider>
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
                    <Stack.Screen name="welcome" options={{ animation: "none" }} />
                    <Stack.Screen
                      name="support"
                      options={{
                        animation: "simple_push",
                        animationDuration: 200,
                      }}
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
                        name="info"
                        options={{ animation: "simple_push", animationDuration: 200 }}
                      />
                      <Stack.Screen
                        name="about"
                        options={{ animation: "simple_push", animationDuration: 200 }}
                      />
                      <Stack.Screen
                        name="whats-new"
                        options={{ animation: "simple_push", animationDuration: 200 }}
                      />
                    </Stack>
                  </SafeAreaProvider>
                  <OverlayHost />
                </ToastProvider>
              </ThemedBackground>
            </ThemeProvider>
          </OverlayProvider>
        </Animated.View>
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
