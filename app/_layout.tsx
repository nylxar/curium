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
import { useShareIntent } from "@/hooks/useShareIntent";
import { ShareOverlay } from "@/components/qr/ShareOverlay";

const LAST_SEEN_KEY = "curium_last_seen_version";
const UPGRADE_WELCOME_KEY = "curium_upgrade_welcome_seen";

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
  const [sharedContent, setSharedContent] = useState<ReturnType<typeof useShareIntent>>(null);
  const hookResult = useShareIntent();

  useEffect(() => {
    if (hookResult) setSharedContent(hookResult);
  }, [hookResult]);

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

  // ── Navigation decision + splash gating ──
  // Navigation happens IMMEDIATELY (behind the opaque splash) so when
  // CustomSplash fades out the correct screen is already showing.
  const [navigationReady, setNavigationReady] = useState(false);
  const seenWelcomeRef = useRef(false);

  useEffect(() => {
    if (!fontsReady) return;
    const version = require("../app.json").expo.version;

    AsyncStorage.getItem("curium_onboarded").then((onboarded) => {
      if (!onboarded) {
        // Fresh install → welcome, then chain to whats-new
        seenWelcomeRef.current = true;
        AsyncStorage.setItem("curium_onboarded", "true");
        AsyncStorage.setItem(LAST_SEEN_KEY, version);
        router.replace({ pathname: "/welcome", params: { chain: "whats-new" } });
        setNavigationReady(true);
        return;
      }

      AsyncStorage.getItem(LAST_SEEN_KEY).then((lastSeen) => {
        if (lastSeen === version || seenWelcomeRef.current) {
          // Same version or already handled → stay on index
          setNavigationReady(true);
          return;
        }

        // Version changed — first upgrade shows welcome, subsequent show whats-new
        AsyncStorage.getItem(UPGRADE_WELCOME_KEY).then((upgradeSeen) => {
          seenWelcomeRef.current = true;

          if (!upgradeSeen) {
            // First time seeing an upgrade → welcome then whats-new (one-time)
            AsyncStorage.setItem(LAST_SEEN_KEY, version);
            AsyncStorage.setItem(UPGRADE_WELCOME_KEY, "true");
            router.replace({ pathname: "/welcome", params: { chain: "whats-new" } });
          } else {
            // Already saw upgrade welcome before → whats-new (LAST_SEEN_KEY
            // is set by whats-new.tsx itself after the user views it)
            router.replace({ pathname: "/whats-new", params: { forced: "false" } });
          }
          setNavigationReady(true);
        });
      });
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
                    <OverlayHost />
                    {sharedContent && (
                      <ShareOverlay
                        content={sharedContent}
                        onDismiss={() => setSharedContent(null)}
                      />
                    )}
                  </SafeAreaProvider>
                </ToastProvider>
              </ThemedBackground>
            </ThemeProvider>
          </OverlayProvider>
        </Animated.View>
        {!splashHidden && (
          <CustomSplash
            ready={fontsReady && navigationReady}
            onHidden={() => setSplashHidden(true)}
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
}
