import test from 'node:test';
import assert from 'node:assert/strict';
import { cardAppearance } from '../src/card-style.ts';
import { catalog, DEFAULT_LEVELS, entries, presetStages } from '../src/model.ts';

test('slice coordinates and display thickness are independent and bounded', () => {
  const a = cardAppearance({ frameMode: 'nineSlice', sliceTop: 32, frameWidth: 7 });
  assert.equal(a.sliceTop, 32); assert.equal(a.frameWidth, 7);
  assert.throws(() => cardAppearance({ frameWidth: -1 }), /超出范围/);
  assert.throws(() => cardAppearance({ effectDuration: Infinity }), /超出范围/);
  assert.throws(() => cardAppearance({ frameMode: 'execute' as never }), /无效/);
});
test('appearance belongs to current stage and no other stage assets leak into player data', () => {
  const stages = presetStages('a');
  stages[1] = { ...stages[1], backgroundMode: 'color', backgroundColor: 'gray' };
  stages[2] = { ...stages[2], frameMode: 'nineSlice', frameImage: 'ui/secret.png', iconEffect: 'rotate' };
  const c = catalog(DEFAULT_LEVELS, [{ id: 'a', name: 'A', levelId: 'bronze' }], stages);
  const first = entries(c, []);
  assert.equal(first[0].appearance?.backgroundColor, 'gray');
  assert.ok(!JSON.stringify(first).includes('secret.png'));
  const next = entries(c, [{ id: 'a', stageId: 'revealed' }]);
  assert.equal(next[0].appearance?.frameImage, 'ui/secret.png');
  assert.equal(next[0].appearance?.backgroundMode, 'template');
  assert.deepEqual(entries(c, [{ id: 'a', stageId: 'hidden' }]), []);
});
