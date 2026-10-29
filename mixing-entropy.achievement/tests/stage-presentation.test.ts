import { parseCssRecords, resolveElementCss } from '../src/element-css.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog, DEFAULT_LEVELS, entries, presetStages } from '../src/model.ts';
import { legacyPresentation, parsePresentations, resetSurfaceCss } from '../src/stage-presentation.ts';

const stage = presetStages('')[2];
const item = { id: 'a', name: '基础名', description: '基础说明', icon: 'base.png', levelId: 'gold' };
const saved = [{ id: 'a', stageId: stage.id }];
const view = (p: unknown[], surface: 'card' | 'popup', own: any[] = [], css: any[] = []) => entries(catalog(DEFAULT_LEVELS, [item], own, [], [], css, p), saved, surface);
const popup = { ...legacyPresentation(stage, 'popup'), achievementId: 'a', nameMode: 'custom' as const, displayName: '浮现专用', durationMs: 1200, ui: 'ui:@mixing-entropy.achievement/achievement-popup' };

test('popup and card content/appearance are independent, using stage contents by default', () => {
  const card = { ...legacyPresentation(stage, 'card'), achievementId: 'a', nameMode: 'custom', displayName: '卡片专用', backgroundMode: 'color', backgroundColor: '#123456' };
  const p = [card, { ...popup, backgroundMode: 'color', backgroundColor: '#654321' }];
  assert.equal(view(p, 'card')[0].name, '卡片专用');
  assert.equal(view(p, 'popup')[0].name, '浮现专用');
  assert.equal(view(p, 'card')[0].appearance?.backgroundColor, '#123456');
  assert.equal(view(p, 'popup')[0].appearance?.backgroundColor, '#654321');
  assert.equal(view(p, 'popup')[0].description, '基础说明');
  assert.equal(view(p, 'popup')[0].popupDurationMs, 1200);
  assert.ok(!('popupUI' in view(p, 'card')[0]));
});
test('local popup does not detach card from live defaults and the inverse also holds', () => {
  const cardDefault = { ...legacyPresentation(stage, 'card'), nameMode: 'custom' as const, displayName: '默认卡片' };
  assert.equal(view([popup, cardDefault], 'card')[0].name, '默认卡片');
  assert.equal(view([popup, { ...cardDefault, displayName: '默认卡片更新' }], 'card')[0].name, '默认卡片更新');
  const popupDefault = { ...popup, achievementId: '', displayName: '默认浮现' };
  assert.equal(view([{ ...cardDefault, achievementId: 'a' }, popupDefault], 'popup')[0].name, '默认浮现');
  assert.equal(view([{ ...cardDefault, achievementId: 'a' }, { ...popupDefault, displayName: '更新浮现' }], 'popup')[0].name, '更新浮现');
});
test('card inclusion and popup entry notification are separate; no active flag or other-stage contents leak', () => {
  assert.equal(view([{ ...legacyPresentation(stage, 'card'), enabled: false }, popup], 'card').length, 0);
  assert.equal(view([{ ...legacyPresentation(stage, 'card'), enabled: false }, popup], 'popup').length, 1);
  assert.equal(view([{ ...popup, enabled: false }], 'popup').length, 0);
  assert.equal(view([{ ...popup, enabled: false }], 'card').length, 1);
  const defs = catalog(DEFAULT_LEVELS, [item], [], [], [], [], [popup]);
  assert.equal(entries(defs, [{ id: 'a', stageId: 'hidden' }], 'popup').length, 0);
  assert.equal(entries(defs, [{ id: 'a', stageId: 'deleted' }], 'popup').length, 0);
  assert.ok(!JSON.stringify(view([popup], 'popup')).includes('active'));
});
test('existing local stages preserve contents and visuals until surface configuration is changed', () => {
  const own = { ...stage, achievementId: 'a', nameMode: 'custom', displayName: '现有阶段', backgroundMode: 'color', backgroundColor: '#112233' };
  for (const surface of ['card', 'popup'] as const) {
    const entry = view([], surface, [own])[0];
    assert.equal(entry.name, '现有阶段'); assert.equal(entry.appearance?.backgroundColor, '#112233');
  }
  assert.equal(view([popup], 'card', [own])[0].appearance?.backgroundColor, '#112233');
  assert.equal(view([popup], 'popup', [own])[0].name, '浮现专用');
});
test('restore affects only one surface, including formerly both-surface CSS', () => {
  const own = { ...stage, achievementId: 'a', backgroundMode: 'color', backgroundColor: '#112233' };
  const css = [{ id: 'c', ownerKind: 'stage' as const, ownerId: 'revealed', achievementId: 'a', target: 'name', surface: 'both' as const, css: 'color: red;', replace: false }];
  const reset = resetSurfaceCss(css, 'a', 'revealed', 'card');
  const p = [{ ...legacyPresentation(stage, 'card'), achievementId: 'a', mode: 'inherit' }, popup];
  assert.equal(view(p, 'card', [own], reset)[0].appearance?.backgroundMode, 'template');
  assert.equal(view(p, 'card', [own], reset)[0].elementCss?.length, 0);
  assert.equal(view(p, 'popup', [own], reset)[0].elementCss?.[0].css, 'color: red;');
  assert.equal(view(p, 'popup', [own], reset)[0].name, '浮现专用');
});
test('presentation records reject duplicate identities, malformed content and invalid duration/UI', () => {
  assert.throws(() => parsePresentations([popup, popup]), /一份/);
  assert.throws(() => parsePresentations([{ ...popup, durationMs: 100 }]), /时长/);
  assert.throws(() => parsePresentations([{ ...popup, ui: 'https://example.com' }]), /界面引用/);
  assert.throws(() => parsePresentations([{ ...popup, nameMode: 'base' }]), /内容方式/);
  assert.equal(parsePresentations([{ ...popup, durationMs: 0 }])[0].durationMs, 0);
});

test('restoring one surface preserves shared plus dedicated CSS without duplicate keys', () => {
 const owner={ownerKind:'stage' as const,ownerId:'revealed',achievementId:'a'};
 const both={...owner,id:'both',target:'name',surface:'both' as const,css:'color: red; font-size: 20px;',replace:true};
 const specific={...owner,id:'popup',target:'name',surface:'popup' as const,css:'color: blue;',replace:false};
 const result=parseCssRecords(resetSurfaceCss([both,specific],'a','revealed','card'));
 assert.equal(result.length,1);assert.equal(result[0].replace,true);
 assert.equal(resolveElementCss(result,[owner]).filter(r=>r.surface==='card').length,0);
 assert.match(result[0].css,/font-size: 20px/);assert.ok(result[0].css.indexOf('red')<result[0].css.indexOf('blue'));
 const replaced=parseCssRecords(resetSurfaceCss([both,{...specific,replace:true}],'a','revealed','card'));
 assert.equal(replaced[0].css,'color: blue;');
});
