import test from 'node:test';
import assert from 'node:assert/strict';
import { StageProgress } from '../src/stage-progress.ts';

const saved = (achievementId: string, stageId: string) => ({ achievementId, stageId });
const envelope = (...records: unknown[]) => [{ schemaVersion: 1, records }];

function fixture(initial: unknown = []) {
  const state = { value: initial, writes: 0, ended: false, restoring: false };
  const hooks = { afterWrite: () => {} };
  const progress = new StageProgress({
    get: () => state.value,
    set: (_, value) => { state.value = structuredClone(value); state.writes++; hooks.afterWrite(); },
  }, () => { if (state.ended) throw Error('ended'); }, () => state.restoring);
  return { state, hooks, progress };
}

test('first run establishes shared progress automatically, including a valid empty save', () => {
  const f = fixture();
  assert.deepEqual(f.progress.read(), []);
  assert.deepEqual(f.state.value, envelope());
  assert.deepEqual(f.progress.read(), []);
  assert.equal(f.state.writes, 1);
  const reopened = fixture(structuredClone(f.state.value));
  assert.deepEqual(reopened.progress.read(), []);
  assert.equal(reopened.state.writes, 0);
});

test('existing shared progress retains removed achievement and stage references', () => {
  const f = fixture(envelope(saved('removed', 'missing')));
  assert.deepEqual(f.progress.read(), [{ id: 'removed', stageId: 'missing' }]);
  assert.equal(f.state.writes, 0);
  f.progress.replace(f.progress.read(), [{ id: 'removed', stageId: 'missing' }, { id: 'new', stageId: 'shown' }]);
  assert.deepEqual(f.state.value, envelope(saved('removed', 'missing'), saved('new', 'shown')));
});

test('corrupted shared progress stays intact and prevents initialization or replacement', () => {
  const duplicate = [saved('one', 'hidden'), saved('one', 'revealed')];
  for (const bad of [null, {}, [null], [...envelope(), ...envelope()], [{ schemaVersion: 2, records: [] }], envelope(...duplicate), envelope(saved('', 'hidden'))]) {
    const f = fixture(bad);
    assert.throws(() => f.progress.read());
    assert.throws(() => f.progress.replace(undefined, []));
    assert.equal(f.state.writes, 0);
    assert.deepEqual(f.state.value, bad);
  }
});

test('restore and ended runs cannot initialize or alter shared progress', () => {
  const f = fixture();
  f.state.restoring = true;
  assert.deepEqual(f.progress.read(), []);
  assert.equal(f.state.writes, 0);
  assert.throws(() => f.progress.replace(undefined, []), /读档恢复/);
  f.state.restoring = false;
  f.progress.read();
  assert.equal(f.state.writes, 1);
  f.state.ended = true;
  assert.throws(() => f.progress.read(), /ended/);
  assert.throws(() => f.progress.replace([], []), /ended/);
  assert.equal(f.state.writes, 1);
});

test('external progress refreshes once, own writes avoid feedback and stale updates are rejected', () => {
  const f = fixture(envelope());
  const previous = f.progress.read();
  f.hooks.afterWrite = () => assert.equal(f.progress.changed(), false);
  f.progress.replace(previous, [{ id: 'one', stageId: 'unknown' }]);
  f.state.value = envelope(saved('two', 'new'));
  assert.equal(f.progress.changed(), true);
  assert.equal(f.progress.changed(), false);
  assert.throws(() => f.progress.replace(previous, []), /已变化/);
  assert.equal(f.state.writes, 1);
});
