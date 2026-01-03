# Joplin AI Tag Suggester

<p align="center">
  <img src="https://raw.githubusercontent.com/cenktekin/joplin-auto-tagger/main/logo.png" alt="Joplin AI Tag Suggester" width="240" />
  <br/>
</p>

<p align="center">
  <a href="https://github.com/cenktekin/joplin-auto-tagger/actions/workflows/build.yml"><img alt="Build" src="https://github.com/cenktekin/joplin-auto-tagger/actions/workflows/build.yml/badge.svg?cacheSeconds=300" /></a>
  <a href="https://github.com/cenktekin/joplin-auto-tagger/releases"><img alt="Release" src="https://img.shields.io/github/v/release/cenktekin/joplin-auto-tagger?sort=semver&v=1" /></a>
  <a href="https://github.com/cenktekin/joplin-auto-tagger"><img alt="License" src="https://img.shields.io/github/license/cenktekin/joplin-auto-tagger?v=1" /></a>
  <a href="https://github.com/cenktekin/joplin-auto-tagger/releases"><img alt="Downloads" src="https://img.shields.io/github/downloads/cenktekin/joplin-auto-tagger/total?v=1" /></a>
  <a href="https://buymeacoffee.com/cenktekin"><img alt="Buy Me a Coffee" src="https://img.shields.io/badge/Buy%20me%20a%20coffee-FFDD00?logo=buymeacoffee&logoColor=000&labelColor=000&color=FFDD00" /></a>
</p>

Suggest relevant tags for your Joplin notes using AI.

Providers:

- Gemini (default)
- OpenRouter

## Installation

Prerequisites: Node.js, Joplin Desktop.

1. Install dependencies

```
npm install
```

2. Build the plugin and pack a .jpl

```
npm run dist
```

3. In Joplin Desktop, go to Tools → Options → Plugins → Install from file and select the generated .jpl in the `publish/` folder.

## Configuration

Open Joplin → Tools → Options → AI Tag Suggester.

Settings in `src/index.ts` are registered as Joplin settings:

- provider: "gemini" or "openrouter" (default: gemini)
- geminiApiKey: Your Google Gemini API key
- openrouterApiKey: Your OpenRouter API key
- openrouterModel: Model id (default: `openrouter/auto`)
- outputLanguage: Language for generated tags (default: `English`). Examples: "Traditional Chinese", "Turkish".

Notes:

- For Gemini, the plugin tries: `gemini-2.5-flash`, `gemini-1.5-flash`, `gemini-1.5-flash-8b`.
- For OpenRouter, the plugin calls `https://openrouter.ai/api/v1/chat/completions` with a structured prompt and expects JSON `{ "tags": string[] }`.

## Usage

1. Open any note in Joplin.
2. Tools → Toggle AI Tag Suggester to open the side panel. Shortcut: Ctrl+Shift+Y (macOS: Cmd+Shift+Y).
3. Click "Suggest Tags". The plugin will analyze the note and return 5 concise, lowercase, hyphenated tags.
4. Click tags to select/deselect, then "Apply" to add them to the note.

## Screenshots

![Side Panel](docs/screenshots/panel.png)
<small>AI Tag Suggester side panel opened via Tools → Toggle AI Tag Suggester.</small>

![Suggestions](docs/screenshots/suggestions.png)
<small>Suggested tags returned by the provider. Click to select/deselect.</small>

![Applied Tags](docs/screenshots/applied.png)
<small>Selected tags applied to the current note.</small>

![Settings](docs/screenshots/settings.png)
<small>Plugin settings under Tools → Options → AI Tag Suggester.</small>

## Development

Build:

```
npm run build
```

Pack distributable:

```
npm run dist
```

## Support

If you find this plugin useful and want to support development:

<a href="https://buymeacoffee.com/cenktekin" target="_blank"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=☕&slug=cenktekin&button_colour=FFDD00&font_colour=000000&font_family=Inter&outline_colour=000000&coffee_colour=ffffff" alt="Buy Me a Coffee" /></a>

## License

MIT
