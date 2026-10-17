# Catalog acceptance — 0.2.0-beta.1

## Current automated and native verification

See [catalog review](catalog-review.md) for the 60-icon inventory, proportional-size limitation, all 12,960 configurations, 32 tests, browser results and native Figma probes. The published 0.1.13 approval does not approve this new catalog beta.

## Owner's Figma Desktop review

1. Install the supplied 0.2.0-beta.1 ZIP and reopen the plugin. Confirm category/search, four controls, and the documentation row, which must not navigate.
2. Insert each icon at 20, 24, 40, and 48 dp. Confirm matching numeric frame dimensions.
3. Compare all styles, weights, and grades, especially small lock/badge details. Inspect child shapes: no live strokes; editable filled paths.
4. Inspect fill bindings. When the source is unpublished, confirm one local Capte Icons collection is reused. Edit a local color, confirm existing artwork follows it, and insert again to ensure its value is not reset.
5. With the source library published and accessible, confirm imported variables are used. Reopen after publication to retry imports; reapply settings to rebind older icons.
6. Select an inserted icon or child path; change controls and choose another icon: canvas artwork must stay unchanged until Update icon is pressed. Confirm the root is preserved. Deselect and insert to add another.
7. Check parent, position, rotation, and root ID, including inside auto-layout. Change settings rapidly and switch selection while token imports run; no stale edit should reach the new selection.
8. Confirm unrelated artwork and multiple selections are not overwritten. Locked roots/parents and icons inside component instances must not be modified.
9. Check undo/redo for insertion/replacement. Re-select afterward to reload metadata. Confirm bindings recover if undo removes the local token collection.
10. Reopen and check preferences. The plugin uses Light; the website explorer retains Color. Web SVG exports still use live strokes.

The previous v0.1.13 release was approved on 2026-10-16. Keep the full-catalog beta unpublished until its design/editor review and matching release approval.

- Select a non-icon object and insert: confirm the icon is centered over it. Repeat inside a rotated frame and an auto-layout frame; the layout must not shift.
- Deselect with an overall frame beneath the viewport center: confirm insertion at the frame center. Pan to empty canvas and confirm viewport-center placement.
