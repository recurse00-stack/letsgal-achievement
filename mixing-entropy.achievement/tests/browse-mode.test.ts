import test from 'node:test';
import assert from 'node:assert/strict';
import { bindBrowseMode, browseChoices, BROWSE_MODES, type BrowseOptions } from '../src/browse-mode.ts';

function fixture(initial: unknown = '', missingList = false) {
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
const bindPlayer = (f: ReturnType<typeof fixture>) => bindBrowseMode(f.view, f.preference, {
  authoredMode: 'pagination', allowPlayerSwitch: true, allowVertical: true,
});

test('opening uses the official default without rewriting native list props', () => {
  for (const authoredMode of ['pagination', 'scroll']) {
    const f = fixture(authoredMode === 'pagination' ? 'scroll' : 'pagination');
    bindBrowseMode(f.view, f.preference, { authoredMode })();
    assert.equal(f.properties.has('achievement-list'), false);
    assert.equal(f.clicks.size, 0);
    assert.ok(BROWSE_MODES.every(key => f.hidden.get('achievement-mode-' + key) === true));
    assert.deepEqual(f.writes, []);
  }
});

test('player switches the same list and saves only changed preferences', () => {
  const f = fixture(); const stop = bindPlayer(f);
  assert.equal(f.properties.has('achievement-list'), false);
  f.clicks.get('achievement-mode-scroll')!();
  assert.equal(f.properties.get('achievement-list')?.navigationMode, 'scroll');
  assert.equal(f.properties.get('achievement-mode-scroll')?.text, '纵向滚动 ✓');
  f.clicks.get('achievement-mode-scroll')!();
  f.clicks.get('achievement-mode-pagination')!();
  assert.equal(f.properties.get('achievement-list')?.navigationMode, 'pagination');
  assert.deepEqual(f.writes, ['scroll', 'pagination']); stop();
});

test('reopening restores an allowed player choice without writing it again', () => {
  const f = fixture(); let stop = bindPlayer(f);
  f.clicks.get('achievement-mode-scroll')!(); stop();
  stop = bindPlayer(f);
  assert.equal(f.properties.get('achievement-list')?.navigationMode, 'scroll');
  assert.deepEqual(f.writes, ['scroll']); stop();
});

test('unknown or no-longer-allowed player preference returns to official default', () => {
  for (const saved of ['', 'future-mode', 'horizontal']) {
    const f = fixture(saved); const stop = bindPlayer(f);
    assert.equal(f.properties.has('achievement-list'), false);
    assert.equal(f.properties.get('achievement-mode-pagination')?.text, '翻页 ✓');
    assert.deepEqual(f.writes, []); stop();
  }
});

test('closing releases clicks and ignores stale event callbacks', () => {
  const f = fixture(); const stop = bindPlayer(f);
  const stale = f.clicks.get('achievement-mode-scroll')!; stop(); stop(); stale();
  assert.equal(f.clicks.size, 0); assert.deepEqual(f.writes, []);
});

test('page without the list reference keeps its own behavior', () => {
  const f = fixture('scroll', true); bindPlayer(f)();
  assert.equal(f.properties.size, 0); assert.equal(f.clicks.size, 0); assert.deepEqual(f.writes, []);
});

test('unreadable official mode never guesses or forces pagination', () => {
  for (const authoredMode of [undefined, 'future-mode']) {
    const f = fixture('pagination'); let disposals = 0;
    const stop = bindBrowseMode(f.view, f.preference, { authoredMode, allowPlayerSwitch: true, allowHorizontal: true }, {
      setEnabled: () => assert.fail('must not apply enhanced navigation'), dispose: () => disposals++,
    });
    assert.equal(f.properties.size, 0); assert.equal(f.clicks.size, 0);
    assert.ok(BROWSE_MODES.every(key => f.hidden.get('achievement-mode-' + key) === true));
    stop(); assert.equal(disposals, 1);
  }
});

test('old extension policy and default are ignored even when they conflict with the page', () => {
  const options = { authoredMode: 'scroll', policy: 'pagination', defaultMode: 'pagination' };
  const f = fixture('pagination'); bindBrowseMode(f.view, f.preference, options)();
  assert.deepEqual(browseChoices(options), ['scroll']);
  assert.equal(f.properties.has('achievement-list'), false);
  assert.deepEqual(f.writes, []);
});

test('all extra choice combinations retain the official default and expose only allowed modes', () => {
  for (const authoredMode of ['pagination', 'scroll']) for (const scrollDirection of ['vertical', 'horizontal']) {
    const initial = authoredMode === 'scroll' && scrollDirection === 'horizontal' ? 'horizontal' : authoredMode;
    for (let mask = 0; mask < 8; mask++) {
      const options: BrowseOptions = { authoredMode, scrollDirection, allowPlayerSwitch: true,
        allowPagination: !!(mask & 1), allowVertical: !!(mask & 2), allowHorizontal: !!(mask & 4) };
      const allowed = [initial, ...BROWSE_MODES.filter((key, i) => key !== initial && mask & (1 << i))];
      assert.deepEqual(browseChoices(options), allowed);
      const f = fixture('horizontal'); let disposals = 0;
      const stop = bindBrowseMode(f.view, f.preference, options, { setEnabled() {}, dispose: () => disposals++ });
      for (const key of BROWSE_MODES) assert.equal(f.hidden.get('achievement-mode-' + key), allowed.length === 1 || !allowed.includes(key));
      assert.equal(f.clicks.size, allowed.length > 1 ? allowed.length : 0);
      assert.deepEqual(f.writes, []); stop(); stop(); assert.equal(disposals, 1);
    }
  }
});

test('horizontal direction only affects a native scroll default, not pagination', () => {
  for (const authoredMode of ['pagination', 'scroll']) {
    const f = fixture('scroll'); const enabled: boolean[] = [];
    bindBrowseMode(f.view, f.preference, { authoredMode, scrollDirection: 'horizontal' }, {
      setEnabled: value => enabled.push(value), dispose() {},
    })();
    assert.equal(f.properties.has('achievement-list'), false);
    assert.deepEqual(enabled, [authoredMode === 'scroll']);
    assert.equal(f.clicks.size, 0);
  }
});

test('horizontal player choice switches to scroll and can return to official pagination', () => {
  const f = fixture(); const states: boolean[] = [];
  const stop = bindBrowseMode(f.view, f.preference, { authoredMode: 'pagination', allowPlayerSwitch: true, allowHorizontal: true }, {
    setEnabled: value => states.push(value), dispose() {},
  });
  f.clicks.get('achievement-mode-horizontal')!();
  assert.equal(f.properties.get('achievement-list')?.navigationMode, 'scroll');
  assert.equal(f.properties.get('achievement-mode-horizontal')?.text, '横向滚动 ✓');
  f.clicks.get('achievement-mode-pagination')!();
  assert.equal(f.properties.get('achievement-list')?.navigationMode, 'pagination');
  assert.deepEqual(states, [false, true, false]); assert.deepEqual(f.writes, ['horizontal', 'pagination']); stop();
});

test('disabling player switching ignores preference without erasing it', () => {
  const f = fixture('scroll');
  bindBrowseMode(f.view, f.preference, { authoredMode: 'pagination', allowPlayerSwitch: false, allowVertical: true })();
  assert.equal(f.properties.has('achievement-list'), false);
  bindPlayer(f)();
  assert.equal(f.properties.get('achievement-list')?.navigationMode, 'scroll');
  assert.deepEqual(f.writes, []);
});
