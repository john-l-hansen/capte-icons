# Contributing to Capte Icons

Start with [README](README.md), [architecture](docs/architecture.md), and [AGENTS](AGENTS.md). Keep changes focused and use feature branches with reviewable pull requests.

## Local setup

Use Node.js 22.18+ and npm:

```sh
npm ci
npm run check
npm run dev
```

The preview opens at `http://127.0.0.1:4173`. Restart after code changes. Build outputs are ignored by Git. Import `apps/figma-plugin/dist/manifest.json` for local Figma development. Forks should assign their own Figma plugin ID using `npm run configure:plugin`.

## Before a pull request

- Explain the user-visible trigger and result.
- Run `npm run check` for renderer/controller changes.
- For UI changes, install Chromium with `npx playwright install chromium --only-shell` and run `npm run test:browser`.
- Record manual editor verification accurately; mocked controller checks do not prove Figma Desktop behavior.
- Update usage/release guidance when behavior changes.
- Preserve icon IDs and approved small-size geometry. Do not approximate missing artwork at runtime.
- Keep Grade and Color independent and both clients on the shared renderer.
- Keep unrelated Capte documents, credentials, and personal machine paths out of the public repository.

See [token refresh](docs/design-tokens.md) for interface exports and [releasing](docs/releasing.md) for packaging. Public project licensing, plugin Community publication, website deployment, and merging require the appropriate project authorization.
