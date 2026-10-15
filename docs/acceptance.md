# Pilot acceptance

## Automated

- `npm run check`: type checking, eleven renderer/controller tests and both production builds.
- `npm run test:browser`: real Chromium checks of filtering, every control, independent grade/color settings, SVG download size, preference restoration, plugin UI messages and narrow layouts.

## Figma Desktop checkpoint — 2026-10-15

The project owner confirmed that the imported development plugin opens successfully and that the initial presentation looks good. This records user-reported launch and visual review only. Insertion, update behavior, persistence, undo/redo, and detailed artwork comparisons have not yet been confirmed through the complete checklist below.

## Manual Figma Desktop gate — partially verified

1. Configure the assigned plugin ID and import the built manifest. **Launch confirmed by the project owner on 2026-10-15.**
2. Insert each pilot icon at 20, 24, 40 and 48 px; confirm frame dimensions in the inspector.
3. Compare Outline, Filled and Duotone on white, pale and dark-blue backgrounds against the approved Figma pilot.
4. Check Thin, Medium and Heavy, including compact badge and lock details.
5. Check each Grade independently of the top-right **Light/Dark** palette control.
6. Reopen the plugin and confirm saved preferences and selection metadata load.
7. Select a vector inside an inserted icon and confirm settings load. Change the controls and use **Insert icon**. Then choose another icon in the grid and confirm immediate replacement without an extra canvas layer. Deselect it and confirm **Insert icon** creates an additional icon. Confirm root ID, placement, rotation and parent stay intact, including in an auto-layout frame.
8. Confirm unrelated artwork, multi-selections and locked roots cannot be overwritten.
9. Check undo/redo after insertion and update.
10. Check the copied/downloaded SVG in the browser and an independent SVG editor.

The root frame survives an update, but its generated child layers are replaced. User edits inside those children are not retained.

## 0.1.1 verification

The regression suite covers nested artwork selection and repeated in-place replacement. Browser coverage includes native-host messages with no Window source, the single insert action with and without a selection, automatic replacement on catalog choice, and the header palette control. These checks do not establish a completed Figma Desktop acceptance pass for this update.
