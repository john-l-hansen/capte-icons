#!/usr/bin/env python3
"""Package an already-built plugin with team instructions; no external dependencies."""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parent.parent
plan = json.loads((ROOT / 'release-plan.json').read_text())
package = json.loads((ROOT / 'package.json').read_text())
version = package['version']
if not re.fullmatch(r'\d+\.\d+\.\d+', version) or plan['version'] != version or plan['tag'] != 'v' + version:
    raise SystemExit('Release plan and package version must match.')
if plan['channel'] != 'team-preview':
    raise SystemExit('This packager is configured for authorized team previews only.')
plugin = ROOT / 'apps/figma-plugin/dist'
manifest = json.loads((plugin / 'manifest.json').read_text())
source_manifest = json.loads((ROOT / 'apps/figma-plugin/manifest.json').read_text())
if manifest['id'] != source_manifest['id'] or manifest['main'] != 'code.js' or manifest['ui'] != 'ui.html':
    raise SystemExit('Build must use the assigned Capte plugin manifest.')
commit = os.environ.get('GITHUB_SHA') or subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
if not re.fullmatch(r'[0-9a-f]{40}', commit):
    raise SystemExit('Expected a full source commit SHA.')
metadata = {
    'version': version, 'channel': plan['channel'], 'sourceCommit': commit,
    'pluginId': manifest['id'],
    'catalogVersion': json.loads((ROOT / 'packages/icons/catalog.json').read_text())['version'],
    'tokenExportDate': json.loads((ROOT / 'packages/ui/design-tokens.json').read_text())['source']['exportedAt'],
    'icons': ['Search', 'Shield Lock', 'Location Check'],
}
files = {name: (plugin / name).read_bytes() for name in ['manifest.json', 'code.js', 'ui.html']}
files.update({
    'INSTALL.md': (ROOT / 'INSTALL.md').read_bytes(),
    'USAGE.md': (ROOT / 'docs/usage.md').read_text().replace('(acceptance.md)', '(ACCEPTANCE.md)').encode(),
    'ACCEPTANCE.md': (ROOT / 'docs/acceptance.md').read_bytes(),
    'RELEASE-NOTES.md': (ROOT / plan['notes']).read_bytes(),
    'VERSION.json': (json.dumps(metadata, indent=2) + '\n').encode(),
    'FONT-LICENSES/Roboto.txt': (ROOT / 'packages/ui/fonts/Roboto-LICENSE.txt').read_bytes(),
    'FONT-LICENSES/Roboto-Mono.txt': (ROOT / 'packages/ui/fonts/Roboto-Mono-LICENSE.txt').read_bytes(),
})
output = ROOT / 'release-artifacts'
output.mkdir(exist_ok=True)
archive = output / f'capte-icons-figma-plugin-{version}.zip'
with ZipFile(archive, 'w', ZIP_DEFLATED) as z:
    for name, content in sorted(files.items()):
        info = ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
        info.compress_type = ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        z.writestr(info, content)
with ZipFile(archive) as z:
    if z.testzip() is not None or set(z.namelist()) != set(files):
        raise SystemExit('Release archive failed verification.')
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
(output / 'SHA256SUMS').write_text(f'{digest}  {archive.name}\n')
(output / 'VERSION.json').write_text(json.dumps(metadata, indent=2) + '\n')
print(f'Packaged {archive.name} ({archive.stat().st_size} bytes)')
print(f'SHA-256 {digest}')
