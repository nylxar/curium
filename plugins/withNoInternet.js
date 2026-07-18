const {
  withDangerousMod,
  AndroidConfig: { Manifest },
} = require("expo/config-plugins");
const path = require("path");

const REMOVE_PERMISSIONS = [
  "android.permission.INTERNET",
  "android.permission.ACCESS_NETWORK_STATE",
  "android.permission.ACCESS_WIFI_STATE",
];

module.exports = function withNoInternet(config) {
  return withDangerousMod(config, [
    "android",
    async (cfg) => {
      const manifestPath = path.join(
        cfg.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "AndroidManifest.xml",
      );
      const manifest = await Manifest.readAndroidManifestAsync(manifestPath);

      const permissions = manifest.manifest["uses-permission"] ?? [];
      manifest.manifest["uses-permission"] = permissions.filter(
        (perm) => !REMOVE_PERMISSIONS.includes(perm.$?.["android:name"]),
      );

      await Manifest.writeAndroidManifestAsync(manifestPath, manifest);
      return cfg;
    },
  ]);
};
