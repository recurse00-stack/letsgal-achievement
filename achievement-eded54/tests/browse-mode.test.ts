import test from 'node:test';
import assert from 'node:assert/strict';
import { bindBrowseMode, browseChoices } from '../src/browse-mode.ts';

function fixture(initial: unknown = 'pagination', missingList = false) {
  let value = initial;
  const writes: string[] = [];
  const clicks = new Map<string, () => void>();
  const properties = new Map<string, Record<string, unknown>>();
  const hidden = new Map<string, boolean>();
  const view: any = { get: (id: string) => missingList && id === 'achievement-list' ? null : ({
    setProps: (patch: Record<string, unknown>) => properties.set(id, { ...properties.get(id), ...patch }),
    setHidden: (value: boolean) => hidden.set(id, value),
    on: (_event: string, fn: () => void) => { clicks.set(id, fn); return () => { clicks.delete(id); }; },
  }) };
  const preference = { read: () => value, write: (next: string) => { value = next; writes.push(next); } };
  return { view, preference, writes, clicks, properties, hidden };
}
const bindPlayer = (f: ReturnType<typeof fixture>) => bindBrowseMode(f.view, f.preference, { policy: 'player' });

test('player switches the same list and saves only changed preferences', () => {
  const f = fixture(); const stop = bindPlayer(f);
  assert.equal(f.properties.get('achievement-list')?.navigationMode, 'pagination');
  f.clicks.get('achievement-mode-scroll')!();
  assert.equal(f.properties.get('achievement-list')?.navigationMode, 'scroll');
  assert.equal(f.properties.get('achievement-mode-scroll')?.text, '纵向滚动 ✓');
  f.clicks.get('achievement-mode-scroll')!();
  f.clicks.get('achievement-mode-pagination')!();
  assert.deepEqual(f.writes, ['scroll', 'pagination']); stop();
});
test('reopening restores player choice without writing it again', () => {
  const f = fixture(); let stop = bindPlayer(f);
  f.clicks.get('achievement-mode-scroll')!(); stop();
  stop = bindPlayer(f);
  assert.equal(f.properties.get('achievement-list')?.navigationMode, 'scroll');
  assert.deepEqual(f.writes, ['scroll']); stop();
});
test('unknown saved preference falls back without overwriting stored data', () => {
  const f = fixture('future-mode'); const stop = bindPlayer(f);
  assert.equal(f.properties.get('achievement-list')?.navigationMode, 'pagination');
  assert.deepEqual(f.writes, []); stop();
});
test('closing releases clicks and ignores stale event callbacks', () => {
  const f = fixture(); const stop = bindPlayer(f);
  const stale = f.clicks.get('achievement-mode-scroll')!; stop(); stop(); stale();
  assert.equal(f.clicks.size, 0); assert.deepEqual(f.writes, []);
});
test('custom page without the list reference keeps its own behavior', () => {
  const f = fixture('scroll', true); bindPlayer(f)();
  assert.equal(f.properties.size, 0); assert.equal(f.clicks.size, 0); assert.deepEqual(f.writes, []);
});

