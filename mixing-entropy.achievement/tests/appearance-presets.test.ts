import test from 'node:test';
import assert from 'node:assert/strict';
import { appearanceInUse, copyAppearanceGroup, resolveAppearance } from '../src/appearance-presets.ts';
import { catalog, DEFAULT_LEVELS, entries, presetStages } from '../src/model.ts';
import { cardAppearance } from '../src/card-style.ts';

test('one shared appearance updates all referring stages without changing runtime records', () => {
  const items = ['a','b'].map(id => ({ id, name:id, levelId:'bronze', initialStageId:'revealed' }));
  const stages = presetStages('').map(({achievementId, ...s}) => ({ ...s, appearanceSource:'preset' as const, appearanceId:'style' }));
  const first = entries(catalog(DEFAULT_LEVELS, items, [], stages, [{ id:'style', name:'Style', frameMode:'line', frameWidth:5 }]), []);
  const next = entries(catalog(DEFAULT_LEVELS, items, [], stages, [{ id:'style', name:'Style', frameMode:'line', frameWidth:11 }]), []);
  assert.ok(first.every(e => e.appearance?.frameWidth === 5));
  assert.ok(next.every(e => e.appearance?.frameWidth === 11 && e.stageId === 'revealed'));
  assert.ok(!JSON.stringify(next).includes('appearanceId'));
});
test('local section overrides are independent; disabling resumes current shared edits', () => {
  const presets = [{ id:'p', name:'P', backgroundMode:'color' as const, backgroundColor:'red', frameWidth:9, iconEffect:'rotate' as const }];
  const stage = { appearanceSource:'preset' as const, appearanceId:'p', overrideBackground:true, backgroundMode:'color' as const, backgroundColor:'blue' };
  assert.equal(resolveAppearance(stage, presets).backgroundColor, 'blue');
  assert.equal(resolveAppearance(stage, presets).frameWidth, 9);
  assert.equal(resolveAppearance(stage, presets).iconEffect, 'rotate');
  presets[0].backgroundColor = 'green';
  assert.equal(resolveAppearance({ ...stage, overrideBackground:false }, presets).backgroundColor, 'green');
  assert.equal(copyAppearanceGroup(resolveAppearance(stage,presets),'frame').frameWidth,9);
  assert.equal(copyAppearanceGroup(resolveAppearance(stage,presets),'frame').backgroundColor,undefined);
});
test('stage level chooses appearance even without a displayed grade label; hidden stages expose nothing', () => {
  const levels = DEFAULT_LEVELS.map(l => ({ ...l, appearanceId:l.id }));
  const stages = presetStages('a').map(s => ({ ...s, appearanceSource:'level' as const, levelMode:'custom' as const, levelId:'gold', showLevel:false }));
  const c = catalog(levels, [{ id:'a',name:'A',levelId:'bronze' }], stages, [], [
    { id:'bronze', name:'Bronze', frameWidth:3 }, { id:'gold',name:'Gold',frameWidth:10,frameImage:'ui/secret.png' },
  ]);
  const entry = entries(c, [{ id:'a',stageId:'revealed' }])[0];
  assert.equal(entry.levelId,''); assert.equal(entry.appearance?.frameWidth,10);
  assert.deepEqual(entries(c,[{id:'a',stageId:'hidden'}]),[]);
});
test('missing references keep the native appearance and local overrides; referenced presets cannot be deleted', () => {
  const stage = { appearanceSource:'preset' as const, appearanceId:'missing', overrideFrame:true, frameMode:'line' as const, frameWidth:8 };
  const a = resolveAppearance(stage,[]);
  assert.equal(a.backgroundMode,'template');assert.equal(a.frameWidth,8);
  assert.equal(appearanceInUse('missing',[],[stage]),true);
  assert.equal(appearanceInUse('missing',[{appearanceId:'missing'}],[]),true);
  assert.equal(appearanceInUse('missing',[],[]),false);
});
test('appearance ids, enums, focal points and gradient angles are validated', () => {
  assert.throws(() => catalog(DEFAULT_LEVELS,[],[],[],[{id:'a',name:'A'},{id:'a',name:'B'}]), /重复/);
  assert.throws(() => cardAppearance({backgroundX:101}),/超出范围/);
  assert.throws(() => cardAppearance({backgroundAngle:361}),/超出范围/);
  assert.throws(() => cardAppearance({frameRepeat:'execute' as never}),/无效/);
  assert.equal(cardAppearance({backgroundMode:'gradient',backgroundAngle:360,frameRepeat:'round'}).frameRepeat,'round');
});
