// metro.config.js — Metro bundler configuration for Curium.
//
// Required by Reanimated 4 + react-native-worklets 0.8.x.  Worklets
// need their runtime entry points loaded BEFORE the main module runs,
// or the app crashes instantly on launch with a "worklet runtime is
// not initialized" error.  The `getBundleModeMetroConfig` from
// `react-native-worklets/bundleMode` patches Metro's serializer to
// register `workletRuntimeEntry.native.{ts,js}` as a pre-main entry.
//
// This is the equivalent of the bare-RN `bundleModeMetroConfig` shown
// in the worklets docs, adapted for Expo (which already provides
// `getDefaultConfig` from `@expo/metro-config`).
//
// See:
//   - https://docs.swmansion.com/react-native-worklets/docs/guides/bundle-mode
//   - https://docs.swmansion.com/react-native-reanimated/docs/guides/migration-from-3.x
//
// The `babel-preset-expo` preset is applied automatically via the
// babel.config.js — no extra Babel config is needed here.

const { getDefaultConfig } = require("expo/metro-config");
const { getBundleModeMetroConfig } = require("react-native-worklets/bundleMode");

const config = getDefaultConfig(__dirname);

module.exports = getBundleModeMetroConfig(config);
