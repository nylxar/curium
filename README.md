# Curium

Curium is a privacy-first QR code generator and scanner built with Expo and React Native. It creates styled QR codes for common real-world payloads, keeps history locally on-device, and works without analytics or network-backed services.

## Features

- Generate QR codes for URLs, text, Wi-Fi credentials, email, phone, SMS, contacts, and locations.
- Customize colors, QR pixel style, eye style, error correction, and optional logo overlays.
- Scan QR codes and barcodes with camera support, torch control, copy/open actions, and load scanned data back into the generator.
- Save, share, and export generated QR codes.
- Browse and search local QR history.
- Choose light, dark, system, or dynamic themes.
- Offline-first storage using device-local AsyncStorage.

## Tech Stack

- Expo SDK 56
- React Native 0.85
- Expo Router
- React Native Reanimated
- Expo Camera, Media Library, Sharing, Clipboard, and Image Picker
- TypeScript

## Getting Started

### Prerequisites

- Node.js 22 or newer
- pnpm
- Expo development tooling
- Android Studio or a connected Android device/emulator for local Android runs

### Installation

```bash
pnpm install
```

### Run Locally

```bash
pnpm start
```

Then choose a target from the Expo CLI, or run Android directly:

```bash
pnpm android
```

## Build Variants

Curium ships three Android build variants that can be installed side-by-side. Each has a unique application ID and a distinct launcher icon color.

| Variant | Application ID | Icon Color | Purpose |
|---------|---------------|------------|---------|
| Stable | `com.nylxar.curium.stable` | Blue | Production releases |
| Preview | `com.nylxar.curium.preview` | Orange | Pre-release testing |
| Nightly | `com.nylxar.curium.nightly` | Red | Automated daily builds |

### Expo Development Client

To build a development APK for local development with the Expo dev client:

```bash
eas build --platform android --profile development
```

This produces an APK with the base application ID (`com.nylxar.curium`) and includes the Expo development tools.

## CI/CD

The GitHub Actions workflow (`.github/workflows/android-apk-splits.yml`) builds release APKs with ABI splits for `armeabi-v7a`, `arm64-v8a`, `x86_64`, and a universal APK.

### Triggers

| Event | Flavor | Creates Release |
|-------|--------|-----------------|
| Push tag `v*` | stable | Yes |
| Manual dispatch (selectable) | stable / preview / nightly | No |
| Cron schedule (daily 3 AM UTC) | nightly | No |

### How It Works

1. Installs dependencies with `pnpm install --frozen-lockfile`.
2. Generates the native Android project with `expo prebuild`.
3. A Python script injects product flavors, release signing config, and ABI splits into the generated `build.gradle`.
4. Builds the selected flavor's release APKs.
5. On tag push, creates a GitHub Release and uploads the APKs.

### Secrets

The following repository secrets are required:

| Secret | Description |
|--------|-------------|
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded release keystore file |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias in the keystore |
| `ANDROID_KEY_PASSWORD` | Key password |

## Project Structure

```text
app/                 Expo Router screens
components/qr/       QR creation, styling, export, and navigation controls
components/ui/       Shared UI primitives
constants/           Theme and QR presets
context/             Theme and app state providers
services/            Local history persistence
types/               QR payload and style types
assets/              Icons, splash assets, and fonts
```

## Notes

- Native `/android` and `/ios` folders are intentionally generated and ignored.
- App data is stored locally on the device.
- Camera and media permissions are requested only for scanning, picking logos, and saving QR images.

## License

Curium is licensed under the GNU General Public License v3.0. See `LICENSE` for the full text.
