# Release Notes — v0.0.6 (Preview)

## What's New

### QR Generator
- Generate QR codes for URLs, text, Wi-Fi credentials, email, phone, SMS, contacts, and locations
- Customize QR foreground/background colors with a full color picker
- QR pixel styles: square, dots, rounded, extra-rounded, diamond
- QR eye styles: square, rounded, circle
- Error correction levels: L, M, Q, H
- Adjustable QR corner radius (sharp → pill)
- Optional logo overlay with size control, replace/remove, and position dragging
- Logo background shape: rounded, circle, or none
- Logo border and shadow toggles
- Live preview updates as you edit

### QR Scanner
- Scan QR codes and barcodes (EAN-13, EAN-8, Code 128, Code 39, PDF417, Aztec, Data Matrix)
- Camera torch toggle
- Scan from gallery images
- Scanned data auto-loads into the generator
- Copy or open scanned content directly

### Dynamic Theme
- Light, dark, system, and dynamic themes
- Dynamic mode syncs the entire UI to your QR's background color
- Pure Black (AMOLED) enhancement for OLED screens
- Smooth cross-fade transitions between themes

### History
- Auto-saves every generated QR code
- Swipe-to-delete individual entries
- Clear all history with confirmation
- Search by content or type
- Staggered card animations

### Export
- Save QR as PNG to gallery
- Share QR image via any app
- Copy QR content to clipboard
- Export QR data as text file

### Polish
- Custom splash screen with logo animation
- IBM Plex Mono typeface throughout
- Haptic feedback on interactions
- Skeleton loading states
- Minimal permissions — no microphone access

## Fixes

- Fixed nav bar text clipping on Android production builds
- Fixed theme transition flash during screen navigation
- Fixed logo position drift after style changes
- Fixed QR gallery scan from images
- Fixed text selection color in inputs
- Logo shadow defaults to off
- Removed WRITE_EXTERNAL_STORAGE permission
- Stripped RECORD_AUDIO from manifest via config plugin

## Supported Devices

- Android 6.0+ (API 23+)
- armeabi-v7a, arm64-v8a, x86_64
