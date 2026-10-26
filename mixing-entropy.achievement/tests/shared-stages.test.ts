import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog, defaultsFor, DEFAULT_LEVELS, entries, presetStages, stagesFor, setDisplayStage, readInfo } from '../src/model.ts';

const items = [{ id: 'a', name: 'A', description: 'A说明', icon: 'a.svg', levelId: 'bronze' }, { id: 'b', name: 'B', description: 'B说明', icon: 'b.svg', levelId: 'silver' }];
const defaults = defaultsFor().map(s => s.id === 'unknown' ? { ...s, displayName: '尚未达成', description: '继续探索' } : s);

test('shared defaults supply each achievement while base contents remain owned by each achievement', () => {
  const defs = catalog(DEFAULT_LEVELS, items, [], defaults);
  assert.deepEqual(entries(defs, []).map(s => s.name), ['尚未达成', '尚未达成']);
  const revealed = entries(defs, items.map(a => ({ id: a.id, stageId: 'revealed' })));
  assert.deepEqual(revealed.map(a => [a.name, a.description, a.icon, a.levelName]), [['A','A说明','a.svg','铜'], ['B','B说明','b.svg','银']]);
});

test('a local override is isolated; removing it resumes current shared defaults', () => {
  const override = { ...presetStages('a')[1], displayName: 'A的线索' };
  const newer = defaults.map(s => ({ ...s, displayName: '新的共用提示' }));
  const defs = catalog(DEFAULT_LEVELS, items, [override], newer);
  assert.deepEqual(entries(defs, []).map(s => s.name), ['A的线索', '新的共用提示']);
  assert.deepEqual(entries(catalog(DEFAULT_LEVELS, items, [], newer), []).map(s => s.name), ['新的共用提示', '新的共用提示']);
});

test('local stage removal hides it from options and rejects transition only for that achievement', () => {
  const removal = { achievementId: 'a', id: 'revealed', disabled: true };
  const defs = catalog(DEFAULT_LEVELS, items, [removal], defaults);
  assert.deepEqual(stagesFor(defs, 'a').map(s => s.id), ['hidden', 'unknown']);
  assert.ok(stagesFor(defs, 'b').some(s => s.id === 'revealed'));
  assert.deepEqual(stagesFor(defs, 'missing'), []);
  assert.throws(() => setDisplayStage(defs, [], 'a', 'revealed'), /找不到展示阶段/);
  assert.deepEqual(entries(defs, [{id:'a',stageId:'revealed'}]).map(s => s.id), ['b']);
});

test('removing a shared default keeps a complete local override and never resurrects builtins', () => {
  const shared = defaults.filter(s => s.id !== 'revealed');
  const override = { ...presetStages('a')[2], name: 'A独有完成阶段', levelMode: 'custom' as const, levelId: 'gold' };
  const defs = catalog(DEFAULT_LEVELS, items, [override], shared);
  assert.ok(stagesFor(defs, 'a').some(s => s.id === 'revealed'));
  assert.ok(!stagesFor(defs, 'b').some(s => s.id === 'revealed'));
  assert.equal(readInfo(defs, [{id:'a',stageId:'revealed'}], 'a', 'levelName'), '金');
});

test('new shared stages appear everywhere but local additions stay isolated', () => {
  const clue = { ...defaults[1], id: 'clue', name: '提示' };
  const local = { ...presetStages('a')[2], id: 'master', name: '大师' };
  const defs = catalog(DEFAULT_LEVELS, items, [local], [...defaults, clue]);
  assert.ok(stagesFor(defs, 'a').some(s => s.id === 'clue'));
  assert.ok(stagesFor(defs, 'b').some(s => s.id === 'clue'));
  assert.ok(!stagesFor(defs, 'b').some(s => s.id === 'master'));
  assert.throws(() => setDisplayStage(defs, [], 'b', 'master'), /找不到展示阶段/);
});

test('removed initial stages, duplicate defaults and broken levels fail before mutation', () => {
  assert.throws(() => catalog(DEFAULT_LEVELS, items, [{achievementId:'a',id:'unknown',disabled:true}], defaults), /初始阶段不存在/);
  assert.throws(() => catalog(DEFAULT_LEVELS, items, [], defaults.filter(s => s.id !== 'unknown')), /初始阶段不存在/);
  assert.throws(() => catalog(DEFAULT_LEVELS, items, [], [...defaults,defaults[0]]), /重复/);
  assert.throws(() => catalog(DEFAULT_LEVELS, items, [], [{...defaults[1],levelMode:'custom',levelId:'missing'}]), /等级不存在/);
  const defs = catalog(DEFAULT_LEVELS, items, [{achievementId:'a',id:'revealed',disabled:true,levelMode:'custom',levelId:'removed'}], defaults);
  assert.ok(!stagesFor(defs,'a').some(s => s.id === 'revealed'));
});
