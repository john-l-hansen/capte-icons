# Install Capte Icons

This is the **three-icon team preview**. It uses Figma's development-plugin installation flow. No Node.js, command line, API key, or source-file access is needed for the compiled ZIP.

For the 0.1.4 review build, use the ZIP supplied with the review or the pull-request build artifact. The release link below remains the published 0.1.3 preview until 0.1.4 is approved.

## First installation

1. Use **Figma Desktop** and open a Figma Design file.
2. [Download the compiled plugin ZIP](https://github.com/john-l-hansen/capte-icons/releases/download/v0.1.3/capte-icons-figma-plugin-0.1.3.zip). On the release page, choose the named plugin asset, not “Source code (zip)”.
3. Extract it to a permanent folder such as `Documents/Capte Icons`. You should see:
   - `manifest.json`
   - `code.js`
   - `ui.html`
   - these instructions, usage/release notes, version metadata, and font notices
4. Choose **Plugins → Development → Import plugin from manifest…** and open the extracted `manifest.json`.
5. Run **Capte Icons — Pilot** from **Plugins → Development**.
6. Choose an icon and click **Insert icon**. Select it on the canvas and change Weight; its artwork should update immediately.

Keep the folder after installation. Figma reads these files when the development plugin runs. Moving, renaming, or deleting the folder breaks the registered path.

## Update an existing installation

1. Close the Capte Icons plugin window.
2. Download and extract the new release.
3. Replace `manifest.json`, `code.js`, and `ui.html` in your existing permanent plugin folder. Copy the new guides/version metadata too.
4. Reopen the plugin. If the manifest path is unchanged, re-importing is normally unnecessary.

GitHub pushes and downloaded ZIPs do not update an installed copy by themselves. Already-inserted icons also remain unchanged until edited. The plugin and website are currently preview tools; Community delivery comes later.

## Troubleshooting

| Symptom | What to do |
| --- | --- |
| No plugin files in the ZIP | Download the named compiled plugin asset; the automatic source archive requires building. |
| Manifest or code file cannot be found | Check that all three runtime files are together and the folder has not moved. Re-import the current manifest. |
| Figma says the plugin already exists | Use **Plugins → Development → Manage plugins in development**, remove the old Capte Icons entry, then import the current manifest. Keep your downloaded files. |
| Old UI still appears | Close the plugin, confirm you replaced files in the registered folder, then reopen it. Re-import if Figma still points to another copy. |
| Changing controls only changes previews | Select one icon inserted by Capte Icons, or a vector inside it. Imported SVGs and unrelated artwork do not carry its metadata. |
| Selected icon cannot be edited | Unlock its root and select a single supported icon. Multiple selections are not live-edited. |
| Need a second icon | Click **Insert icon**. Deselect the current Capte icon, then click Insert icon. |
| Controls differ after undo | Re-select the canvas icon to reload its stored settings. Editor undo/redo verification is part of team testing. |

Report issues with the installed version (the current review build is **0.1.4**), your Figma Desktop/OS version, icon/settings, expected behavior, actual behavior, and reproduction steps. Use the repository's bug report form.
