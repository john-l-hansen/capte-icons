#!/usr/bin/env python3
"""Build the full catalog from Figma masters plus the unchanged approved pilot.
New sizes preserve path proportions and use the pilot stroke profiles.
Interior contrast is deliberately assigned by part, never guessed at runtime.
Run: python3 scripts/build-catalog.py
"""
import json,re,copy,hashlib
from pathlib import Path
root=Path(__file__).resolve().parent.parent
sources=json.loads((root/'packages/icons/source-masters.json').read_text())
pilot=json.loads((root/'packages/icons/catalog.json').read_text())
pilot['icons']=[i for i in pilot['icons'] if i['id'] in ['search','shield-lock','location-check']]
# Explicit contrast roles: internal marks reverse out of the solid body; outer edges stay ink.
reverse={
'data-upload':['data-upload.04'],
'fleet-charging':['fleet-charging.03'],
'hardware-router':['hardware-router.04','hardware-router.05'],
'read-protect':['read-protect.03','read-protect.04','read-protect.05'],
'cybersecurity':['cybersecurity.03','cybersecurity.04','cybersecurity.05','cybersecurity.06','cybersecurity.07'],
'entry-checklist':['entry-checklist.03'],
'diagnoses':['diagnoses.05'],
'entry-location':['entry-location.05','entry-location.06'],
'battery-connector':['battery.bolt','connector.detail'],
'chart-clock':['chart.threshold','chart.trend','chart.point'],
'circle-arrow-up':['arrow.up'],
'hexagon-plus':['plus'],
'clamp-check':['pipe.details','sensor.details'],
'comprehensive-vehicle-data-access':['database.lines'],
'control-panel-check':['panel.divider','panel.status'],
'document-clock':['document.lines'],
'field-case-weather':['case.detail.top-left','case.detail.top-right','case.detail.bottom-left','case.detail.bottom-right'],
'fill-gauge':['level.gauge.details','level.signal.node','level.signal.active'],
'gauge-chart':['gauge.ticks','gauge.needle'],
'hardhat-wrench':['hardhat.detail'],
'map-pin':['map.fold'],
'route-play':['route.path'],
'shield-monitor':['shield.check'],
'signal-checklist':['checklist.lines'],
'signal-panel':['signal.active'],
'truck-connector':['truck.seam'],
'warning-bell':['warning.mark'],
'warning-minus':['warning.stem','warning.dot'],
'weather-shield':['shield.check'],
'service-verification':['chart.trend'],
'document-shield':['document.lines','document.fold'],
'server-sync':['server.light.top','server.light.middle','server.light.bottom','server.lines'],
'chart-replay':['chart.trend','chart.cursor'],
'dashboard-fault':['gauge.arc','gauge.needle'],
'warning-filter':['warning.stem','warning.dot'],
'gear-calendar':['gear.teeth'],
}
categories={
'General':['data-source','data-upload','hardware-router','target','arrow-outward','circle-arrow-up','hexagon-plus','integrated-modules','server-sync','status-check','signal-panel'],
'Security':['secure-connector','read-protect','cybersecurity','shield-monitor','document-shield'],
'Location':['entry-location','map-pin','route-play'],
'Fleet':['comprehensive-vehicle-data-access','truck-connector','truck-minus','vehicle-trend','bus-wireless','field-case-weather'],
'Energy':['fleet-charging','dependable-charging','battery-connector','fill-gauge','battery-bolt','fuel-reduction'],
'Analytics':['preventive-intelligence','measurable-performance','chart-clock','gauge-chart','service-verification','chart-replay','chart-search','enhanced-visibility'],
'Operations':['replay','diagnoses','entry-checklist','entry-document','streamlined-operations','bell-routing','clamp-check','control-panel-check','document-clock','hardhat-wrench','signal-checklist','target-check','warning-bell','warning-minus','weather-shield','dashboard-fault','warning-filter','gear-calendar'],
}
tags={
'data-source':['cloud','network','database'], 'data-upload':['database','import','send'],
'fleet-charging':['electric','vehicle','ev','battery'], 'hardware-router':['device','connection','network'],
'secure-connector':['plug','protection','can'], 'read-protect':['shield','can','protection'],
'cybersecurity':['security','threat','shield'], 'diagnoses':['diagnostic','maintenance','fault'],
'preventive-intelligence':['predictive','maintenance','diagnostic'],
'entry-location':['entry','site','map','pin'], 'entry-checklist':['entry','task','list'],
'entry-document':['entry','file','report'], 'dependable-charging':['depot','ev','electric'],
'streamlined-operations':['depot','workflow','fleet'], 'enhanced-visibility':['depot','monitor','view'],
'measurable-performance':['efficiency','metrics','chart'], 'battery-bolt':['electric','energy','charge'],
'fuel-reduction':['pump','efficiency','diesel'], 'bus-wireless':['wifi','transit','connectivity'],
}
number=re.compile(r'[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?')
def scale_path(path,s):
 # Arc flags/rotation are not coordinates; fail rather than corrupt future paths.
 if set(re.findall(r'[a-df-zA-DF-Z]',path))-set('MLCZ'):
  raise ValueError('Extend coordinate scaling before exporting new SVG commands')
 return number.sub(lambda m:format(float(m[0])*s,'.8g'),path)
