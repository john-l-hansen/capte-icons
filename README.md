# Capte Icons

**Figma icons, with intention.** A shared Capte icon catalog, button-driven editing Figma plugin, and companion icon explorer.

[![Checks](https://github.com/john-l-hansen/capte-icons/actions/workflows/check.yml/badge.svg)](https://github.com/john-l-hansen/capte-icons/actions/workflows/check.yml)

**Catalog preview: 0.2.0-beta.1 · 60 icons · Editor review pending**

This branch expands the shared catalog from three pilot icons to all 60 named Figma masters. It preserves the pilot artwork and button-driven insert/update behavior. New sizes use proportional paths and the existing stroke profiles; individual optical refinements are still a design-review step. See the [catalog review and inventory](docs/catalog-review.md).

The published download remains the earlier **three-icon v0.1.13**. The full-catalog beta is prepared for review and has not been published as a GitHub release or Figma Community plugin.

[Earlier v0.1.13 download](https://github.com/john-l-hansen/capte-icons/releases/download/v0.1.13/capte-icons-figma-plugin-0.1.13.zip) · [Installation](INSTALL.md) · [Usage](docs/usage.md) · [Catalog review](docs/catalog-review.md)

<p align="center"><img src="docs/images/plugin-preview-v0.1.13.png" width="360" alt="Capte Icons plugin showing category and search, weight, style, grade, optical size, and three pilot icons"></p>

*Earlier three-icon v0.1.13 interface, captured from the built plugin UI with an icon selected. Changes apply when Update icon is pressed.*

## For the team: install and try it

**You need Figma Desktop. You do not need Node.js, an API key, or access to the source design file.**

1. Download the **capte-icons-figma-plugin-0.1.13.zip** asset from the release above. GitHub's automatic “Source code” downloads are for developers.
2. Extract the ZIP into a permanent folder, such as `Documents/Capte Icons`. Keep `manifest.json`, `code.js`, and `ui.html` together.
3. Open a Figma Design file in Figma Desktop. Choose **Plugins → Development → Import plugin from manifest…** and select that `manifest.json`.
4. Run **Capte Icons** (the older release is named **Capte Icons — Pilot**) from **Plugins → Development**.

[Installation, updating, and troubleshooting →](INSTALL.md)

## How it works

- Choose an icon and settings, then click **Insert icon** to create an editable vector icon.
- Select an inserted Capte icon—or a vector inside it—to load its settings. Controls and catalog choices update the preview; press **Update icon** to apply them.
- New icons center on selected objects, or the overall frame beneath the viewport center when deselected. Empty canvas uses the viewport center.
- **Update icon applies your choices to the selected plugin-generated Capte icon**. Deselect it to insert another.
- With no Capte icon selected, controls change the preview until you insert.

| Control | Options |
| --- | --- |
| Optical size | 20, 24, 40, 48 dp |
| Weight | Thin, Medium, Heavy |
| Grade | Dark, Normal, Emphasis |
| Style | Outline, Filled, Duotone |

Grade changes thickness independently of Style. The plugin uses the Light palette and a simplified interface; the website explorer retains its palette control. The original three icons retain approved small-size geometry. The full catalog supports **12,960 configurations** from 720 geometry templates and 24 stroke profiles; the Light-only plugin exposes 6,480. The 57 additions use proportional geometry at each size and need individual optical review.

Updating retains the root frame, parent, position, and rotation while replacing generated children. **Manual edits inside an icon are overwritten when Update icon is pressed.** Unrelated artwork, multiple selections, and locked root layers are not overwritten.

Inserted icons use editable filled vector paths with outlined strokes. Colors bind to the approved published Capte variables when accessible; otherwise the plugin creates reusable local `Capte Icons` variables. Local tokens do not sync with the source library. Icons are not linked component instances and do not automatically receive new geometry.

## Preview status and feedback

| Verified | Still to confirm |
| --- | --- |
| v0.1.13 approved by the project owner for team release on October 16, 2026 | Broader team testing, including undo/redo and variable recovery |
| TypeScript, 32 renderer/controller tests, all 12,960 configurations, both builds | Detailed artwork comparison and small-size refinements in the editor |
| Chromium checks: full catalog search/filter, preview-only controls, explicit updates, downloads, and layouts | Installed beta acceptance with the team |
| 120 native Figma SVG import/outline/token probes, plus targeted checks after artwork fixes | Community distribution and production website |

Automated controller tests use a mocked Figma API. The [editor acceptance checklist](docs/acceptance.md) records the remaining checks. Try the preview in a working copy of a design file and report the icon, settings, version, and what happened using [a bug report](https://github.com/john-l-hansen/capte-icons/issues/new?template=bug_report.yml).

## Project guide

| I want to… | Start here |
| --- | --- |
| Install or update the plugin | [Installation](INSTALL.md) |
| Understand controls and updating | [Usage](docs/usage.md) |
| See what's changed | [Changelog](CHANGELOG.md) and [0.1.13 notes](releases/0.1.13.md) |
| See what's next | [Roadmap](docs/roadmap.md) |
| Build or contribute | [Contributing](CONTRIBUTING.md) |
| Understand shared artwork and rendering | [Architecture](docs/architecture.md) |
| Refresh interface tokens from Figma | [Design tokens](docs/design-tokens.md) |
| Package the next team preview | [Maintainer release guide](docs/releasing.md) |

## For developers

Requires Node.js **22.18+** and npm. Release packaging also uses Python 3.

```sh
npm ci
npm run check
npm run dev
```

Open **http://127.0.0.1:4173** for the local icon explorer and documentation. It supports SVG download/copy. The preview server builds once; restart it after code changes. The website has not been deployed.

```sh
npx playwright install chromium --only-shell
npm run test:browser
npm run package:release
```

`npm run build` outputs the plugin under `apps/figma-plugin/dist` and website under `apps/docs/dist`. Import the built manifest directly when developing. The assigned plugin ID is `1692625788103724528`. Forks should create their own development plugin and use `npm run configure:plugin -- YOUR_NUMERIC_FIGMA_PLUGIN_ID` before rebuilding.

| Path | Purpose |
| --- | --- |
| `packages/icons` | Source paths, catalog, recipes, renderer, validation, and search |
| `packages/ui` | Shared explorer, exported design tokens, bundled fonts |
| `apps/figma-plugin` | Figma controller and UI entry point |
| `apps/docs` | Website explorer and documentation |
| `scripts` | Build, packaging, and read-only Figma exports |
| `tests` | Renderer, controller, and browser checks |

## Design source and delivery

Figma is the artwork approval surface. The versioned catalog powers both clients. Interface styles use exported Capte semantic colors, Roboto text styles, spacing, and radii. Tokens and fonts are bundled, so the plugin runs offline and requests no network access. Token and catalog changes require a rebuilt plugin; they do not sync automatically into installed copies.

GitHub Releases are the download source for team previews. A future Capte brand assets page should link to that release asset rather than maintain a separate copy. Community publication, website deployment, and a project distribution license remain separate decisions. Bundled font notices are retained in `packages/ui/fonts` and in the build.
