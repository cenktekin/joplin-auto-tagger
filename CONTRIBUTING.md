# Contributing

Thanks for your interest in contributing!

## Development Setup
- Requires Node.js and Joplin Desktop
- Install deps: `npm install`
- Build: `npm run build`
- Package: `npm run dist` (outputs `.jpl` in `publish/`)

## Commit Messages
- Conventional Commits (e.g., `feat:`, `fix:`, `docs:`, `chore:`)

## Pull Requests
- Keep PRs small and focused
- Include screenshots/GIFs if UI changes
- Update docs (README/CHANGELOG) when relevant
- Ensure `npm run build` passes locally

## Issues
- Use the templates (Bug / Feature)
- For bugs, include steps to reproduce, expected vs. actual, logs if possible

## Code Style
- TypeScript for main code, React in webview
- Prefer clear, descriptive names
- Add comments for non-obvious logic

## Release Process (maintainers)
- Bump version/tag
- `npm run dist` and attach the `.jpl` to the GitHub Release
- Update CHANGELOG