def role(p):
 if isinstance(p,str) or p is None:return p
 for k,c in pilot['palettes']['light'].items():
  if all(abs(p[z]-c[z])<.00001 for z in ['r','g','b']):return k
 raise ValueError(f'Unmapped paint: {p}')
recipes={}
for source in sources:
 id=source['id']
 if any(i['id']==id for i in pilot['icons']):continue
 parts=copy.deepcopy(source['parts'])
 for p in parts:
  p['fill'],p['stroke']=role(p['fill']),role(p['stroke'])
  p['detail']=bool(re.search(r'detail|lines|ticks|hand|mark|trend|needle|binding|center|dot|light|threshold',p['name']))
 # Explicit knockout clearances keep crossing ink visible against solid bodies.
 if id=='data-upload':
  parts.insert(6,dict(name='upload.clearance',type='VECTOR',transform=[[1,0,0],[0,1,0]],width=48,height=48,paths=[dict(data='M 25.5 31 L 25.5 27.5 L 35.7 17 L 46 27.5 L 46 31 L 38.5 31 L 38.5 46 L 33 46 L 33 31 Z',windingRule='NONZERO')],fill='surface',stroke=None,detail=False,cap='NONE',join='MITER',dash=[],opacity=1,filledOnly=True))
 if id=='entry-document':
  parts.insert(2,dict(name='percent.clearance',type='VECTOR',transform=[[1,0,0],[0,1,0]],width=48,height=48,paths=[dict(data='M 4 42 L 20 23 L 25 27 L 9 46 Z',windingRule='NONZERO')],fill='surface',stroke=None,detail=False,cap='NONE',join='MITER',dash=[],opacity=1,filledOnly=True))
 templates=[]
 for size in [48,40,24,20]:
  for style in ['duotone','outline','filled']:
   ps=[copy.deepcopy(p) for p in parts if style=='filled' or not p.get('filledOnly')];s=size/48
   for p in ps:
    p.pop('filledOnly',None)
    if style=='outline' and p['fill']=='fill':p['fill']=None
    if style=='filled':
     if p['fill']=='fill':p['fill']='stroke'
     if p['name'] in reverse.get(id,[]):
      if p['stroke']=='stroke':p['stroke']='surface'
      if p['fill']=='stroke':p['fill']='surface'
    p['transform'][0][2]*=s;p['transform'][1][2]*=s
    p['width']*=s;p['height']*=s
    for path in p.get('paths',[]):path['data']=scale_path(path['data'],s)
    p['dash']=[v*s for v in p['dash']]
   templates.append(dict(size=size,style=style,parts=ps))
 category=next((k for k,v in categories.items() if id in v),'Operations')
 pilot['icons'].append(dict(id=id,name=id.replace('-',' ').title(),category=category,tags=list(dict.fromkeys(tags.get(id,[])+source['group'].lower().split()+id.split('-'))),templates=templates))
 recipes[id]={'sourceId':source['sourceId'],'reverseParts':reverse.get(id,[]),'geometry':'proportional from 48; size-specific stroke profiles','clearanceParts':[p['name'] for p in parts if p.get('filledOnly')],'review':'catalog visual review; editor acceptance pending'}
pilot['icons'].sort(key=lambda i:i['name'])
pilot['version']='0.2.0-beta.1'
(root/'packages/icons/catalog.json').write_text(json.dumps(pilot,indent=2)+'\n')
(root/'packages/icons/recipes.json').write_text(json.dumps(recipes,indent=2)+'\n')
# Fingerprint source geometry independent of layer names/IDs; only exact duplicates are reported.
groups={}
for i in sources:
 normalized=[{k:v for k,v in p.items() if k!='name'} for p in i['parts']]
 digest=hashlib.sha256(json.dumps(normalized,sort_keys=True).encode()).hexdigest()
 groups.setdefault(digest,[]).append(i['id'])
print('icons',len(pilot['icons']),'templates',sum(len(i['templates']) for i in pilot['icons']),'exact duplicates',[g for g in groups.values() if len(g)>1])
