import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_LEVELS, defaultsFor, presetStages, resolveStages } from '../src/model.ts';
import { defaultRemovalReason, localRemovalReason, removeDefaultStage, removeLocalStage } from '../src/stage-removal.ts';

const item = { id: 'a', name: 'A', levelId: 'bronze', initialStageId: 'unknown' };
const defaults = defaultsFor();
test('deleting a clicked custom stage preserves other stages and other achievements', () => {
  const one = { ...presetStages('a')[1], id: 'one' };
  const two = { ...one, id: 'two' };
  const other = { ...one, achievementId: 'b' };
  const saved = [one, two, other];
  const next = removeLocalStage(item, defaults, saved, 'one');
  assert.deepEqual(next, [two, other]);
  assert.equal(saved.length, 3);
});
test('deleting inherited stage excludes only the owner and can be restored', () => {
  const next = removeLocalStage(item, defaults, [], 'hidden');
  assert.equal(next[0].disabled, true);
  assert.equal(resolveStages('a', defaults, next).some(s => s.id === 'hidden'), false);
  assert.equal(resolveStages('b', defaults, next).some(s => s.id === 'hidden'), true);
  assert.equal(resolveStages('a', defaults, []).some(s => s.id === 'hidden'), true);
});
test('initial, last, and stale context targets reject without deleting anything', () => {
  assert.throws(() => removeLocalStage(item, defaults, [], 'unknown'), /初始阶段/);
  assert.throws(() => removeLocalStage(item, defaults, [], 'missing'), /不存在/);
  const last = [presetStages('a')[2]];
  assert.match(localRemovalReason(item, last, 'revealed'), /至少保留/);
  assert.throws(() => removeDefaultStage([defaults[2]], [], [], DEFAULT_LEVELS, 'revealed'), /至少保留/);
});
test('shared deletion respects initial dependencies but retains complete local overrides', () => {
  assert.match(defaultRemovalReason(defaults, [item], [], 'unknown'), /初始阶段/);
  assert.throws(() => removeDefaultStage(defaults, [item], [], DEFAULT_LEVELS, 'unknown'), /初始阶段/);
  const own = [presetStages('a')[1]];
  const next = removeDefaultStage(defaults, [item], own, DEFAULT_LEVELS, 'unknown');
  assert.equal(next.some(s => s.id === 'unknown'), false);
  assert.equal(resolveStages('a', next, own).some(s => s.id === 'unknown'), true);
});
