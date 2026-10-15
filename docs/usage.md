# Using Capte Icons

## Insert and edit

Choose an icon and settings, then click **Insert icon**. Select an icon inserted by this plugin—or a vector inside its generated frame—to load the settings stored on it. Changing controls or choosing another icon updates that selection immediately. The outer frame retains its identity, parent, position, and rotation. Each insertion/live edit commits an undo checkpoint.

**Insert icon always creates a new icon**, including while another Capte icon is selected. With no supported selection, changing controls affects the plugin preview only. Only one owned icon can be edited at a time. Unrelated artwork and locked roots are not overwritten.

Changing settings replaces generated children. Use the controls before doing manual vector edits, since later live edits overwrite those child edits. After undo/redo, re-select the icon to reload its stored options.

## Controls

| Control | Use it for |
| --- | --- |
| Optical size: 20, 24, 40, 48 | Match the intended placement. Smaller icons preserve specially adjusted details. |
| Weight: Thin, Medium, Heavy | Set the base stroke thickness. |
| Grade: Dark, Normal, Emphasis | Reduce stroke thickness slightly for dark conditions, keep baseline strokes, or add emphasis. |
| Style: Outline, Filled, Duotone | Choose a line, filled, or original two-tone treatment. |
| Color: Light, Dark | Choose the palette for the intended background using the top-right control. |

Grade and Color are separate. Choosing Dark colors does not silently change Grade. Search accepts names and keywords; category filtering narrows the catalog.

## What updates, and what does not

- While the plugin is open, selected owned icons follow the controls live.
- The plugin remembers preferences between sessions.
- Installed development plugins update only when their local files are replaced.
- Existing canvas artwork does not automatically receive catalog or plugin releases.
- Inserted colors are fixed editable values, not bindings to the destination file's variables.
- The website explorer shares the renderer and offers SVG download/copy; it does not manipulate a Figma canvas.

## Team preview checklist

Try all three icons at a small and large size, change each control, switch canvas selections, insert an additional icon, and try undo/redo. Compare on light and dark backgrounds. Record any mismatch in a bug report. The complete [acceptance checklist](acceptance.md) is maintained separately.
