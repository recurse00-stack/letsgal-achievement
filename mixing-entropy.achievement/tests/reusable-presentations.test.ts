import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog, DEFAULT_LEVELS, entries, presetStages } from '../src/model.ts';
import { resolvePresentation, type StagePresentation } from '../src/stage-presentation.ts';
import type { AppearancePreset } from '../src/appearance-presets.ts';
const stage = presetStages('')[2];
const item = { id: 'a', name: '正式名称', description: '正式说明', icon: 'base.png', levelId: 'gold' };
const record = [{ id: 'a', stageId: 'revealed' }];
const card: AppearancePreset = { id: 'card1', name: '通用卡片', surface: 'card', isDefault: true, backgroundMode: 'color', backgroundColor: 'red' };
const popup: AppearancePreset = { id: 'pop1', name: '通用浮现', surface: 'popup', isDefault: true, backgroundMode: 'color', backgroundColor: 'blue', durationMs: 1200, ui: 'ui:@mixing-entropy.achievement/achievement-popup' };
function defs(presets = [card, popup], p: StagePresentation[] = [], css: any[] = [], levels = DEFAULT_LEVELS) { return catalog(levels, [item], [], [], presets, css, p); }
const local = (surface: 'card' | 'popup'): StagePresentation => ({ ...resolvePresentation([], [], stage, 'a', surface), achievementId: 'a' });
test('default card and popup schemes stay separate and changes follow live references', () => {
  const before = JSON.stringify(record);
  assert.equal(entries(defs(), record)[0].appearance?.backgroundColor, 'red');
  assert.equal(entries(defs(), record, 'popup')[0].appearance?.backgroundColor, 'blue');
  assert.equal(entries(defs([{ ...card, backgroundColor: 'green' }, popup]), record)[0].appearance?.backgroundColor, 'green');
  assert.equal(entries(defs([{ ...card, backgroundColor: 'green' }, popup]), record, 'popup')[0].appearance?.backgroundColor, 'blue');
  assert.equal(JSON.stringify(record), before);
});
test('shared schemes read current-stage contents and cannot reveal base data hidden by that stage', () => {
  const d = defs(); const hint = [{ id: 'a', stageId: 'unknown' }];
  assert.equal(entries(d, hint)[0].name, '？？？');
  assert.equal(entries(d, hint, 'popup')[0].description, '？？？');
  assert.equal(entries(d, [{ id: 'a', stageId: 'hidden' }]).length, 0);
  assert.equal(entries(defs([{ ...card, nameMode: 'none' }, popup]), record)[0].name, '');
  assert.equal(entries(defs([{ ...card, nameMode: 'none' }, popup]), record, 'popup')[0].name, '正式名称');
});
test('local changes override one section while the other sections keep following the scheme', () => {
  const p = { ...local('card'), overrideBackground: true, backgroundMode: 'color' as const, backgroundColor: 'yellow' };
  const d = defs([{ ...card, frameMode: 'line', frameWidth: 8 }, popup], [p]);
  assert.equal(entries(d, record)[0].appearance?.backgroundColor, 'yellow');
  assert.equal(entries(d, record)[0].appearance?.frameWidth, 8);
  assert.equal(entries(defs([card, popup], [{ ...p, overrideBackground: false }]), record)[0].appearance?.backgroundColor, 'red');
});
test('explicit surface contents and popup timing survive common changes and can resume inheritance', () => {
  const p = { ...local('popup'), contentOverride: true, nameMode: 'custom' as const, displayName: '祝贺', durationMs: 6000, ui: 'ui:custom-popup' };
  assert.equal(entries(defs([card, popup], [p]), record, 'popup')[0].name, '祝贺');
  assert.equal(entries(defs([card, popup], [p]), record, 'popup')[0].popupDurationMs, 6000);
  const restored = { ...p, contentOverride: false, nameMode: 'stage' as const, durationMs: 0, ui: '' };
  const e = entries(defs([card, { ...popup, durationMs: 2200 }], [restored]), record, 'popup')[0];
  assert.equal(e.name, '正式名称'); assert.equal(e.popupDurationMs, 2200); assert.equal(e.popupUI, popup.ui);
});
test('cross-surface scheme ids do not leak appearance or CSS into the other surface', () => {
  const p = { ...local('card'), appearanceSource: 'preset' as const, appearanceId: popup.id };
  const css = [{ id: 'x', ownerKind: 'appearance', ownerId: popup.id, achievementId: '', target: 'name', surface: 'both', css: 'color: red;', replace: false }];
  const e = entries(defs([card, popup], [p], css), record)[0];
  assert.equal(e.appearance?.backgroundMode, 'template'); assert.equal(e.elementCss?.length, 0);
});
test('a level can bind independent schemes without changing stage or save records', () => {
  const levels = DEFAULT_LEVELS.map(l => ({ ...l, appearanceId: card.id, popupAppearanceId: popup.id }));
  const p = (['card', 'popup'] as const).map(s => ({ ...local(s), appearanceSource: 'level' as const }));
  assert.equal(entries(defs([card, popup], p, [], levels), record)[0].appearance?.backgroundColor, 'red');
  assert.equal(entries(defs([card, popup], p, [], levels), record, 'popup')[0].appearance?.backgroundColor, 'blue');
});
test('scheme validation rejects conflicting defaults and malformed UI/timing', () => {
  assert.throws(() => defs([card, { ...card, id: 'card2' }]), /默认/);
  assert.throws(() => defs([{ ...popup, durationMs: 200 }]), /时长/);
  assert.throws(() => defs([{ ...popup, ui: 'https:\/\/example.com' }]), /引用/);
});
