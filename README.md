# Capte Icons

A shared icon catalog, Figma plugin, and interactive documentation explorer. The development pilot uses **Search, Shield Lock, and Location Check**, exported from the approved Capte Figma artwork.

## Start here

Requires Node.js 22.18+ and npm. Open this repository in Antigravity, Codex, or your preferred editor.

```sh
npm ci
npm run check
npm run dev
```

Open **http://127.0.0.1:4173** for the explorer and documentation. `npm run dev` builds once and starts the preview server; restart it after code changes. No accounts, API keys, or remote asset services are needed to run the preview or plugin.

## Load the Figma development plugin

1. The manifest is configured for the Capte development plugin, ID `1692625788103724528`.
2. In this repository, install dependencies and build:

   ```sh
   npm ci
   npm run build
   ```

3. In Figma Desktop, use **Plugins → Development → Import plugin from manifest** and choose `apps/figma-plugin/dist/manifest.json`.
4. Run **Capte Icons — Pilot**, select an icon, customize it, and click **Insert icon**.
5. Select an inserted icon to load its settings. Change the controls and click **Update selected**.

For a separate development plugin or fork, create a plugin in Figma Desktop and run `npm run configure:plugin -- YOUR_NUMERIC_FIGMA_PLUGIN_ID`. That local override lives in the ignored `.figma-plugin-id` file. The checked-in manifest uses the assigned Capte plugin ID. This project has not been published to Figma Community.

## Controls

| Control | Values |
| --- | --- |
| Optical size | 20, 24, 40, 48 px |
| Weight | Thin, Medium, Heavy |
| Grade | Dark theme, Normal, Emphasis |
| Style | Outline, Filled, Duotone |
| Color | Light background, Dark background |

Grade and Color are independent. Small-size templates preserve approved optical adjustments instead of scaling a single drawing. The catalog contains 36 geometry templates and 24 stroke profiles; these produce **648 supported configurations** across the three icons.

The plugin inserts editable vector frames with fixed colors and live strokes. It records icon ID, catalog version, and settings in private plugin metadata. Updating replaces generated children while retaining the root frame ID, parent, position, and rotation. Manual edits to generated children are overwritten. Arbitrary SVGs, components from other plugins, multi-selections, and locked root layers are not updated.

These inserted icons are snapshots. They are not linked library instances, do not bind to the destination file's Figma variables, and do not automatically receive catalog updates.

## Project layout

| Path | Purpose |
| --- | --- |
| `packages/icons` | Approved geometry, token profiles, renderer, validation and search |
| `packages/ui` | Shared explorer interface used by the plugin and website |
| `apps/figma-plugin` | Plugin controller, UI entry point and manifest |
| `apps/docs` | Browser explorer, installation instructions, guide and release notes |
| `scripts` | Build, local preview, plugin configuration and artwork export |
| `tests` | Renderer, controller and browser checks |

`npm run build` writes self-contained plugin files under `apps/figma-plugin/dist` and static website files under `apps/docs/dist`. No deployment occurs. The plugin bundles its catalog and UI and requests no network access. The website can later be hosted as static files or integrated with the Capte documentation site.

## Artwork source and releases

- [Approved Figma pilot](https://www.figma.com/design/oFZw7IVtiURZG2x5XhAKyD/Capte-Design-System?node-id=3637-27)
- [Original icon library](https://www.figma.com/design/oFZw7IVtiURZG2x5XhAKyD/Capte-Design-System?node-id=3614-1889)

Figma is the artwork approval surface. `packages/icons/catalog.json` is the versioned runtime source used by both clients. Use `scripts/export-pilot.figma.js` in an authorized Plugin API environment to collect the approved pilot geometry and tokens; save its result as the catalog. The export script intentionally targets known pilot masters and fails on missing or unsupported data. Extend that mapping when new icons are approved. It does not publish or modify the artwork.

Keep IDs stable. Review changed geometry in both clients, increment the catalog version for releases, and record changes in `CHANGELOG.md`. New icons need explicit small-size artwork and style decisions. Do not approximate missing templates at runtime.

## Verification

```sh
npm run check
npx playwright install chromium --only-shell
npm run test:browser
```

The first command type-checks the code, exercises all 648 configurations, verifies search and metadata validation, checks update behavior using a mocked Plugin API, and builds both clients. Browser checks verify filtering, controls, download dimensions, preference persistence, the plugin UI bridge, and narrow layouts. Screenshots are saved under `tests/artifacts/`.

Before a release, complete the manual Figma Desktop checklist in `docs/acceptance.md`. Automated controller tests and SVG checks do not replace testing a development plugin in the editor.

## Development status

This is the three-icon workflow pilot, not the full icon collection. The next milestone is validating the development plugin in Figma Desktop, then expanding the catalog in reviewed batches. Linked component insertion and public Community distribution are later milestones.

No distribution license has been selected.
