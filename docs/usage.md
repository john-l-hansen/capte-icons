# Using Capte Icons 0.1.9

Choose an icon and settings, then click **Insert icon**. If one plugin-generated Capte icon is selected, it is replaced in place. **Deselect it to insert another.** Selecting a vector inside an owned icon also works. Unrelated artwork, multiple selections, and locked roots or parents are not overwritten. Edit icons inside component instances through their main component.

Changing controls or choosing another icon updates an owned selection live. The root retains its ID, parent, placement, and rotation. Generated children are replaced, so later settings changes overwrite manual child edits. Each insertion/edit commits an undo checkpoint. Re-select after undo/redo to reload saved settings.

## Controls

| Control | Options |
| --- | --- |
| Weight | Thin, Medium, Heavy |
| Style | Outline, Filled, Duotone |
| Grade | Dark, Normal, Emphasis |
| Optical size | 20, 24, 40, 48 dp |

dp is the displayed design-unit label: 24 dp creates a 24 × 24 frame. Figma's numeric inspector and SVG dimensions are unchanged. Grade changes thickness, independently of style. The plugin uses the Light palette; it has no dark-mode control. The companion website explorer retains its palette selector.

Search accepts names and keywords. Category filtering works alongside search. Icon buttons keep accessible names and hover tooltips in the compact grid. The documentation row is intentionally inactive until its destination URL is supplied.

## Artwork and tokens

- Inserted/updated geometry uses editable **filled vector paths with no live strokes**, including the Outline visual style. Source masters and web SVG exports retain their live strokes.
- The plugin first reuses variables from the approved Capte source by stable key, then attempts published-library imports.
- If a library variable is unavailable, it creates/reuses `icon/stroke`, `icon/fill`, `icon/surface`, `icon/signal`, and `icon/container` in a plugin-owned **Capte Icons** collection. Edited local values are never overwritten.
- Local variables are snapshots, not a live connection to the source library. Restart after publishing library tokens to retry imports; reapply settings to existing icons to bind them to newly available library variables.
- Colors remain bound after stroke conversion. Changing a local token updates artwork using it. The root selects Light mode where available.
- Existing artwork does not automatically receive new geometry or plugin releases. Replace installed plugin files to update a development plugin.

## Review checklist

Try all three icons at small and large sizes, inspect fills and variable bindings, replace a selection, deselect to insert another, change every control, and try undo/redo. See the [acceptance checklist](acceptance.md). Full end-to-end Figma Desktop acceptance remains pending.

## Placement

A selected Capte icon is replaced in place. For other selected objects, the new icon is centered over their combined bounds. It is added inside their shared editable frame when available, using absolute positioning in auto-layout frames. With nothing selected, the icon is centered in the outermost editable frame beneath the viewport center. If no frame is there, it is centered in the viewport. Locked artwork and component instances are not modified.
