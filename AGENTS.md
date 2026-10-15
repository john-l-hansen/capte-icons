# Capte Icons development

- Keep the plugin and documentation previews on the shared `packages/icons` renderer. Never maintain separate geometry or color formulas in a client.
- Use the approved Figma pilot as the visual reference. Keep icon IDs stable and preserve small-size optical geometry.
- Grade, Color, Weight and Style are independent controls. Do not make a theme change silently change grade.
- Keep insertion editable and preserve the root layer on update. Only update icons identified by this plugin's private metadata.
- Do not publish a Figma plugin, deploy a website, merge a pull request, or choose a distribution license without explicit user authorization.
- Run `npm run check` for renderer/controller changes. Run `npm run test:browser` for shared UI changes when Chromium is installed. Record any missing editor verification honestly.
- Use feature branches and reviewable pull requests. Avoid adding infrastructure until the pilot requires it.
- Public repository contents must be project code and approved assets, not unrelated Capte source documents.
