# Architecture and expansion contract

## One approved catalog

The visual source is the approved Figma pilot. A deliberate export produces the checked-in runtime catalog; runtime clients never depend on a live Figma connection. Both clients use the same render function. A new release updates the catalog and both clients together.

Each icon has a stable ID, display name, category, search tags and twelve geometry templates: four sizes × three styles. Each part stores a semantic name, local transform, geometry, paint roles, stroke cap/join, dash pattern and detail-stroke flag. Numeric profiles supply weight and grade. Palette tokens supply colors. No variable font is required.

The pilot uses one geometry template per size/style with weight and grade applied to live strokes. If future artwork needs a different silhouette for a particular weight, extend the schema with an explicit geometry override and tests rather than silently inventing a new drawing.

## Plugin

The iframe UI sends settings, not arbitrary SVG, to the controller. The controller validates them and renders its own bundled catalog. SVG import creates native editable artwork. Plugin metadata stores schema version, catalog version and selected settings. Selection resolves a single generated child to its owning icon frame. Every control and catalog choice updates the owned selection live. Update messages carry the intended root ID; the controller rejects a stale target, and same-root selection events do not reload older UI settings. Insert always creates a new frame. Each mutation commits an undo checkpoint. Updates retain the existing root frame and regenerate its children, resizing without applying child constraints. Theme changes use fixed palette colors; no variable binding or library access is assumed in the destination file.

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
