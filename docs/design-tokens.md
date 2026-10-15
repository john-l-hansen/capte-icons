# Interface tokens

Source: Capte design system.

The versioned `packages/ui/design-tokens.json` snapshot was exported from the design system on 2026-10-15. It retains variable IDs, collection/mode names, resolved Light/Dark values, and text-style definitions/IDs. Aliases are resolved through the referenced variable and matching mode, including references not returned by the local-variable listing.

| Interface role | Figma source |
| --- | --- |
| Page, surfaces, dividers | Background and Border semantic collections |
| Main, secondary, error, brand text | Text semantic collection |
| Primary action, hover/pressed, link, dark orange foreground | Interactive semantic collection |
| Padding, gaps, rhythm | Spacing and Semantic Spacing |
| Corners | Border Radius |
| Type | Roboto Heading/H4–H6, Body/Small/Regular, Text/Label, Text/Eyebrow, Text/Fine Print, and Roboto Mono Text/Label/Technical |
| Icon preview canvas | Existing approved catalog's icon/container palette |

`scripts/design-tokens.mjs` generates CSS custom properties during `npm run build`. `packages/ui/styles.css` references them for visual values. Builds reject undefined token references. Light/Dark changes affect the entire documentation page as well as the plugin; Grade remains independent.

Structural rules—viewport breakpoints, maximum widths, grid columns, flex behavior, and resets—are client layout decisions rather than invented Figma tokens. Thin borders derive from spacing/half. Typography prefers the exact named text style when its tracking differs from the Type Scale variable. No unsupported shadows are added.

## Refresh

1. Run `scripts/export-design-tokens.figma.js` in an authorized Plugin API environment against the source file. For output-limited environments, export collection batches and merge them with the shared source/text-style metadata.
2. Replace `packages/ui/design-tokens.json` with the reviewed result, retaining source IDs. Do not hand-edit CSS hex values.
3. Run `npm run check` and `npm run test:browser`, compare Light/Dark interfaces, and review the token diff.
4. Rebuild/reinstall the plugin and publish a website build only through the normal approved release workflow.

This is a build-time snapshot, not a live connection to Figma variables. Installed plugin interfaces update only when a new build is installed. Inserted icon colors remain editable snapshots, as before.

Roboto Latin 400/500/700 and Roboto Mono Latin 500 are bundled as WOFF2 files. `fonts/sources.json` records their Fontsource package versions; upstream notices are retained and embedded in generated styles. No external font request or system font installation is required. This does not select a distribution license for the project itself.
