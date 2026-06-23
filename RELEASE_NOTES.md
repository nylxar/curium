# Release Notes — v0.5.7 (Stable)

## What's New

- Templates — save and reuse QR style configurations with one tap
- SVG vector export — infinite quality scaling for print and design
- What's New screen — shows changelog automatically on app updates
- Welcome screen — first-launch intro with app philosophy
- Support screen — Ko-fi, PayPal, and Gumroad links
- Smooth theme transitions — cross-fade without flash or flicker
- Logo shadow now off by default for cleaner look
- New scanner module — replaced expo-camera/ZXing with VisionCamera + MLKit for better performance and detection
- QR eye and pupil shape overhaul — more styles, adaptive rendering, better scannability
- Nav bar now respects theme background color
- What's New screen Done button no longer unresponsive
- Gallery scan coming soon — the new scanner module hasn't published static image scanning yet, feature is in the main repo waiting for next release

## Fixes

- Theme transition flicker on both dev and production builds
- Template save button unresponsive inside ScrollView
- Toast z-index — now always renders above modals
- Last row border spacing in settings and info screens
- SVG export shared as document for WhatsApp/Signal/Telegram compatibility
- Nav bar text clipping removed
- Write permissions stripped from manifest
- Camera "not active" error on scan screen
- Gallery scan gracefully shows upcoming feature message
- QR entrance animation plays correctly on first load
- History reloads when returning to screen

## NOTE
- Upload from gallery feature is not available right now. Curium has moved to a new scanning module for improved performance and detection, but that module hasn't published gallery scanning yet. The feature is already in the main repo — we just need to wait for the next release.
