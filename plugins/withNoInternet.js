const {
  withAndroidManifest,
} = require("expo/config-plugins");

const REMOVE_PERMISSIONS = [
  "android.permission.INTERNET",
  "android.permission.ACCESS_NETWORK_STATE",
  "android.permission.ACCESS_WIFI_STATE",
];

module.exports = function withNoInternet(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest.$ = {
      ...manifest.$,
      "xmlns:tools": "http://schemas.android.com/tools",
    };

    const permissions = manifest["uses-permission"] ?? [];
    for (const permission of REMOVE_PERMISSIONS) {
      const existing = permissions.find(
        (entry) => entry.$?.["android:name"] === permission,
      );
      if (existing) {
        existing.$["tools:node"] = "remove";
      } else {
        permissions.push({
          $: {
            "android:name": permission,
            "tools:node": "remove",
          },
        });
      }
    }
    manifest["uses-permission"] = permissions;
    return cfg;
  });
};
