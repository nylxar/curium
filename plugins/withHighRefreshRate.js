const {
  withDangerousMod,
  AndroidConfig: { Manifest },
} = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const REFRESH_RATE_CODE = `
  private fun applyRefreshRate() {
    val prefs = getSharedPreferences("curium_settings", MODE_PRIVATE)
    if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.R) return

    val display = display ?: return
    val refreshRate = if (prefs.getBoolean("high_refresh_rate", false)) {
      display.supportedModes.maxOfOrNull { it.refreshRate }
    } else {
      60.0f
    }
    if (refreshRate != null) {
      window.attributes = window.attributes.apply {
        // Prefer a rate while letting Android retain adaptive display behavior.
        preferredDisplayModeId = 0
        preferredRefreshRate = refreshRate
      }
    }
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    applyRefreshRate()
  }
`;

/**
 * Injects refresh-rate preference logic into MainActivity.kt.
 *
 * Reads from SharedPreferences "curium_settings" key "high_refresh_rate".
 * Default is false (60 Hz) — users can enable their display's highest rate.
 * The native module (modules/high-refresh-rate) writes to the same prefs
 * and calls applyRefreshRate() at runtime.
 */
module.exports = function withHighRefreshRate(config) {
  config = withDangerousMod(config, [
    "android",
    async (cfg) => {
      const projectRoot = cfg.modRequest.platformProjectRoot;

      // ── Inject into MainActivity.kt ──
      const mainActivityPath = path.join(
        projectRoot,
        "app",
        "src",
        "main",
        "java",
        "com",
        "nylxar",
        "curium",
        "MainActivity.kt",
      );

      if (fs.existsSync(mainActivityPath)) {
        let content = fs.readFileSync(mainActivityPath, "utf-8");

        if (!content.includes("applyRefreshRate")) {
          // Insert before the last closing brace of the class
          const lastBrace = content.lastIndexOf("}");
          if (lastBrace !== -1) {
            content =
              content.slice(0, lastBrace) +
              REFRESH_RATE_CODE +
              "\n" +
              content.slice(lastBrace);
            fs.writeFileSync(mainActivityPath, content, "utf-8");
          }
        }
      }

      // ── Manifest meta-data (diagnostic) ──
      const manifestPath = path.join(
        projectRoot,
        "app",
        "src",
        "main",
        "AndroidManifest.xml",
      );
      const manifest = await Manifest.readAndroidManifestAsync(manifestPath);
      const app = manifest.manifest.application?.[0];
      if (app) {
        if (!app["meta-data"]) app["meta-data"] = [];
        const hasFlag = app["meta-data"].some(
          (d) =>
            d.$?.["android:name"] === "com.nylxar.curium.highRefreshRate",
        );
        if (!hasFlag) {
          app["meta-data"].push({
            $: {
              "android:name": "com.nylxar.curium.highRefreshRate",
              "android:value": "true",
            },
          });
        }
      }
      await Manifest.writeAndroidManifestAsync(manifestPath, manifest);

      return cfg;
    },
  ]);

  return config;
};
