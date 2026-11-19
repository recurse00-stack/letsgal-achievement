import test from 'node:test';
import assert from 'node:assert/strict';
import { NotificationBatcher, type BatchClock } from '../src/notification-queue.ts';
import { orderNotifications, parseNotificationRules, flattenNotificationRules, notificationDuration, effectiveNotificationMode } from '../src/notification-policy.ts';

function clock() {
  let now = 0, next = 0;
  const timers = new Map<number, { at: number; fn: () => void }>();
  const api: BatchClock = { schedule(fn, ms) { const id = ++next; timers.set(id, { at: now + ms, fn }); return id; }, cancel(id) { timers.delete(id as number); } };
  return { api, timers, advance(ms: number) { now += ms; for (const [id, timer] of [...timers]) if (timer.at <= now) { timers.delete(id); timer.fn(); } } };
}
test('first popup waits for the complete fixed window; late arrivals cannot join a sealed batch', async () => {
  const time = clock(); const played: Array<{ items: readonly number[]; mode: string }> = []; const release: (() => void)[] = [];
  let mode = 'sequential';
  const queue = new NotificationBatcher(() => ({ windowMs: 500, options: { mode } }), async (items, options) => { played.push({ items, mode: options.mode }); await new Promise<void>(r => release.push(r)); }, e => { throw e; }, time.api);
  queue.enqueue(1); time.advance(499); queue.enqueue(2); assert.deepEqual(played, []);
  mode = 'merged'; time.advance(1);
  assert.deepEqual(played, [{ items: [1, 2], mode: 'sequential' }]);
  queue.enqueue(3); time.advance(500); queue.enqueue(4);
  assert.equal(played.length, 1, 'another complete batch waits until the current one finishes');
  release.shift()!(); await new Promise(setImmediate);
  assert.deepEqual(played[1], { items: [3], mode: 'merged' });
  time.advance(500); release.shift()!(); await new Promise(setImmediate);
  assert.deepEqual(played[2], { items: [4], mode: 'merged' });
  release.shift()!(); queue.stop();
});
test('ending a run cancels collection, pending batches and the current playback', async () => {
  const time = clock(); let started = 0, aborted = false;
  const queue = new NotificationBatcher(() => ({ windowMs: 500, options: {} }), async (_, __, signal) => {
    started++; await new Promise<void>(resolve => signal.addEventListener('abort', () => { aborted = true; resolve(); }, { once: true }));
  }, () => {}, time.api);
  queue.enqueue(1); time.advance(500); queue.enqueue(2); time.advance(500); queue.enqueue(3); queue.stop();
  time.advance(500); await new Promise(setImmediate);
  assert.equal(started, 1); assert.equal(aborted, true); assert.equal(time.timers.size, 0);
});
test('sorting compares ordered properties, keeps ties stable and deduplicates achievements', () => {
  const items = [
    { id: 'a', stageId: 'first', levelId: 'bronze', generation: 1 },
    { id: 'b', stageId: 'revealed', levelId: 'gold', generation: 1 },
    { id: 'c', stageId: 'hint', levelId: 'gold', generation: 1 },
    { id: 'a', stageId: 'final', levelId: 'silver', generation: 2 },
    { id: 'd', stageId: 'unknown', levelId: 'custom', generation: 1 },
    { id: 'e', stageId: 'unknown', levelId: 'custom', generation: 1 },
  ];
  const rows = [{ field: 'level', value: 'gold' }, { field: 'level', value: 'silver' }, { field: 'stage', value: 'hint' }];
  const rules = parseNotificationRules(rows);
  assert.deepEqual(flattenNotificationRules(rules), rows);
  const ordered = orderNotifications(items, rules);
  assert.deepEqual(ordered.map(x => x.id), ['c', 'b', 'a', 'd', 'e']);
  assert.equal(ordered[2].stageId, 'final');
  assert.deepEqual(orderNotifications(items, []).map(x => x.id), ['a', 'b', 'c', 'd', 'e']);
  assert.deepEqual(orderNotifications(items, [{ field: 'achievement', values: ['e', 'a'] }]).map(x => x.id), ['e', 'a', 'b', 'c', 'd']);
  assert.throws(() => parseNotificationRules([{ field: 'level', value: 1 }]), /无效/);
});
test('duration ratio applies to every member including the first, never to a singleton', () => {
  assert.equal(notificationDuration(3000, 2, 67), 2010);
  assert.equal(notificationDuration(6000, 2, 67), 4020);
  assert.equal(notificationDuration(3000, 1, 67), 3000);
  assert.equal(notificationDuration(3000, 5, 100), 3000);
  assert.equal(notificationDuration(300, 2, 10), 30);
});
test('player mode is used only when switching is allowed; unknown preference follows creator', () => {
  assert.equal(effectiveNotificationMode('merged', false, 'sequential'), 'merged');
  assert.equal(effectiveNotificationMode('merged', true, 'sequential'), 'sequential');
  assert.equal(effectiveNotificationMode('merged', true, 'invalid'), 'merged');
});
