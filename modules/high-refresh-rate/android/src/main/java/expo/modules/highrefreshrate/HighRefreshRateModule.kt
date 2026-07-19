package expo.modules.highrefreshrate

import android.app.Activity
import android.content.Context
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class HighRefreshRateModule : Module() {
  private val prefs by lazy {
    appContext.reactContext?.getSharedPreferences("curium_settings", Context.MODE_PRIVATE)
  }

  private val activity: Activity?
    get() = appContext.currentActivity

  override fun definition() = ModuleDefinition {
    Name("HighRefreshRate")

    Function("isEnabled") {
      prefs?.getBoolean("high_refresh_rate", false) ?: false
    }

    Function("setEnabled") { enabled: Boolean ->
      prefs?.edit()?.putBoolean("high_refresh_rate", enabled)?.apply()
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        val act = activity ?: return@Function
        if (enabled) {
          applyRefreshRate(act)
        } else {
          resetRefreshRate(act)
        }
      }
    }

    Function("isSupported") {
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
    }
  }

  private fun applyRefreshRate(activity: Activity) {
    val display = activity.display ?: return
    val highRefreshRate = display.supportedModes.maxOfOrNull { it.refreshRate } ?: return
    updateRefreshRate(activity, highRefreshRate)
  }

  private fun resetRefreshRate(activity: Activity) {
    updateRefreshRate(activity, 60.0f)
  }

  private fun updateRefreshRate(activity: Activity, refreshRate: Float) {
    activity.window.attributes = activity.window.attributes.apply {
      // A refresh-rate preference allows Android to retain adaptive display
      // behavior instead of pinning the app to one physical display mode.
      preferredDisplayModeId = 0
      preferredRefreshRate = refreshRate
    }
  }
}
