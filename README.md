<p align="center">
  <img src="assets/icon.png" alt="Curium" width="100" />
</p>

<h1 align="center">Curium</h1>

<p align="center">
  Modern, privacy-first QR customizer.<br/>
  No analytics. No network. Just your codes.
</p>

<p align="center">
  <img src="https://badgen.net/github/release/nylxar/curium?labelColor=111&color=555" alt="Latest Release" />
  <img src="https://badgen.net/badge/platform/Android%207%2B/111?labelColor=111&color=555" alt="Platform" />
  <img src="https://badgen.net/badge/license/GPL-3.0/111?labelColor=111&color=555" alt="License" />
  <img src="https://badgen.net/badge/SDK/56/111?labelColor=111&color=555" alt="SDK" />
</p>

---

### Screenshots

<table>
  <tr>
    <td><img src="https://res.cloudinary.com/dge9abfkx/image/upload/v1781208451/Frame_1_vfw5ud.png" alt="Generator" width="100%" /></td>
    <td><img src="https://res.cloudinary.com/dge9abfkx/image/upload/v1781208460/Frame_2_qcdvcj.png" alt="Customizer" width="100%" /></td>
    <td><img src="https://res.cloudinary.com/dge9abfkx/image/upload/v1781208457/Frame_5_l7ofud.png" alt="Save" width="100%" /></td>
  </tr>
  <tr>
    <td><img src="https://res.cloudinary.com/dge9abfkx/image/upload/v1781208458/Frame_4_xmond3.png" alt="Setup" width="100%" /></td>
    <td><img src="https://res.cloudinary.com/dge9abfkx/image/upload/v1781208462/Frame_6_zxb0kt.png" alt="About" width="100%" /></td>
    <td><img src="https://res.cloudinary.com/dge9abfkx/image/upload/v1781208463/Frame_7_lsttw9.png" alt="Scan" width="100%" /></td>
  </tr>
</table>

---

<p align="center">
  <a href="https://github.com/nylxar/curium/releases/latest">
    <img src="https://badgen.net/github/release/nylxar/curium?label=download&labelColor=111&color=555&logo=android" alt="Download" />
  </a>
  &nbsp;
  <img src="https://api.visitorbadge.io/api/visitors?path=nylxar%2Fcurium&label=downloads&style=flat&countColor=%23555&labelColor=%23111" alt="Downloads" />
</p>

> **Preview builds** may feel rough or unpolished and may contain bugs. They are intended for early testing and feedback. For stable use, wait for a release tagged `v*` without a pre-release label.

---

## Features

### QR Generator
- **8 payload types** — URL, text, Wi-Fi, email, phone, SMS, contact, location
- **Pixel styles** — square, dots, rounded, extra-rounded, diamond
- **Eye styles** — square, rounded, circle
- **Error correction** — L, M, Q, H
- **Corner radius** — sharp → pill (5 levels)
- **Logo overlay** — pick from gallery, resize, reposition by drag
- **Logo background** — rounded, circle, or none
- **Logo border & shadow** — toggle independently
- **Randomize** — shuffle all colors and styles instantly
- **Live preview** — updates as you edit

### QR Scanner
- **Camera scan** — QR codes + barcodes (EAN-13, EAN-8, Code 128, Code 39, PDF417, Aztec, Data Matrix)
- **Gallery scan** — pick an image, detect code automatically
- **Torch toggle** — low-light scanning
- **Scan to customize** — scan any existing QR code, load it into the generator, change colors, style, logo, and export a new version

### Themes
- **Light / Dark / System** — follows device preference
- **Dynamic** — UI syncs to your QR's background color
- **Pure Black** — AMOLED enhancement for OLED screens
- **Smooth transitions** — cross-fade between themes

### History
- **Auto-save** — every QR you create is stored locally
- **Swipe-to-delete** — remove individual entries
- **Clear all** — with confirmation dialog
- **Search** — filter by content or type

### Export
- **Save to gallery** — PNG, high quality
- **Share** — send via any installed app
- **Copy content** — clipboard
- **Export data** — text file

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 56, React Native 0.85 |
| Navigation | Expo Router |
| Animations | React Native Reanimated 4 |
| Camera | expo-camera |
| Storage | AsyncStorage (offline-first) |
| Language | TypeScript |
| Typeface | IBM Plex Mono |

---

## Build Variants

| Variant | Application ID | Purpose |
|---------|---------------|---------|
| **Stable** | `com.nylxar.curium.stable` | Production releases |
| **Preview** | `com.nylxar.curium.preview` | Pre-release testing |
| **Nightly** | `com.nylxar.curium.nightly` | Automated daily builds |

---

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm
- Android Studio or a connected device

### Install

```bash
git clone https://github.com/nylxar/curium.git
cd curium
pnpm install
```

### Run

```bash
pnpm start
# or
pnpm android
```

### Build Release APK

Releases are built automatically via GitHub Actions. To trigger a build:

- **Stable**: Push to `master` or create a `v*` tag
- **Preview**: Push to `preview`
- **Manual**: Go to Actions → Android APK Splits → Run workflow

Or download the latest APK directly from [Releases](https://github.com/nylxar/curium/releases).

---

## CI/CD

The GitHub Actions workflow builds release APKs with ABI splits (`armeabi-v7a`, `arm64-v8a`, `x86_64`, universal).

| Trigger | Flavor | Release |
|---------|--------|---------|
| Push to `master` (code changes only) | stable | Yes |
| Push tag `v*` | stable | Yes |
| Push to `preview` (code changes only) | preview | Yes |
| Daily cron (3 AM UTC) | nightly | No |
| Manual dispatch | selectable | No |

---

## Project Structure

```
app/                 Expo Router screens
components/qr/       QR creation, styling, export, navigation
components/ui/       Shared UI primitives (sheets, toasts, overlays)
constants/           Theme tokens and QR presets
context/             Theme provider
services/            Local history and settings persistence
types/               QR payload and style types
plugins/             Expo config plugins
scripts/             Build info generator
assets/              Fonts, icons, splash assets
```

---

## Permissions

| Permission | Why |
|-----------|-----|
| `CAMERA` | QR code scanning |
| `READ_MEDIA_IMAGES` | Gallery scan & logo picker |

No microphone. No location. No network access.

---

## License

[GNU General Public License v3.0](LICENSE)

---

<p align="center">
  Built with care. No telemetry. No accounts. Just codes.
</p>