test('fixed author modes hide switches, ignore player preference and bind no clicks', () => {
  for (const mode of ['pagination', 'scroll']) {
    const f = fixture(mode === 'pagination' ? 'scroll' : 'pagination');
    bindBrowseMode(f.view, f.preference, { policy: mode })();
    assert.equal(f.properties.get('achievement-list')?.navigationMode, mode);
    assert.equal(f.hidden.get('achievement-mode-pagination'), true);
    assert.equal(f.hidden.get('achievement-mode-scroll'), true);
    assert.equal(f.clicks.size, 0); assert.deepEqual(f.writes, []);
  }
});
test('absent or unknown author policy safely defaults to fixed pagination', () => {
  for (const options of [undefined, { policy: 'invalid' }]) {
    const f = fixture('scroll'); bindBrowseMode(f.view, f.preference, options)();
    assert.equal(f.properties.get('achievement-list')?.navigationMode, 'pagination');
    assert.equal(f.clicks.size, 0); assert.deepEqual(f.writes, []);
  }
});
test('author default applies only before a valid player choice', () => {
  for (const saved of ['', 'future-mode']) {
    const f = fixture(saved);
    bindBrowseMode(f.view, f.preference, { policy: 'player', defaultMode: 'scroll' })();
    assert.equal(f.properties.get('achievement-list')?.navigationMode, 'scroll');
    assert.equal(f.hidden.get('achievement-mode-scroll'), false);
    assert.deepEqual(f.writes, []);
  }
  const f = fixture('pagination');
  bindBrowseMode(f.view, f.preference, { policy: 'player', defaultMode: 'scroll' })();
  assert.equal(f.properties.get('achievement-list')?.navigationMode, 'pagination');
});
test('reenabling player choice restores preference preserved by a fixed mode', () => {
  const f = fixture('scroll');
  bindBrowseMode(f.view, f.preference, { policy: 'pagination' })();
  bindPlayer(f)();
  assert.equal(f.properties.get('achievement-list')?.navigationMode, 'scroll');
  assert.equal(f.hidden.get('achievement-mode-pagination'), false);
  assert.deepEqual(f.writes, []);
});

test('all seven nonempty creator subsets expose only their chosen controls', () => {
  const modes = ['pagination', 'scroll', 'horizontal'] as const;
  for (let mask = 1; mask < 8; mask++) {
    const options = { policy: 'player', allowPagination: !!(mask & 1), allowVertical: !!(mask & 2), allowHorizontal: !!(mask & 4) };
    const allowed = modes.filter((_, i) => mask & (1 << i));
    assert.deepEqual(browseChoices(options), allowed);
    const f = fixture('horizontal');
    const states: boolean[] = []; let disposals = 0;
    const stop = bindBrowseMode(f.view, f.preference, options, { setEnabled: on => states.push(on), dispose: () => disposals++ });
    for (const key of modes) assert.equal(f.hidden.get('achievement-mode-' + key), allowed.length === 1 || !allowed.includes(key));
    assert.equal(f.clicks.size, allowed.length > 1 ? allowed.length : 0);
    assert.deepEqual(f.writes, []);
    stop(); stop(); assert.equal(disposals, 1);
  }
});

test('disabled saved mode falls back without clearing preference and can be reopened later', () => {
  const f = fixture('horizontal');
  bindBrowseMode(f.view, f.preference, { policy: 'player', defaultMode: 'scroll' })();
  assert.equal(f.properties.get('achievement-list')?.navigationMode, 'scroll');
  let on = false;
  const stop = bindBrowseMode(f.view, f.preference, { policy: 'player', allowHorizontal: true }, { setEnabled: v => { on = v; }, dispose() {} });
  assert.equal(on, true); assert.deepEqual(f.writes, []); stop();
});

test('horizontal is a true scroll layout and switching restores native pagination', () => {
  const f = fixture('pagination'); const states: boolean[] = [];
  const stop = bindBrowseMode(f.view, f.preference, { policy: 'player', allowHorizontal: true }, { setEnabled: v => states.push(v), dispose() {} });
  f.clicks.get('achievement-mode-horizontal')!();
  assert.equal(f.properties.get('achievement-list')?.navigationMode, 'scroll');
  assert.equal(f.properties.get('achievement-mode-horizontal')?.text, '横向滚动 ✓');
  f.clicks.get('achievement-mode-pagination')!();
  assert.equal(f.properties.get('achievement-list')?.navigationMode, 'pagination');
  assert.deepEqual(states, [false, true, false]); assert.deepEqual(f.writes, ['horizontal', 'pagination']); stop();
});

test('fixed horizontal ignores old preferences; malformed empty selection has safe navigation', () => {
  const f = fixture('scroll'); let on = false;
  const stop = bindBrowseMode(f.view, f.preference, { policy: 'horizontal' }, { setEnabled: v => { on = v; }, dispose() {} });
  assert.equal(on, true); assert.equal(f.clicks.size, 0); assert.deepEqual(f.writes, []); stop();
  assert.deepEqual(browseChoices({ policy: 'player', allowPagination: false, allowVertical: false, allowHorizontal: false }), ['pagination']);
});
