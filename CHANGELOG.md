# Changelog

## v1.0.6 — 2026-01-04

- **New**: Added "Output Language" setting to generate tags in different languages.
- **Improved**: Enhanced logging for easier debugging of configuration issues.
- **Migration**: Published under new scoped package name `@cenktekin2008/joplin-plugin-ai-tag-suggester`.

## v1.0.5 — 2025-08-23

- **Docs**: Added plugin screenshots and the promo tile required by the Joplin plugin directory.

## v1.0.4 — 2025-08-23

- **Release**: Added the tags category so the plugin is listed under tagging in the Joplin plugin directory.

## v1.0.3 — 2025-08-23

- **Packaging**: Ship `docs/` in the npm package so README screenshots render on npmjs.com.

## v1.0.2 — 2025-08-23

- **Packaging**: Ship `publish/` in the npm package (required by the Joplin plugin repository).

## v1.0.1 — 2025-08-23

- **Metadata**: Root `manifest.json` is generated on publish; repository and homepage links corrected.

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
