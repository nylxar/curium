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

- Expo 55
- React Native 0.83
- Expo Router
- React Native Reanimated
- Expo Camera, Media Library, Sharing, Clipboard, and Image Picker
- TypeScript

## Getting Started

### Prerequisites

- Node.js 22 or newer
- npm
- Expo development tooling
- Android Studio or a connected Android device/emulator for local Android runs

### Installation

```bash
npm install
```

### Run Locally

```bash
npm run start
```

Then choose a target from the Expo CLI, or run Android directly:

```bash
npm run android
```

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

## Android APK Split Builds

The GitHub workflow in `.github/workflows/android-apk-splits.yml` builds release APKs split by screen density and CPU architecture.

It runs on:

- Manual dispatch from the GitHub Actions tab.
- Version tag pushes that match `v*`, such as `v1.0.0`.

The workflow:

1. Installs dependencies with `npm ci`.
2. Generates the native Android project with `expo prebuild`.
3. Enables Gradle density splits for `ldpi`, `mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, and `xxxhdpi`.
4. Enables ABI splits for `armeabi-v7a`, `arm64-v8a`, `x86`, and `x86_64`.
5. Uploads the generated APK files as the `curium-android-apk-splits` artifact.

## Notes

- Native `/android` and `/ios` folders are intentionally generated and ignored.
- App data is stored locally on the device.
- Camera and media permissions are requested only for scanning, picking logos, and saving QR images.

## License

No license has been declared yet.
