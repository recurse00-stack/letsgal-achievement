import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import { build } from 'esbuild';

test('stage blocks fold beyond eight, keep selection while filtering and protect context deletion', async () => {
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
    await build({entryPoints:[fileURLToPath(new URL('../src/stage-picker.tsx',import.meta.url))],outfile:`${temp}/stage-picker.mjs`,bundle:true,platform:'node',format:'esm',jsx:'automatic',external:['react','react-dom','@chakra-ui/react'],plugins:[{name:'studio-hook',setup(b){b.onResolve({filter:/^@avg-studio\/studio-ui$/},()=>({path:'studio',namespace:'stub'}));b.onLoad({filter:/.*/,namespace:'stub'},()=>({contents:'export const useSetting=()=>{throw Error("unexpected setting access")};'}));}}],logLevel:'silent'});
    const React = await import('react');
    act = React.act;
    const { createRoot } = await import('react-dom/client');
    const { ChakraProvider, defaultSystem } = await import('@chakra-ui/react');
    const { StagePicker } = await import(pathToFileURL(`${temp}/stage-picker.mjs`).href);
    const removed: string[] = [];
    const selected: string[] = [];
    function Harness() {
      const [stages, setStages] = React.useState([{ id: 'initial', name: 'Initial' }, { id: 'custom', name: 'Custom' }, { id: 'other', name: 'Other' }, ...Array.from({length:6},(_,i)=>({id:'extra'+i,name:'Extra '+i}))]);
      const [value, setValue] = React.useState('initial');
      return React.createElement(ChakraProvider, { value: defaultSystem }, React.createElement(StagePicker, {
        stages, value, initialStageId:'initial', onChange: (id: string) => { selected.push(id); setValue(id); },
        removalReason: (id: string) => id === 'initial' ? '初始阶段不可删除' : '',
        onRemove: (id: string) => { removed.push(id); setStages(rows => rows.filter(row => row.id !== id)); },
      }));
    }
    const settle = async (action: () => void) => { await act!(async () => { action(); }); await act!(async () => { await new Promise(resolve => setTimeout(resolve, 80)); }); };
    const find = (selector: string) => win.document.querySelector<HTMLElement>(selector);
    const list = () => find('.aw-stage-blocks');
    const toggle = () => find('.aw-stage-toggle');
    const collapsed = () => find('.aw-stage-strip')!.getAttribute('data-collapsed');
    const menu = () => find('[role="menu"][data-state="open"]');
    const row = (id: string) => find(`[data-stage-id="${id}"]`)!;
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
    assert.equal(collapsed(),'true');assert.equal(list()!.querySelectorAll('button').length,9);
    assert.equal(find('[role="combobox"]'),null,'large stage sets remain blocks');
    await click(toggle()!);assert.equal(collapsed(),'false');
    const search=find('input[aria-label="搜索阶段"]')!;
    await settle(()=>{Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype,'value')!.set!.call(search,'extra5');search.dispatchEvent(new win.Event('input',{bubbles:true}));});
    assert.equal(list()!.querySelectorAll('button').length,1);assert.deepEqual(selected,[],'search does not select a stage');
    await click(row('extra5'));assert.deepEqual(selected,['extra5']);
    Object.defineProperty(list()!,'clientWidth',{configurable:true,value:100});
    list()!.getBoundingClientRect=()=>({left:0,right:75,width:75}) as DOMRect;
    row('extra5').getBoundingClientRect=()=>({left:100,right:150,width:50}) as DOMRect;
    await click(toggle()!);assert.equal(collapsed(),'true');assert.equal(row('extra5').getAttribute('aria-current'),'page');
    assert.equal(list()!.scrollLeft,100,'selected stage is revealed using unscaled scroll coordinates');
    await click(toggle()!);
    await settle(()=>{const e=find('input[aria-label="搜索阶段"]')!;Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype,'value')!.set!.call(e,'');e.dispatchEvent(new win.Event('input',{bubbles:true}));});
    await settle(() => context('custom'));
    assert.ok(menu());assert.equal(collapsed(),'false','right-click preserves expansion');
    assert.deepEqual(selected,['extra5'],'right-click preserves selection');
    await click(menu()!.querySelector<HTMLElement>('[role="menuitem"]')!);
    assert.deepEqual(removed,['custom']);assert.ok(list());assert.equal(row('custom'),null);
    assert.equal(toggle(),null,'eight remaining stages need no fold control');
    assert.equal(row('extra5').getAttribute('aria-current'),'page');
    await settle(() => context('initial'));
    assert.equal(menu()!.querySelector('[role="menuitem"]')?.getAttribute('aria-disabled'),'true');
    await click(menu()!.querySelector<HTMLElement>('[role="menuitem"]')!);assert.deepEqual(removed,['custom']);
    await settle(()=>menu()!.dispatchEvent(new win.KeyboardEvent('keydown',{key:'Escape',bubbles:true})));assert.equal(menu(),null);
    await settle(()=>context('other'));
    await settle(()=>{const outside=find('#outside')!;pointer(outside);outside.focus();outside.click();});
    assert.equal(menu(),null);assert.ok(list(),'stage blocks remain after menu dismissal');
    await click(row('other'));assert.deepEqual(selected,['extra5','other']);
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
