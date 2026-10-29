import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import { transformWithEsbuild } from 'vite';

test('stage context menu keeps its list open, deletes the clicked row, and cancels cleanly', async () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div><button id="outside">Outside</button></body></html>', { pretendToBeVisual: true, url: 'http://localhost/' });
  const win = dom.window;
  const saved = new Map<string, PropertyDescriptor | undefined>();
  const install = (key: string, value: unknown) => {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  };
  for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node', 'Document', 'ShadowRoot', 'MutationObserver', 'CustomEvent', 'Event', 'KeyboardEvent', 'MouseEvent']) {
    install(key, key === 'window' ? win : (win as any)[key]);
  }
  install('getComputedStyle', win.getComputedStyle.bind(win));
  install('requestAnimationFrame', win.requestAnimationFrame.bind(win));
  install('cancelAnimationFrame', win.cancelAnimationFrame.bind(win));
  install('IS_REACT_ACT_ENVIRONMENT', true);
  const ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  install('ResizeObserver', ResizeObserver);
  (win as any).ResizeObserver = ResizeObserver;
  win.matchMedia = query => ({ matches: false, media: query, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => true, onchange: null });
  win.HTMLElement.prototype.scrollIntoView = () => {};
  win.HTMLElement.prototype.scrollTo = () => {};
  const temp = await mkdtemp(fileURLToPath(new URL('../.stage-picker-test-', import.meta.url)));
  let root: ReturnType<typeof import('react-dom/client')['createRoot']> | undefined;
  let act: typeof import('react')['act'] | undefined;
  try {
    const source = await readFile(new URL('../src/stage-picker.tsx', import.meta.url), 'utf8');
    const compiled = await transformWithEsbuild(source, 'stage-picker.tsx', { jsx: 'automatic' });
    await writeFile(`${temp}/stage-picker.mjs`, compiled.code);
    const React = await import('react');
    act = React.act;
    const { createRoot } = await import('react-dom/client');
    const { ChakraProvider, defaultSystem } = await import('@chakra-ui/react');
    const { StagePicker } = await import(pathToFileURL(`${temp}/stage-picker.mjs`).href);
    const removed: string[] = [];
    const selected: string[] = [];
    function Harness() {
      const [stages, setStages] = React.useState([{ id: 'initial', name: 'Initial' }, { id: 'custom', name: 'Custom' }, { id: 'other', name: 'Other' }]);
      const [value, setValue] = React.useState('initial');
      return React.createElement(ChakraProvider, { value: defaultSystem }, React.createElement(StagePicker, {
        stages, value, onChange: (id: string) => { selected.push(id); setValue(id); },
        removalReason: (id: string) => id === 'initial' ? '初始阶段不可删除' : '',
        onRemove: (id: string) => { removed.push(id); setStages(rows => rows.filter(row => row.id !== id)); },
      }));
    }
    const settle = async (action: () => void) => { await act!(async () => { action(); }); await act!(async () => { await new Promise(resolve => setTimeout(resolve, 80)); }); };
    const find = (selector: string) => win.document.querySelector<HTMLElement>(selector);
    const trigger = () => find('[aria-label="编辑阶段"]')!;
    const list = () => find('[role="listbox"][data-state="open"]');
    const menu = () => find('[role="menu"][data-state="open"]');
    const row = (id: string) => find(`[role="option"][data-value="${id}"]`)!;
    const pointer = (el: HTMLElement, button = 0) => el.dispatchEvent(new win.MouseEvent('pointerdown', { bubbles: true, button }));
    const click = async (el: HTMLElement) => {
      const hover = new win.MouseEvent('pointermove', { bubbles: true });
      Object.defineProperty(hover, 'pointerType', { value: 'mouse' });
      await settle(() => { el.dispatchEvent(hover); pointer(el); });
      await settle(() => el.click());
    };
    const context = (id: string) => { pointer(row(id), 2); row(id).dispatchEvent(new win.MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2, clientX: 900, clientY: 700 })); };
    root = createRoot(win.document.getElementById('root')!);
    await settle(() => root!.render(React.createElement(Harness)));
    await settle(() => trigger().click());
    assert.ok(list());
    await settle(() => context('custom'));
    assert.ok(list(), 'right-click must keep the stage list expanded');
    assert.ok(menu());
    assert.deepEqual(selected, [], 'right-click must not change the selected stage');
    await settle(() => menu()!.focus());
    assert.ok(list(), 'portalled menu focus must not dismiss the list');
    await click(menu()!.querySelector<HTMLElement>('[role="menuitem"]')!);
    assert.deepEqual(removed, ['custom'], 'delete the context target, not the selected initial stage');
    assert.ok(list(), 'keep the remaining stages visible after deletion');
    assert.equal(menu(), null);
    assert.equal(row('custom'), null);
    await settle(() => context('initial'));
    assert.equal(menu()!.querySelector('[role="menuitem"]')?.getAttribute('aria-disabled'), 'true');
    await click(menu()!.querySelector<HTMLElement>('[role="menuitem"]')!);
    assert.deepEqual(removed, ['custom'], 'protected stages cannot be deleted');
    await settle(() => menu()!.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    assert.equal(menu(), null);
    assert.ok(list(), 'Escape closes just the menu first');
    await settle(() => context('other'));
    await settle(() => { const outside = find('#outside')!; pointer(outside); outside.focus(); outside.click(); });
    assert.equal(menu(), null);
    assert.equal(list(), null, 'outside interaction closes both overlays');
    await settle(() => trigger().click());
    await settle(() => row('other').click());
    assert.deepEqual(selected, ['other'], 'ordinary left-click selection still works');
    assert.equal(list(), null);
  } finally {
    if (root && act) await act(async () => { root!.unmount(); });
    dom.window.close();
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
    assert.ok(temp.startsWith(fileURLToPath(new URL('../.stage-picker-test-', import.meta.url))));
    await rm(temp, { recursive: true, force: true });
  }
});
