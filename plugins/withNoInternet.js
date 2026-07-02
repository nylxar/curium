const { withAndroidManifest } = require("expo/config-plugins");

module.exports = function withNoInternet(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    if (manifest?.["uses-permission"]) {
      manifest["uses-permission"] = manifest["uses-permission"].filter(
        (perm) => {
          const name = perm.$?.["android:name"] ?? "";
          return (
            name !== "android.permission.INTERNET" &&
            name !== "android.permission.ACCESS_NETWORK_STATE" &&
            name !== "android.permission.ACCESS_WIFI_STATE"
          );
        },
      );
    }
    return cfg;
  });
};
