# Build resources

This folder contains ready-to-use platform icons (1024×1024):

- `icon.ico` — Windows installer icon (multi-size, includes 256×256).
- `icon.icns` — macOS app iconset (optimized for Retina displays).
- `icon.png` — Master PNG artwork used by Linux desktop environments.

To update the artwork, replace `icon.png` with a square PNG (≥512×512) and regenerate platform-specific icons:

```powershell
npx icon-gen -i build/icon.png -o build --ico --icns
```

Electron Builder automatically picks up these files during packaging. If you remove them, the default Electron icon will be used instead.
