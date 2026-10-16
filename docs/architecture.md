# Architecture and expansion contract

## One approved catalog

The visual sources are the approved three-icon pilot and the 60 named Figma masters. A read-only export and checked-in build recipes produce the checked-in runtime catalog; runtime clients never depend on a live Figma connection. Both clients use the same render function. A new release updates the catalog and both clients together.

Each icon has a stable ID, display name, category, search tags and twelve geometry templates: four sizes × three styles. Each part stores a semantic name, local transform, geometry, paint roles, stroke cap/join, dash pattern and detail-stroke flag. Numeric profiles supply weight and grade. Palette tokens supply colors. No variable font is required.

The pilot uses one geometry template per size/style with weight and grade applied to live strokes. If future artwork needs a different silhouette for a particular weight, extend the schema with an explicit geometry override and tests rather than silently inventing a new drawing.

## Plugin

The iframe UI sends settings, not arbitrary SVG, to the controller. The controller validates them and renders its own bundled catalog. SVG import creates native editable artwork. Plugin metadata stores schema version, catalog version and selected settings. Selection resolves a single generated child to its owning icon frame. Every control and catalog choice updates the owned selection live. Update messages carry the intended root ID; the controller rejects a stale target, and same-root selection events do not reload older UI settings. Insert replaces a single owned selection, or creates a new frame when none is selected. Each mutation commits an undo checkpoint. Updates retain the existing root frame and regenerate its children, resizing without applying child constraints. Before committing artwork, the controller converts every live stroke to filled paths and binds solid fills to the approved Capte color variables. It reuses local source variables, attempts library imports by stable keys, and falls back to a plugin-owned local collection when unavailable. Token creation is reused without overwriting edited values. Imports and updates are serialized and the selection is rechecked after asynchronous work. The compact plugin uses the Light palette.

## Website

The static explorer shares UI controls and rendering with the plugin. It supports search, category filtering, previews, SVG download and clipboard copy. The documentation provides installation, usage, accessible integration guidance and release history. Deployment and a production domain are intentionally separate from the build.

## Limits and next steps

- Validate the actual plugin in Figma Desktop before distributing it.
- Add approved icons in batches with comparison renders at all sizes and styles.
- Add linked library-instance insertion only after publication/access requirements are settled.
- Decide the distribution license and release ownership before a public release.
- Preserve backward-compatible IDs and introduce explicit migrations for future schema changes.

## Shared interface tokens

`packages/ui/design-tokens.json` records Figma variable IDs, resolved Light/Dark values, and text-style IDs. `scripts/design-tokens.mjs` emits CSS custom properties; the build fails for undefined references. Layout rules reference these properties for colors, typography, spacing, radii and focus treatment. The approved catalog supplies the separate icon preview container colors. Fonts and license notices are inlined into the self-contained plugin UI and static stylesheet. See `docs/design-tokens.md` for refresh instructions and structural layout exceptions.


## Full-catalog preview pipeline

`export-masters.figma.js` reads 48 dp Medium source components into `packages/icons/source-masters.json`. All 60 source sets were checked: their three weight variants share the same geometry. `python3 scripts/build-catalog.py` preserves the three pilot definitions and generates the other 57 icons, scaling path coordinates and translations while reusing size/weight/grade profiles. The scaler rejects unsupported path commands rather than changing arc flags incorrectly.

Outline removes the light body fill but retains surface occlusion. Filled changes body fills to ink and uses explicit per-part contrast roles; upload and percentage marks have local knockout clearances. These are preview treatments, not newly approved Figma masters. `recipes.json` records source IDs and derivation. Raw colors in the legacy database icon are mapped to existing semantic roles.

Run the builder again after a source export, review the artwork, run checks, and commit the source snapshot, recipes and catalog together. Do not re-export the pilot unless its artwork is intentionally being revised. Fingerprint tests protect the three approved definitions. The runtime remains independent of a live Figma connection.
