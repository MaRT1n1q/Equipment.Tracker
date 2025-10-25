# Build resources

This folder now ships with ready-to-use platform icons generated from `new_icon.png` (1024×1024):

- `icon.ico` — Windows installer icon (multi-size, includes 256×256).
- `icon.icns` — macOS app iconset (optimized for Retina displays).
- `icon.png` — PNG fallback used by Linux desktop environments.
- `new_icon.png` — Master artwork provided by design.

To update the artwork, replace `new_icon.png` with a square PNG (≥512×512) and run:

```powershell
npx icon-gen -i build/new_icon.png -o build --ico --icns
Copy-Item build/new_icon.png build/icon.png -Force
```

Electron Builder automatically picks up these files during packaging. If you remove them, the default Electron icon will be used instead.
