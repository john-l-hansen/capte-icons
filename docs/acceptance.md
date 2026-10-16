# Pilot acceptance — 0.1.7

## Verified

- `npm run check`: TypeScript, 17 renderer/controller tests, all 648 renderer configurations, and both builds.
- `npm run test:browser`: search/category combinations, controls, live messages, guarded insertion/replacement requests, dp labels, absence of header/color controls, documentation placeholder with no href, preference restoration, SVG downloads, and compact layout.
- Native Figma API probe: all three duotone pilot icons at 48 produced filled outlined geometry, no live strokes, and unchanged 48 × 48 roots. Temporary probe nodes were removed.

Controller tests use a mock Plugin API. The native probe verifies outline conversion only; it does not establish an installed-plugin acceptance pass.

## Owner's Figma Desktop review

1. Install the supplied 0.1.7 ZIP and reopen the plugin. Confirm category/search, four controls, and the documentation row, which must not navigate.
2. Insert each icon at 20, 24, 40, and 48 dp. Confirm matching numeric frame dimensions.
3. Compare all styles, weights, and grades, especially small lock/badge details. Inspect child shapes: no live strokes; editable filled paths.
4. Inspect fill bindings. When the source is unpublished, confirm one local Capte Icons collection is reused. Edit a local color, confirm existing artwork follows it, and insert again to ensure its value is not reset.
5. With the source library published and accessible, confirm imported variables are used. Reopen after publication to retry imports; reapply settings to rebind older icons.
6. Select an inserted icon or child path; change controls and choose another icon to confirm live replacement. Insert icon must replace that root. Deselect and insert to add another.
7. Check parent, position, rotation, and root ID, including inside auto-layout. Change settings rapidly and switch selection while token imports run; no stale edit should reach the new selection.
8. Confirm unrelated artwork and multiple selections are not overwritten. Locked roots/parents and icons inside component instances must not be modified.
9. Check undo/redo for insertion/replacement. Re-select afterward to reload metadata. Confirm bindings recover if undo removes the local token collection.
10. Reopen and check preferences. The plugin uses Light; the website explorer retains Color. Web SVG exports still use live strokes.

Earlier pilot launch/appearance was confirmed by the owner on 2026-10-15. This 0.1.7 installed-plugin checklist remains pending.

- Select a non-icon object and insert: confirm the icon is centered over it. Repeat inside a rotated frame and an auto-layout frame; the layout must not shift.
- Deselect with an overall frame beneath the viewport center: confirm insertion at the frame center. Pan to empty canvas and confirm viewport-center placement.
