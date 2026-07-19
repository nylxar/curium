const {
  withDangerousMod,
  AndroidConfig: { Manifest },
} = require("expo/config-plugins");
const path = require("path");

/**
 * Registers Curium as a share target on Android.
 * Adds intent-filters for ACTION_SEND (text/plain and image/*)
 * so other apps can share links, text, or images directly into Curium.
 */
module.exports = function withShareIntent(config) {
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

      // Find the main <activity> (the one with LAUNCHER intent-filter)
      const activity = manifest.manifest.application?.[0]?.activity?.find(
        (a) =>
          a["intent-filter"]?.some((f) =>
            f.category?.some(
              (c) => c.$?.["android:name"] === "android.intent.category.LAUNCHER",
            ),
          ),
      );

      if (activity) {
        // Ensure intent-filter array exists
        if (!activity["intent-filter"]) activity["intent-filter"] = [];

        // Text share receiver
        activity["intent-filter"].push({
          action: [{ $: { "android:name": "android.intent.action.SEND" } }],
          category: [
            { $: { "android:name": "android.intent.category.DEFAULT" } },
          ],
          data: [{ $: { "android:mimeType": "text/plain" } }],
        });

        // Image share receiver
        activity["intent-filter"].push({
          action: [{ $: { "android:name": "android.intent.action.SEND" } }],
          category: [
            { $: { "android:name": "android.intent.category.DEFAULT" } },
          ],
          data: [{ $: { "android:mimeType": "image/*" } }],
        });

        // Allow receiving multiple images
        activity["intent-filter"].push({
          action: [
            { $: { "android:name": "android.intent.action.SEND_MULTIPLE" } },
          ],
          category: [
            { $: { "android:name": "android.intent.category.DEFAULT" } },
          ],
          data: [{ $: { "android:mimeType": "image/*" } }],
        });
      }

      await Manifest.writeAndroidManifestAsync(manifestPath, manifest);
      return cfg;
    },
  ]);
};
