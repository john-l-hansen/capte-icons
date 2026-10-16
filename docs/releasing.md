# Maintainer release guide

## Current release

**v0.1.13 — Team preview** packages the existing three-icon pilot for team testing. It is not a production-readiness claim. Complete the editor checks in `docs/acceptance.md` before promoting to broader distribution.

## Package locally

Requires Node.js 22.18+, npm, and Python 3.

```sh
npm ci
npm run check
npx playwright install chromium --only-shell
npm run test:browser
npm run package:release
```

`release-artifacts/` contains:

- `capte-icons-figma-plugin-0.1.13.zip`: compiled plugin, INSTALL/USAGE/release notes, version metadata, and font notices.
- `SHA256SUMS`: checksum for the ZIP.
- `VERSION.json`: application/catalog version, source commit, plugin ID, token export date, and included icons.

Do not commit generated artifacts or install from GitHub's automatic source archive. Packaging validates the assigned manifest and does not select a project license, publish to Figma, or deploy a website.

## Publish an authorized team preview

The **Team preview release** workflow runs when an authorized change to `release-plan.json` or the workflow is pushed to `feat/icon-plugin-pilot`, `feat/plugin-review-polish`, or `main`. The v0.1.13 team preview is explicitly approved by the project owner on 2026-10-16. Future releases require project authorization; do not change the release plan solely to trigger publication.

A release from the reviewed `feat/plugin-review-polish` branch does not merge it into `main`; merging requires separate authorization.

The workflow installs dependencies, runs checks and browser verification, builds/packages, and creates a GitHub **pre-release** tagged at the tested commit. It attaches the ZIP, checksum, and version metadata. It never merges a PR, publishes a Community plugin, or deploys a website. The job uses GitHub's repository-scoped Actions token with `contents: write`; no personal access token or new secret is required.

An existing release is left intact. Never move its tag or replace its assets to hide a correction; fix forward with a new version. Re-running a failed job can retry publication if no release exists. If creation succeeded but an asset upload failed, inspect the existing draft/release and complete the missing asset upload from that same tested commit rather than rebuilding a different commit under the same version.

Once the workflow is on the default branch, it can also be run through Actions → Team preview release → Run workflow. Run it on the reviewed release branch, not an unreviewed contributor branch.

## Next version

1. Confirm editor results and decide the preview's scope.
2. Bump the application/workspace versions, package lockfile, UI version label, and documentation version references together. The artwork catalog version changes only when the catalog changes.
3. Add versioned release notes and update `release-plan.json` with the matching version/tag/notes path.
4. Review in a PR, run checks, and publish only with project authorization.
5. Verify the release page and all assets, then update download links. Previews are not GitHub's latest stable release; link to the exact preview tag/asset.

## Future brand assets page

Point its manual download button at the same compiled GitHub release asset. Include scope, version, installation/update instructions, usage, release notes, and feedback links. When Community distribution is approved, make **Open in Figma** the primary action and retain manual downloads for testing/development. Keep one source for release binaries.
