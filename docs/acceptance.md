# Pilot acceptance

## Automated

- `npm run check`: type checking, nine renderer/controller tests and both production builds.
- `npm run test:browser`: real Chromium checks of filtering, every control, independent grade/color settings, SVG download size, preference restoration, plugin UI messages and narrow layouts.

## Manual Figma Desktop gate — pending

1. Configure the assigned plugin ID and import the built manifest.
2. Insert each pilot icon at 20, 24, 40 and 48 px; confirm frame dimensions in the inspector.
3. Compare Outline, Filled and Duotone on white, pale and dark-blue backgrounds against the approved Figma pilot.
4. Check Thin, Medium and Heavy, including compact badge and lock details.
5. Check each Grade independently of Color.
6. Reopen the plugin and confirm saved preferences and selection metadata load.
7. Update an inserted icon. Confirm root ID, placement, rotation and parent stay intact, including in an auto-layout frame.
8. Confirm unrelated artwork, multi-selections and locked roots cannot be overwritten.
9. Check undo/redo after insertion and update.
10. Check the copied/downloaded SVG in the browser and an independent SVG editor.

The root frame survives an update, but its generated child layers are replaced. User edits inside those children are not retained.
