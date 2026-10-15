# Changelog

## 0.1.1 — Pilot selection fixes — 2026-10-15

- Accept selection/settings messages from the native host when their Window source is absent.
- Resolve a selected vector to its owning Capte icon so settings can be loaded and updated.
- Choosing a different catalog icon replaces the selected Capte icon immediately; the primary action also replaces an owned selection instead of stacking a duplicate.
- Resize roots without applying constraints to replacement artwork.
- Move the Light/Dark palette control to the top-right and shorten the Dark grade label. Palette and grade remain independent.
- Add regression checks for nested selection, repeated replacement, source-less host messages, and replacement controls.

## Pilot checkpoint — 2026-10-15

- Project owner confirmed a successful Figma Desktop launch and positive initial visual review.
- Clarified installation from the extracted build and recovery from a stale development-plugin path.
- Kept the three-icon scope while pilot adjustments are collected; full editor acceptance remains pending.

## 0.1.0 — Development pilot

- Search, Shield Lock and Location Check, sourced from the approved Figma pilot.
- Four optical sizes, three weights, three grades, three styles and two palettes.
- Shared SVG renderer for Figma insertion and website previews/downloads.
- Editable vector insertion, saved preferences and selection-based updates.
- Documentation explorer and local development instructions.
- Automated renderer/controller tests and browser acceptance checks.

Figma Desktop development-plugin verification is required before public release.
