# Changelog

## v1.0.6 — 2026-01-04

- **New**: Added "Output Language" setting to generate tags in different languages.
- **Improved**: Enhanced logging for easier debugging of configuration issues.

## v1.0.0 — 2025-08-23

### Added

- Logo integration in README and Webview header.
- Toggle command `toggleTagSuggesterPanel` with default shortcut: Ctrl+Shift+Y (macOS: Cmd+Shift+Y).
- TypeScript asset declaration for importing images.

### Changed

- Asset bundling via Webpack: ensure image assets are emitted and available to both main and webview builds.
- Webview UI adjustments to avoid header text overlap and provide graceful alt-text fallback.

### Build & Packaging

- Verified `npm run build` and `npm run dist` produce a working `.jpl` at `publish/com.cenktekin.ai-tag-suggester.jpl`.
- Non-blocking warnings from optional native modules in `ws` (`bufferutil`, `utf-8-validate`) are expected and safe to ignore.

### Notes

- Repository history was cleaned up and squashed into a single baseline commit before tagging `v1.0.0`.
