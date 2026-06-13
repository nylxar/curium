const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function removeMicPermission(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    const usesPermissions = manifest["uses-permission"] || [];
    manifest["uses-permission"] = usesPermissions.filter((perm) => {
      const name = perm.$?.["android:name"] ?? "";
      return name !== "android.permission.RECORD_AUDIO";
    });
    return cfg;
  });
};
