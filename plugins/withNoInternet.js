const {
  withAndroidManifest,
  withDangerousMod,
} = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const NETWORK_STATE_PERMISSIONS = [
  "android.permission.ACCESS_NETWORK_STATE",
  "android.permission.ACCESS_WIFI_STATE",
];

/**
 * Strips network permissions from the Android manifest.
 *
 * ACCESS_NETWORK_STATE / ACCESS_WIFI_STATE — always stripped (offline app).
 * INTERNET — stripped in release builds only via src/release/AndroidManifest.xml overlay.
 * Debug builds keep INTERNET (required for expo-dev-client / Metro).
 */
module.exports = function withNoInternet(config) {
  config = withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest.$ = {
      ...manifest.$,
      "xmlns:tools": "http://schemas.android.com/tools",
    };

    const perms = manifest["uses-permission"] ?? [];
    for (const perm of NETWORK_STATE_PERMISSIONS) {
      const existing = perms.find((e) => e.$?.["android:name"] === perm);
      if (existing) {
        existing.$["tools:node"] = "remove";
      } else {
        perms.push({
          $: { "android:name": perm, "tools:node": "remove" },
        });
      }
    }
    manifest["uses-permission"] = perms;
    return cfg;
  });

  config = withDangerousMod(config, [
    "android",
    (cfg) => {
      const releaseDir = path.join(
        cfg.modRequest.platformProjectRoot,
        "app",
        "src",
        "release",
      );
      fs.mkdirSync(releaseDir, { recursive: true });
      fs.writeFileSync(
        path.join(releaseDir, "AndroidManifest.xml"),
        [
          '<?xml version="1.0" encoding="utf-8"?>',
          '<manifest xmlns:android="http://schemas.android.com/apk/res/android"',
          '    xmlns:tools="http://schemas.android.com/tools">',
          '    <uses-permission android:name="android.permission.INTERNET"',
          '        tools:node="remove" />',
          "</manifest>",
          "",
        ].join("\n"),
        "utf-8",
      );
      return cfg;
    },
  ]);

  return config;
};
